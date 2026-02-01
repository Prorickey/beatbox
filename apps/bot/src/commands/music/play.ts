import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { BeatboxClient } from "../../structures/Client";
import { trackAddedEmbed, errorEmbed, nowPlayingEmbed, playerButtons } from "../../utils/embeds";
import { broadcastState } from "../../handlers/socketHandler";

export const data = new SlashCommandBuilder()
  .setName("play")
  .setDescription("Play a song or add it to the queue")
  .addStringOption((option) =>
    option
      .setName("query")
      .setDescription("Song name or URL")
      .setRequired(true)
      .setAutocomplete(false)
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: BeatboxClient
) {
  const member = interaction.guild?.members.cache.get(interaction.user.id);
  const voiceChannel = member?.voice.channel;

  if (!voiceChannel) {
    await interaction.reply({
      embeds: [errorEmbed("You need to be in a voice channel to play music.")],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();
  const query = interaction.options.getString("query", true);

  try {
    const result = await client.kazagumo.search(query, {
      requester: {
        id: interaction.user.id,
        username: interaction.user.username,
        avatar: interaction.user.displayAvatarURL(),
      },
    });

    if (!result.tracks.length) {
      await interaction.editReply({
        embeds: [errorEmbed("No results found for your search.")],
      });
      return;
    }

    let player = client.kazagumo.players.get(interaction.guildId!);
    if (!player) {
      player = await client.kazagumo.createPlayer({
        guildId: interaction.guildId!,
        textId: interaction.channelId,
        voiceId: voiceChannel.id,
        volume: 80,
      });
    }

    if (result.type === "PLAYLIST") {
      for (const track of result.tracks) {
        player.queue.add(track);
      }
      await interaction.editReply({
        embeds: [
          trackAddedEmbed(
            {
              id: result.tracks[0].identifier,
              title: result.playlistName ?? "Playlist",
              author: `${result.tracks.length} tracks`,
              duration: result.tracks.reduce((a, t) => a + (t.length ?? 0), 0),
              uri: query,
              artworkUrl: result.tracks[0].thumbnail ?? null,
              sourceName: result.tracks[0].sourceName ?? "unknown",
              requester: {
                id: interaction.user.id,
                username: interaction.user.username,
                avatar: interaction.user.displayAvatarURL(),
              },
            },
            player.queue.length
          ),
        ],
      });
    } else {
      const track = result.tracks[0];
      player.queue.add(track);

      if (player.queue.length === 1 && !player.queue.current) {
        // Queue was empty, this will start playing
      } else {
        await interaction.editReply({
          embeds: [
            trackAddedEmbed(
              {
                id: track.identifier,
                title: track.title,
                author: track.author,
                duration: track.length ?? 0,
                uri: track.uri ?? "",
                artworkUrl: track.thumbnail ?? null,
                sourceName: track.sourceName ?? "unknown",
                requester: {
                  id: interaction.user.id,
                  username: interaction.user.username,
                  avatar: interaction.user.displayAvatarURL(),
                },
              },
              player.queue.length
            ),
          ],
        });
      }
    }

    if (!player.playing && !player.paused) {
      player.play();
    }

    broadcastState(client, interaction.guildId!);
  } catch (error) {
    console.error("Play command error:", error);
    await interaction.editReply({
      embeds: [errorEmbed("Failed to play the requested track.")],
    });
  }
}
