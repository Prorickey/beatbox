import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { BeatboxClient } from "../../structures/Client";
import { errorEmbed, successEmbed } from "../../utils/embeds";
import { formatDuration } from "@beatbox/shared";
import { broadcastState } from "../../handlers/socketHandler";
import { isDJOrPermitted } from "../../utils/djCheck";

export const data = new SlashCommandBuilder()
  .setName("forward")
  .setDescription("Jump forward in the current track")
  .addIntegerOption((option) =>
    option
      .setName("seconds")
      .setDescription("Number of seconds to jump forward (default: 10)")
      .setMinValue(1)
      .setMaxValue(300)
      .setRequired(false)
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

  if (!(await isDJOrPermitted(interaction, client))) return;

  const seconds = interaction.options.getInteger("seconds") ?? 10;
  const currentPosition = player.position;
  const trackLength = player.queue.current.length ?? 0;
  const newPosition = Math.min(currentPosition + seconds * 1000, trackLength);

  if (newPosition >= trackLength) {
    await interaction.reply({
      embeds: [errorEmbed("Cannot forward beyond the track duration.")],
      ephemeral: true,
    });
    return;
  }

  player.seek(newPosition);
  await interaction.reply({
    embeds: [successEmbed(`Forwarded **${seconds}s** to **${formatDuration(newPosition)}**`)],
  });
  broadcastState(client, interaction.guildId!);
}
