import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { BeatboxClient } from "../../structures/Client";
import { errorEmbed, successEmbed } from "../../utils/embeds";
import { prisma } from "@beatbox/database";
import { broadcastState } from "../../handlers/socketHandler";
import { applyGuildSettings } from "../../utils/guildSettings";

export const data = new SlashCommandBuilder()
  .setName("loadqueue")
  .setDescription("Load a saved queue")
  .addStringOption((option) =>
    option
      .setName("name")
      .setDescription("Name of the saved queue to load")
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
      embeds: [errorEmbed("You need to be in a voice channel to load a queue.")],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  const name = interaction.options.getString("name", true);
  const userId = interaction.user.id;
  const guildId = interaction.guildId!;

  try {
    // Look up the saved queue
    const savedQueue = await prisma.savedQueue.findUnique({
      where: {
        userId_guildId_name: {
          userId,
          guildId,
          name,
        },
      },
      include: {
        tracks: {
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    if (!savedQueue) {
      await interaction.editReply({
        embeds: [
          errorEmbed(
            `No saved queue found with the name **${name}**. Use \`/savedqueues\` to see your saved queues.`
          ),
        ],
      });
      return;
    }

    if (savedQueue.tracks.length === 0) {
      await interaction.editReply({
        embeds: [errorEmbed("That saved queue is empty.")],
      });
      return;
    }

    // Cancel any pending disconnect timer
    const disconnectTimer = client.disconnectTimers.get(guildId);
    if (disconnectTimer) {
      clearTimeout(disconnectTimer);
      client.disconnectTimers.delete(guildId);
      console.log(`[loadqueue] Cancelled disconnect timer for guild ${guildId}`);
    }

    // Get or create player
    let player = client.kazagumo.players.get(guildId);
    if (!player) {
      player = await client.kazagumo.createPlayer({
        guildId,
        textId: interaction.channelId,
        voiceId: voiceChannel.id,
        volume: 80,
      });
      await applyGuildSettings(player, guildId);
    }

    // Resolve and add each track
    let addedCount = 0;
    let failedCount = 0;

    for (const savedTrack of savedQueue.tracks) {
      try {
        const result = await client.kazagumo.search(savedTrack.uri, {
          requester: {
            id: interaction.user.id,
            username: interaction.user.username,
            avatar: interaction.user.displayAvatarURL(),
          },
        });

        if (result.tracks.length > 0) {
          player.queue.add(result.tracks[0]);
          addedCount++;
          console.log(
            `[loadqueue] Added track: "${savedTrack.title}" from queue "${name}"`
          );
        } else {
          failedCount++;
          console.warn(
            `[loadqueue] Failed to resolve track: "${savedTrack.title}" (${savedTrack.uri})`
          );
        }
      } catch (err) {
        failedCount++;
        console.error(
          `[loadqueue] Error resolving track "${savedTrack.title}":`,
          err
        );
      }
    }

    // Start playing if not already
    if (!player.playing && !player.paused) {
      player.play();
    }

    broadcastState(client, guildId);

    const message =
      failedCount > 0
        ? `Loaded queue **${name}**: ${addedCount} track${addedCount === 1 ? "" : "s"} added, ${failedCount} failed.`
        : `Loaded queue **${name}** with ${addedCount} track${addedCount === 1 ? "" : "s"}.`;

    await interaction.editReply({
      embeds: [successEmbed(message)],
    });

    console.log(
      `[loadqueue] User ${userId} loaded queue "${name}" in guild ${guildId}: ${addedCount} added, ${failedCount} failed`
    );
  } catch (error) {
    console.error("Load queue error:", error);
    await interaction.editReply({
      embeds: [errorEmbed("Failed to load the queue. Please try again.")],
    });
  }
}
