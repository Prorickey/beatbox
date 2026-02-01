import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { BeatboxClient } from "../../structures/Client";
import { errorEmbed, successEmbed } from "../../utils/embeds";
import { formatDuration } from "@beatbox/shared";
import { broadcastState } from "../../handlers/socketHandler";

export const data = new SlashCommandBuilder()
  .setName("seek")
  .setDescription("Seek to a position in the current track")
  .addIntegerOption((option) =>
    option
      .setName("seconds")
      .setDescription("Position in seconds")
      .setMinValue(0)
      .setRequired(true)
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: BeatboxClient
) {
  const player = client.kazagumo.players.get(interaction.guildId!);
  if (!player?.queue.current) {
    await interaction.reply({
      embeds: [errorEmbed("Nothing is playing right now.")],
      ephemeral: true,
    });
    return;
  }

  const seconds = interaction.options.getInteger("seconds", true);
  const ms = seconds * 1000;

  if (ms > (player.queue.current.length ?? 0)) {
    await interaction.reply({
      embeds: [errorEmbed("Cannot seek beyond the track duration.")],
      ephemeral: true,
    });
    return;
  }

  player.seek(ms);
  await interaction.reply({
    embeds: [successEmbed(`Seeked to **${formatDuration(ms)}**`)],
  });
  broadcastState(client, interaction.guildId!);
}
