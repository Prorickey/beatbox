import { SlashCommandBuilder, type ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { BeatboxClient } from "../../structures/Client";
import { errorEmbed } from "../../utils/embeds";
import { prisma } from "@beatbox/database";
import { EMBED_COLORS, formatDuration } from "@beatbox/shared";

export const data = new SlashCommandBuilder()
  .setName("savedqueues")
  .setDescription("List all your saved queues for this server");

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: BeatboxClient
) {
  await interaction.deferReply();

  const userId = interaction.user.id;
  const guildId = interaction.guildId!;

  try {
    const savedQueues = await prisma.savedQueue.findMany({
      where: {
        userId,
        guildId,
      },
      include: {
        tracks: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (savedQueues.length === 0) {
      await interaction.editReply({
        embeds: [
          errorEmbed(
            "You don't have any saved queues in this server yet. Use `/savequeue <name>` to save one!"
          ),
        ],
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.PRIMARY)
      .setAuthor({ name: "Your Saved Queues 💾" })
      .setDescription(
        savedQueues
          .map((queue, index) => {
            const totalDuration = queue.tracks.reduce(
              (sum, track) => sum + track.duration,
              0
            );
            const trackCount = queue.tracks.length;
            const createdDate = queue.createdAt.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return [
              `**${index + 1}. ${queue.name}**`,
              `\`${trackCount}\` track${trackCount === 1 ? "" : "s"} • ${formatDuration(totalDuration)} • Created ${createdDate}`,
            ].join("\n");
          })
          .join("\n\n")
      )
      .setFooter({
        text: `Total: ${savedQueues.length} saved queue${savedQueues.length === 1 ? "" : "s"} | Use /loadqueue <name> to load one`,
      });

    await interaction.editReply({ embeds: [embed] });

    console.log(
      `[savedqueues] User ${userId} listed ${savedQueues.length} saved queues in guild ${guildId}`
    );
  } catch (error) {
    console.error("List saved queues error:", error);
    await interaction.editReply({
      embeds: [errorEmbed("Failed to retrieve your saved queues. Please try again.")],
    });
  }
}
