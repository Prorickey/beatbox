import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { BeatboxClient } from "../../structures/Client";
import { errorEmbed, successEmbed } from "../../utils/embeds";
import { broadcastState } from "../../handlers/socketHandler";
import { isDJOrPermitted } from "../../utils/djCheck";

export const data = new SlashCommandBuilder()
  .setName("repeat")
  .setDescription("Set the repeat mode")
  .addStringOption((option) =>
    option
      .setName("mode")
      .setDescription("Repeat mode")
      .setRequired(true)
      .addChoices(
        { name: "Off", value: "off" },
        { name: "Track", value: "track" },
        { name: "Queue", value: "queue" }
      )
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

  if (!(await isDJOrPermitted(interaction, client))) return;

  const mode = interaction.options.getString("mode", true);
  player.setLoop(mode as any);

  const icons = { off: "➡️", track: "🔂", queue: "🔁" };
  await interaction.reply({
    embeds: [
      successEmbed(
        `${icons[mode as keyof typeof icons]} Repeat mode set to **${mode}**`
      ),
    ],
  });
  broadcastState(client, interaction.guildId!);
}
