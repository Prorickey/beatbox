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
  .setName("move")
  .setDescription("Move a track from one position to another in the queue")
  .addIntegerOption((option) =>
    option
      .setName("from")
      .setDescription("The position to move from")
      .setMinValue(1)
      .setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName("to")
      .setDescription("The position to move to")
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

  const from = interaction.options.getInteger("from", true);
  const to = interaction.options.getInteger("to", true);

  // Validate positions are within bounds
  if (from < 1 || from > player.queue.length) {
    await interaction.reply({
      embeds: [
        errorEmbed(
          `Invalid "from" position. Must be between 1 and ${player.queue.length}.`
        ),
      ],
      ephemeral: true,
    });
    return;
  }

  if (to < 1 || to > player.queue.length) {
    await interaction.reply({
      embeds: [
        errorEmbed(
          `Invalid "to" position. Must be between 1 and ${player.queue.length}.`
        ),
      ],
      ephemeral: true,
    });
    return;
  }

  if (from === to) {
    await interaction.reply({
      embeds: [errorEmbed("The track is already at that position.")],
      ephemeral: true,
    });
    return;
  }

  // Convert to 0-based indices
  const fromIndex = from - 1;
  const toIndex = to - 1;

  // Get the track being moved
  const track = player.queue[fromIndex];

  // Remove from old position and insert at new position
  player.queue.remove(fromIndex);
  player.queue.splice(toIndex, 0, track);

  await interaction.reply({
    embeds: [
      successEmbed(
        `Moved **${truncate(track.title, 50)}** from position ${from} to position ${to}.`
      ),
    ],
  });

  broadcastState(client, interaction.guildId!);
}
