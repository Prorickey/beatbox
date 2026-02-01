import { SlashCommandBuilder, type ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import type { BeatboxClient } from "../../structures/Client";
import { successEmbed, errorEmbed } from "../../utils/embeds";
import { prisma } from "@beatbox/database";

export const data = new SlashCommandBuilder()
  .setName("247")
  .setDescription("Toggle 24/7 mode (bot stays in voice channel even when alone)")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: BeatboxClient
) {
  if (!interaction.guildId) {
    await interaction.reply({
      embeds: [errorEmbed("This command can only be used in a server.")],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  try {
    // Get current 24/7 setting
    const currentSettings = await prisma.guildSettings.findUnique({
      where: { guildId: interaction.guildId },
    });

    const currentTwentyFourSeven = currentSettings?.twentyFourSeven ?? false;
    const newTwentyFourSeven = !currentTwentyFourSeven;

    // Upsert the guild settings with the new value
    await prisma.guildSettings.upsert({
      where: { guildId: interaction.guildId },
      update: {
        twentyFourSeven: newTwentyFourSeven,
      },
      create: {
        guildId: interaction.guildId,
        twentyFourSeven: newTwentyFourSeven,
      },
    });

    console.log(
      `[247] Guild ${interaction.guildId} 24/7 mode ${newTwentyFourSeven ? "enabled" : "disabled"}`
    );

    await interaction.editReply({
      embeds: [
        successEmbed(
          `24/7 mode is now **${newTwentyFourSeven ? "enabled" : "disabled"}**.${
            newTwentyFourSeven
              ? " The bot will stay in the voice channel even when everyone leaves."
              : " The bot will pause and disconnect after 5 minutes when everyone leaves."
          }`
        ),
      ],
    });
  } catch (error) {
    console.error("247 command error:", error);
    await interaction.editReply({
      embeds: [errorEmbed("Failed to toggle 24/7 mode.")],
    });
  }
}
