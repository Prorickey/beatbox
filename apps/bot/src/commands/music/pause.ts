import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { BeatboxClient } from "../../structures/Client";
import { errorEmbed, successEmbed } from "../../utils/embeds";
import { broadcastState } from "../../handlers/socketHandler";
import { isDJOrPermitted } from "../../utils/djCheck";

export const data = new SlashCommandBuilder()
  .setName("pause")
  .setDescription("Pause or resume the player");

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

  const isPaused = !player.paused;
  player.pause(isPaused);

  await interaction.reply({
    embeds: [successEmbed(isPaused ? "Paused the player ⏸" : "Resumed the player ▶️")],
  });
  broadcastState(client, interaction.guildId!);
}
