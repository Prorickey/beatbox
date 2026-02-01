import {
  SlashCommandBuilder,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import type { BeatboxClient } from "../../structures/Client";
import { prisma } from "@beatbox/database";
import { EMBED_COLORS } from "@beatbox/shared";
import { errorEmbed } from "../../utils/embeds";

const DAILY_FEEDBACK_LIMIT = 20;
const OWNER_USER_ID = "584562497332314131";

export const data = new SlashCommandBuilder()
  .setName("feedback")
  .setDescription("Send feedback to the developers")
  .addStringOption((option) =>
    option
      .setName("message")
      .setDescription("Your feedback message")
      .setMaxLength(1000)
      .setRequired(false)
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
  _client: BeatboxClient
) {
  const message = interaction.options.getString("message");

  // With a message: submit feedback
  if (message) {
    try {
      // Rate limit: count today's feedback from this user
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);

      const todayCount = await prisma.feedback.count({
        where: {
          userId: interaction.user.id,
          createdAt: { gte: todayStart },
        },
      });

      if (todayCount >= DAILY_FEEDBACK_LIMIT) {
        await interaction.reply({
          embeds: [
            errorEmbed(
              `You've reached the daily feedback limit (${DAILY_FEEDBACK_LIMIT}). Please try again tomorrow.`
            ),
          ],
          ephemeral: true,
        });
        return;
      }

      await prisma.feedback.create({
        data: {
          userId: interaction.user.id,
          username: interaction.user.username,
          message,
        },
      });

      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.PRIMARY)
        .setDescription("Thanks for your feedback!");

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error("[feedback] Error submitting feedback:", error);
      await interaction.reply({
        embeds: [errorEmbed("Failed to submit feedback. Please try again later.")],
        ephemeral: true,
      });
    }
    return;
  }

  // Without a message, owner: show a random unread feedback
  if (interaction.user.id === OWNER_USER_ID) {
    try {
      const unreadCount = await prisma.feedback.count({
        where: { read: false },
      });

      if (unreadCount === 0) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(EMBED_COLORS.INFO)
              .setDescription("No unread feedback."),
          ],
          ephemeral: true,
        });
        return;
      }

      const randomSkip = Math.floor(Math.random() * unreadCount);
      const feedbackItems = await prisma.feedback.findMany({
        where: { read: false },
        skip: randomSkip,
        take: 1,
      });

      const feedback = feedbackItems[0];
      if (!feedback) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(EMBED_COLORS.INFO)
              .setDescription("No unread feedback."),
          ],
          ephemeral: true,
        });
        return;
      }

      // Mark as read
      await prisma.feedback.update({
        where: { id: feedback.id },
        data: { read: true },
      });

      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.PRIMARY)
        .setTitle("Unread Feedback")
        .setDescription(feedback.message)
        .addFields(
          { name: "From", value: feedback.username, inline: true },
          {
            name: "Date",
            value: feedback.createdAt.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
            inline: true,
          }
        )
        .setFooter({
          text: `${unreadCount - 1} unread remaining`,
        });

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error("[feedback] Error reading feedback:", error);
      await interaction.reply({
        embeds: [errorEmbed("Failed to fetch feedback.")],
        ephemeral: true,
      });
    }
    return;
  }

  // Without a message, normal user: show usage info
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.INFO)
    .setDescription(
      "Use `/feedback <message>` to send feedback to the developers."
    );

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
