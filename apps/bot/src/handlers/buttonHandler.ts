import type { ButtonInteraction } from "discord.js";
import type { BeatboxClient } from "../structures/Client";
import { errorEmbed, successEmbed } from "../utils/embeds";
import { broadcastState } from "./socketHandler";

export async function handleButton(
  interaction: ButtonInteraction,
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

  const member = interaction.guild?.members.cache.get(interaction.user.id);
  if (!member?.voice.channel) {
    await interaction.reply({
      embeds: [errorEmbed("You need to be in a voice channel.")],
      ephemeral: true,
    });
    return;
  }

  switch (interaction.customId) {
    case "player:pause":
      player.pause(true);
      await interaction.reply({
        embeds: [successEmbed("⏸️ Paused the player.")],
        ephemeral: true,
      });
      break;
    case "player:resume":
      player.pause(false);
      await interaction.reply({
        embeds: [successEmbed("▶️ Resumed the player.")],
        ephemeral: true,
      });
      break;
    case "player:skip":
      player.skip();
      await interaction.reply({
        embeds: [successEmbed("⏭️ Skipped the current track.")],
        ephemeral: true,
      });
      break;
    case "player:stop":
      player.destroy();
      await interaction.reply({
        embeds: [successEmbed("🛑 Stopped the player and cleared the queue.")],
        ephemeral: true,
      });
      break;
    case "player:previous":
      // Seek to start of current track as "previous"
      player.seek(0);
      await interaction.reply({
        embeds: [successEmbed("⏪ Restarted the current track.")],
        ephemeral: true,
      });
      break;
    case "player:queue":
      await interaction.reply({
        content: `📋 **Queue:** ${player.queue.length} track${player.queue.length === 1 ? "" : "s"}`,
        ephemeral: true,
      });
      break;
  }

  broadcastState(client, interaction.guildId!);
}
