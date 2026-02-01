import {
  type ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
} from "discord.js";
import type { BeatboxClient } from "../structures/Client";
import { errorEmbed } from "./embeds";
import { prisma } from "@beatbox/database";

export async function isDJOrPermitted(
  interaction: ChatInputCommandInteraction,
  client: BeatboxClient,
  silent = false
): Promise<boolean> {
  // Get guild settings to check for DJ role
  const guildSettings = await prisma.guild.findUnique({
    where: { id: interaction.guildId! },
    select: { djRoleId: true },
  });

  // If no DJ role is set, everyone is permitted
  if (!guildSettings?.djRoleId) {
    return true;
  }

  const member = interaction.guild?.members.cache.get(interaction.user.id);
  if (!member) {
    return false;
  }

  // Admins always bypass (ManageGuild permission)
  if (member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    return true;
  }

  // Check if user has the DJ role
  if (member.roles.cache.has(guildSettings.djRoleId)) {
    return true;
  }

  // Check if user is alone with the bot in the voice channel
  const voiceChannel = member.voice.channel;
  if (voiceChannel && voiceChannel.type === ChannelType.GuildVoice) {
    const members = voiceChannel.members.filter((m) => !m.user.bot);
    if (members.size === 1) {
      // Only the user is in the VC (besides bots)
      return true;
    }
  }

  // User doesn't meet any of the requirements
  if (!silent) {
    await interaction.reply({
      embeds: [
        errorEmbed(
          `You need the <@&${guildSettings.djRoleId}> role to use this command.`
        ),
      ],
      ephemeral: true,
    });
  }

  return false;
}
