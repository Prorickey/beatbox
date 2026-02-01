import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { BeatboxClient } from "../../structures/Client";
import { errorEmbed, successEmbed } from "../../utils/embeds";
import { prisma } from "@beatbox/database";

const MAX_TRACKS = 200;

export const data = new SlashCommandBuilder()
  .setName("savequeue")
  .setDescription("Save the current queue as a named snapshot")
  .addStringOption((option) =>
    option
      .setName("name")
      .setDescription("Name for the saved queue")
      .setRequired(true)
      .setMaxLength(50)
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: BeatboxClient
) {
  const player = client.kazagumo.players.get(interaction.guildId!);

  if (!player || !player.queue.current) {
    await interaction.reply({
      embeds: [errorEmbed("There is no music currently playing.")],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  const name = interaction.options.getString("name", true);
  const userId = interaction.user.id;
  const guildId = interaction.guildId!;

  try {
    // Collect all tracks: current + queue
    const allTracks = [player.queue.current, ...player.queue];

    if (allTracks.length > MAX_TRACKS) {
      await interaction.editReply({
        embeds: [
          errorEmbed(
            `Queue is too large. Maximum ${MAX_TRACKS} tracks allowed, but you have ${allTracks.length}.`
          ),
        ],
      });
      return;
    }

    // Delete existing saved queue with the same name (if any)
    await prisma.savedQueue.deleteMany({
      where: {
        userId,
        guildId,
        name,
      },
    });

    // Create new saved queue with tracks
    const savedQueue = await prisma.savedQueue.create({
      data: {
        name,
        userId,
        guildId,
        tracks: {
          create: allTracks.map((track, index) => ({
            title: track.title,
            author: track.author,
            duration: track.length ?? 0,
            uri: track.uri ?? "",
            artworkUrl: track.thumbnail ?? null,
            sourceName: track.sourceName ?? "unknown",
            position: index,
          })),
        },
      },
    });

    await interaction.editReply({
      embeds: [
        successEmbed(
          `Saved queue **${name}** with ${allTracks.length} track${allTracks.length === 1 ? "" : "s"}.`
        ),
      ],
    });

    console.log(
      `[savequeue] User ${userId} saved queue "${name}" in guild ${guildId} with ${allTracks.length} tracks (ID: ${savedQueue.id})`
    );
  } catch (error) {
    console.error("Save queue error:", error);
    await interaction.editReply({
      embeds: [errorEmbed("Failed to save the queue. Please try again.")],
    });
  }
}
