import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  PermissionFlagsBits,
} from "discord.js";
import type { BeatboxClient } from "../../structures/Client";
import { errorEmbed, successEmbed } from "../../utils/embeds";
import { prisma } from "@beatbox/database";

export const data = new SlashCommandBuilder()
  .setName("setdj")
  .setDescription("Set or clear the DJ role for music controls")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addRoleOption((option) =>
    option
      .setName("role")
      .setDescription("The role to set as DJ")
      .setRequired(false)
  )
  .addBooleanOption((option) =>
    option
      .setName("clear")
      .setDescription("Clear the DJ role requirement")
      .setRequired(false)
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: BeatboxClient
) {
  const role = interaction.options.getRole("role");
  const clear = interaction.options.getBoolean("clear") ?? false;

  if (clear) {
    // Clear the DJ role
    try {
      await prisma.guild.upsert({
        where: { id: interaction.guildId! },
        update: { djRoleId: null },
        create: {
          id: interaction.guildId!,
          name: interaction.guild?.name ?? "Unknown",
          iconUrl: interaction.guild?.iconURL() ?? null,
          djRoleId: null,
        },
      });

      await interaction.reply({
        embeds: [
          successEmbed(
            "DJ role requirement cleared. Everyone can now use music controls."
          ),
        ],
      });
    } catch (error) {
      console.error("Error clearing DJ role:", error);
      await interaction.reply({
        embeds: [errorEmbed("Failed to clear DJ role. Please try again.")],
        ephemeral: true,
      });
    }
    return;
  }

  if (!role) {
    await interaction.reply({
      embeds: [
        errorEmbed(
          "Please provide a role to set as DJ or use the `clear` option."
        ),
      ],
      ephemeral: true,
    });
    return;
  }

  try {
    await prisma.guild.upsert({
      where: { id: interaction.guildId! },
      update: { djRoleId: role.id },
      create: {
        id: interaction.guildId!,
        name: interaction.guild?.name ?? "Unknown",
        iconUrl: interaction.guild?.iconURL() ?? null,
        djRoleId: role.id,
      },
    });

    await interaction.reply({
      embeds: [
        successEmbed(
          `DJ role set to ${role}. Users with this role (or Manage Guild permission) can control the music player.`
        ),
      ],
    });
  } catch (error) {
    console.error("Error setting DJ role:", error);
    await interaction.reply({
      embeds: [errorEmbed("Failed to set DJ role. Please try again.")],
      ephemeral: true,
    });
  }
}
