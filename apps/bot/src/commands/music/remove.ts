import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import type { BeatboxClient } from "../../structures/Client";
import { errorEmbed, successEmbed } from "../../utils/embeds";
import { isDJOrPermitted } from "../../utils/djCheck";
import { broadcastState } from "../../handlers/socketHandler";
import { truncate } from "@beatbox/shared";

export const data = new SlashCommandBuilder()
  .setName("remove")
  .setDescription("Remove a specific track from the queue")
  .addIntegerOption((option) =>
    option
      .setName("position")
      .setDescription("The position of the track to remove")
      .setMinValue(1)
      .setRequired(true)
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

  const position = interaction.options.getInteger("position", true);

  // Validate position is within bounds
  if (position < 1 || position > player.queue.length) {
    await interaction.reply({
      embeds: [
        errorEmbed(
          `Invalid position. Must be between 1 and ${player.queue.length}.`
        ),
      ],
      ephemeral: true,
    });
    return;
  }

  // Convert to 0-based index
  const index = position - 1;

  // Get the track before removing
  const track = player.queue[index];

  // Remove the track
  player.queue.remove(index);

  await interaction.reply({
    embeds: [
      successEmbed(
        `Removed **${truncate(track.title, 50)}** from position ${position}.`
      ),
    ],
  });

  broadcastState(client, interaction.guildId!);
}
