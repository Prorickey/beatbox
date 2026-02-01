import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import type { BeatboxClient } from "../../structures/Client";
import { errorEmbed, successEmbed } from "../../utils/embeds";
import { isDJOrPermitted } from "../../utils/djCheck";
import { broadcastState } from "../../handlers/socketHandler";

export const data = new SlashCommandBuilder()
  .setName("removedupes")
  .setDescription("Remove duplicate tracks from the queue");

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

  // Track seen URIs and indices to remove
  const seenUris = new Set<string>();
  const indicesToRemove: number[] = [];

  // Iterate through queue and find duplicates
  for (let i = 0; i < player.queue.length; i++) {
    const track = player.queue[i];
    if (seenUris.has(track.uri!)) {
      // Duplicate found
      indicesToRemove.push(i);
    } else {
      // First occurrence
      seenUris.add(track.uri!);
    }
  }

  if (indicesToRemove.length === 0) {
    await interaction.reply({
      embeds: [successEmbed("No duplicate tracks found in the queue.")],
      ephemeral: true,
    });
    return;
  }

  // Remove duplicates in reverse order to avoid index shifting
  for (let i = indicesToRemove.length - 1; i >= 0; i--) {
    player.queue.remove(indicesToRemove[i]);
  }

  await interaction.reply({
    embeds: [
      successEmbed(
        `Removed ${indicesToRemove.length} duplicate track${indicesToRemove.length === 1 ? "" : "s"} from the queue.`
      ),
    ],
  });

  broadcastState(client, interaction.guildId!);
}
