import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { BeatboxClient } from "../../structures/Client";
import { errorEmbed, successEmbed } from "../../utils/embeds";
import { broadcastState } from "../../handlers/socketHandler";

export const data = new SlashCommandBuilder()
  .setName("skip")
  .setDescription("Skip the current track");

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

  const title = player.queue.current.title;
  player.skip();
  await interaction.reply({
    embeds: [successEmbed(`Skipped **${title}**`)],
  });
  broadcastState(client, interaction.guildId!);
}
