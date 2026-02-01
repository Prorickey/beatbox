import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { BeatboxClient } from "../../structures/Client";
import { errorEmbed, successEmbed } from "../../utils/embeds";
import { broadcastState } from "../../handlers/socketHandler";
import { applyGuildSettings } from "../../utils/guildSettings";
import { prisma } from "@beatbox/database";

export const data = new SlashCommandBuilder()
  .setName("requeue")
  .setDescription("Restore the queue from the last session before disconnect");

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: BeatboxClient
) {
  const member = interaction.guild?.members.cache.get(interaction.user.id);
  const voiceChannel = member?.voice.channel;

  if (!voiceChannel) {
    await interaction.reply({
      embeds: [errorEmbed("You need to be in a voice channel to use this command.")],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  try {
    // Look up the last saved queue for this guild
    const lastQueue = await prisma.lastQueue.findUnique({
      where: { guildId: interaction.guildId! },
      include: {
        tracks: {
          orderBy: { position: "asc" },
        },
      },
    });

    if (!lastQueue || lastQueue.tracks.length === 0) {
      await interaction.editReply({
        embeds: [errorEmbed("No saved queue found. The queue is automatically saved when the player is destroyed.")],
      });
      return;
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

    const requester = {
      id: interaction.user.id,
      username: interaction.user.username,
      avatar: interaction.user.displayAvatarURL(),
    };

    // Resolve and add tracks
    let addedCount = 0;
    let failedCount = 0;
    const wasPlayingTrack = lastQueue.tracks.find((t) => t.wasPlaying);

    for (const savedTrack of lastQueue.tracks) {
      try {
        const result = await client.kazagumo.search(savedTrack.uri, { requester });

        if (result.tracks.length > 0) {
          player.queue.add(result.tracks[0]);
          addedCount++;
          console.log(`[requeue] Added: "${savedTrack.title}" by ${savedTrack.author}`);
        } else {
          console.warn(`[requeue] No results for: "${savedTrack.title}" (${savedTrack.uri})`);
          failedCount++;
        }
      } catch (err) {
        console.error(`[requeue] Failed to search for "${savedTrack.title}":`, err);
        failedCount++;
      }
    }

    // Start playing if not already
    if (!player.playing && !player.paused) {
      player.play();
    }

    broadcastState(client, interaction.guildId!);

    // Delete the saved queue after loading
    await prisma.lastQueue.delete({
      where: { guildId: interaction.guildId! },
    });

    const trackInfo = wasPlayingTrack
      ? `Starting from **${wasPlayingTrack.title}**`
      : `${addedCount} track${addedCount === 1 ? "" : "s"}`;

    const failedInfo = failedCount > 0 ? `\n(${failedCount} track${failedCount === 1 ? "" : "s"} could not be loaded)` : "";

    await interaction.editReply({
      embeds: [successEmbed(`Restored queue with ${trackInfo}${failedInfo}`)],
    });
  } catch (error) {
    console.error("Requeue command error:", error);
    await interaction.editReply({
      embeds: [errorEmbed("Failed to restore the queue.")],
    });
  }
}
