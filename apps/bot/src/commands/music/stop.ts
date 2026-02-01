import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { BeatboxClient } from "../../structures/Client";
import { errorEmbed, successEmbed } from "../../utils/embeds";
import { broadcastState } from "../../handlers/socketHandler";

export const data = new SlashCommandBuilder()
  .setName("stop")
  .setDescription("Stop the player and clear the queue");

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

  player.destroy();
  await interaction.reply({
    embeds: [successEmbed("Stopped the player and cleared the queue.")],
  });
  broadcastState(client, interaction.guildId!);
}
