import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ComponentType,
  EmbedBuilder,
} from "discord.js";
import type { BeatboxClient } from "../../structures/Client";
import { trackAddedEmbed, errorEmbed } from "../../utils/embeds";
import { broadcastState } from "../../handlers/socketHandler";
import { applyGuildSettings } from "../../utils/guildSettings";
import { EMBED_COLORS, formatDuration } from "@beatbox/shared";

export const data = new SlashCommandBuilder()
  .setName("search")
  .setDescription("Search for music and select from results")
  .addStringOption((option) =>
    option
      .setName("query")
      .setDescription("Song name or search term")
      .setRequired(true)
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: BeatboxClient
) {
  const member = interaction.guild?.members.cache.get(interaction.user.id);
  const voiceChannel = member?.voice.channel;

  if (!voiceChannel) {
    await interaction.reply({
      embeds: [errorEmbed("You need to be in a voice channel to search for music.")],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();
  const query = interaction.options.getString("query", true);

  try {
    console.log(`[search] Searching for: "${query}"`);
    const result = await client.kazagumo.search(query, {
      requester: {
        id: interaction.user.id,
        username: interaction.user.username,
        avatar: interaction.user.displayAvatarURL(),
      },
    });
    console.log(`[search] Search result: type=${result.type}, tracks=${result.tracks.length}`);

    if (!result.tracks.length) {
      console.warn(`[search] No tracks found for query: "${query}"`);
      await interaction.editReply({
        embeds: [errorEmbed("No results found for your search.")],
      });
      return;
    }

    // Limit to 5 results
    const tracks = result.tracks.slice(0, 5);

    // Create search results embed
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.PRIMARY)
      .setAuthor({ name: "Search Results 🔍" })
      .setDescription(
        tracks
          .map((track, index) => {
            const title = track.title.length > 60 ? `${track.title.substring(0, 60)}...` : track.title;
            const author = track.author.length > 30 ? `${track.author.substring(0, 30)}...` : track.author;
            const duration = formatDuration(track.length ?? 0);
            return `**${index + 1}.** [${title}](${track.uri})\n    by ${author} — ${duration}`;
          })
          .join("\n\n")
      )
      .setFooter({ text: "Select a track from the menu below" });

    // Create select menu
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("search_select")
      .setPlaceholder("Choose a track to add to queue")
      .addOptions(
        tracks.map((track, index) => ({
          label: track.title.length > 100 ? `${track.title.substring(0, 97)}...` : track.title,
          description: `by ${track.author.substring(0, 100)}`,
          value: index.toString(),
        }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    const reply = await interaction.editReply({
      embeds: [embed],
      components: [row],
    });

    // Create collector
    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      filter: (i) => i.user.id === interaction.user.id,
      max: 1,
      time: 30000,
    });

    collector.on("collect", async (selectInteraction) => {
      await selectInteraction.deferUpdate();

      const selectedIndex = parseInt(selectInteraction.values[0]);
      const selectedTrack = tracks[selectedIndex];

      // Cancel any pending disconnect timer
      const disconnectTimer = client.disconnectTimers.get(interaction.guildId!);
      if (disconnectTimer) {
        clearTimeout(disconnectTimer);
        client.disconnectTimers.delete(interaction.guildId!);
        console.log(`[search] Cancelled disconnect timer for guild ${interaction.guildId}`);
      }

      // Get or create player
      let player = client.kazagumo.players.get(interaction.guildId!);
      if (!player) {
        player = await client.kazagumo.createPlayer({
          guildId: interaction.guildId!,
          textId: interaction.channelId,
          voiceId: voiceChannel.id,
          volume: 80,
        });
        await applyGuildSettings(player, interaction.guildId!);
      }

      // Add track to queue
      player.queue.add(selectedTrack);
      console.log(`[search] Added track: "${selectedTrack.title}" to queue`);

      // Start playing if not already playing
      if (!player.playing && !player.paused) {
        player.play();
      }

      // Broadcast state update
      broadcastState(client, interaction.guildId!);

      // Update reply with success message
      await interaction.editReply({
        embeds: [
          trackAddedEmbed(
            {
              id: selectedTrack.identifier,
              title: selectedTrack.title,
              author: selectedTrack.author,
              duration: selectedTrack.length ?? 0,
              uri: selectedTrack.uri ?? "",
              artworkUrl: selectedTrack.thumbnail ?? null,
              sourceName: selectedTrack.sourceName ?? "unknown",
              requester: {
                id: interaction.user.id,
                username: interaction.user.username,
                avatar: interaction.user.displayAvatarURL(),
              },
            },
            player.queue.length
          ),
        ],
        components: [],
      });
    });

    collector.on("end", async (collected) => {
      if (collected.size === 0) {
        // Timeout - remove components
        await interaction.editReply({
          components: [],
        });
      }
    });
  } catch (error) {
    console.error("Search command error:", error);
    await interaction.editReply({
      embeds: [errorEmbed("Failed to search for tracks.")],
    });
  }
}
