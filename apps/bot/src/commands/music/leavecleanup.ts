import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  ChannelType,
} from "discord.js";
import type { BeatboxClient } from "../../structures/Client";
import { errorEmbed, successEmbed } from "../../utils/embeds";
import { isDJOrPermitted } from "../../utils/djCheck";
import { broadcastState } from "../../handlers/socketHandler";

export const data = new SlashCommandBuilder()
  .setName("leavecleanup")
  .setDescription(
    "Remove tracks requested by users who left the voice channel"
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: BeatboxClient
) {
  const player = client.kazagumo.players.get(interaction.guildId!);

  if (!player || player.queue.length === 0) {
    await interaction.reply({
      embeds: [errorEmbed("The queue is empty.")],
      ephemeral: true,
    });
    return;
  }

  // Check DJ permission
  const permitted = await isDJOrPermitted(interaction, client);
  if (!permitted) {
    return;
  }

  // Get the bot's voice channel
  const guild = interaction.guild!;
  const botMember = guild.members.cache.get(client.user!.id);
  const voiceChannel = botMember?.voice.channel;

  if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
    await interaction.reply({
      embeds: [errorEmbed("I'm not in a voice channel.")],
      ephemeral: true,
    });
    return;
  }

  // Get the set of user IDs currently in the voice channel
  const currentMemberIds = new Set(
    voiceChannel.members
      .filter((m) => !m.user.bot)
      .map((m) => m.id)
  );

  // Find tracks where the requester has left
  const indicesToRemove: number[] = [];
  for (let i = 0; i < player.queue.length; i++) {
    const track = player.queue[i];
    const requesterId = (track.requester as any)?.id;

    // If the requester ID is not in the current member list, mark for removal
    if (requesterId && !currentMemberIds.has(requesterId)) {
      indicesToRemove.push(i);
    }
  }

  if (indicesToRemove.length === 0) {
    await interaction.reply({
      embeds: [
        successEmbed("No tracks from users who left the voice channel."),
      ],
      ephemeral: true,
    });
    return;
  }

  // Remove tracks in reverse order to avoid index shifting
  for (let i = indicesToRemove.length - 1; i >= 0; i--) {
    player.queue.remove(indicesToRemove[i]);
  }

  await interaction.reply({
    embeds: [
      successEmbed(
        `Removed ${indicesToRemove.length} track${indicesToRemove.length === 1 ? "" : "s"} from users who left the voice channel.`
      ),
    ],
  });

  broadcastState(client, interaction.guildId!);
}
