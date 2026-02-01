import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { BeatboxClient } from "../../structures/Client";
import { errorEmbed, successEmbed } from "../../utils/embeds";
import { broadcastState } from "../../handlers/socketHandler";

export const data = new SlashCommandBuilder()
  .setName("volume")
  .setDescription("Set the player volume")
  .addIntegerOption((option) =>
    option
      .setName("level")
      .setDescription("Volume level (0-100)")
      .setMinValue(0)
      .setMaxValue(100)
      .setRequired(true)
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: BeatboxClient
) {
  const player = client.kazagumo.players.get(interaction.guildId!);
  if (!player) {
    await interaction.reply({
      embeds: [errorEmbed("No active player in this server.")],
      ephemeral: true,
    });
    return;
  }

  const volume = interaction.options.getInteger("level", true);
  player.setVolume(volume);

  const icon = volume === 0 ? "🔇" : volume < 50 ? "🔉" : "🔊";
  await interaction.reply({
    embeds: [successEmbed(`${icon} Volume set to **${volume}%**`)],
  });
  broadcastState(client, interaction.guildId!);
}
