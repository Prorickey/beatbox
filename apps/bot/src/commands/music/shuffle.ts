import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { BeatboxClient } from "../../structures/Client";
import { errorEmbed, successEmbed } from "../../utils/embeds";
import { broadcastState } from "../../handlers/socketHandler";
import { isDJOrPermitted } from "../../utils/djCheck";

export const data = new SlashCommandBuilder()
  .setName("shuffle")
  .setDescription("Shuffle the current queue");

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: BeatboxClient
) {
  const player = client.kazagumo.players.get(interaction.guildId!);
  if (!player || player.queue.length < 2) {
    await interaction.reply({
      embeds: [errorEmbed("Not enough tracks in the queue to shuffle.")],
      ephemeral: true,
    });
    return;
  }

  if (!(await isDJOrPermitted(interaction, client))) return;

  player.queue.shuffle();
  await interaction.reply({
    embeds: [successEmbed(`Shuffled **${player.queue.length}** tracks 🔀`)],
  });
  broadcastState(client, interaction.guildId!);
}
