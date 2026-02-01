import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { BeatboxClient } from "../../structures/Client";
import { errorEmbed, successEmbed } from "../../utils/embeds";
import { broadcastState } from "../../handlers/socketHandler";
import { applyGuildSettings } from "../../utils/guildSettings";

export const data = new SlashCommandBuilder()
  .setName("join")
  .setDescription("Move the bot to your voice channel");

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: BeatboxClient
) {
  const member = interaction.guild?.members.cache.get(interaction.user.id);
  const voiceChannel = member?.voice.channel;

  if (!voiceChannel) {
    await interaction.reply({
      embeds: [errorEmbed("You need to be in a voice channel.")],
      ephemeral: true,
    });
    return;
  }

  let player = client.kazagumo.players.get(interaction.guildId!);

  if (player) {
    // Bot already has a player — check if we can move
    const currentChannel = interaction.guild?.channels.cache.get(player.voiceId!);

    if (player.voiceId === voiceChannel.id) {
      await interaction.reply({
        embeds: [errorEmbed("I'm already in your voice channel.")],
        ephemeral: true,
      });
      return;
    }

    // Check if current channel has other (non-bot) members
    if (currentChannel && currentChannel.isVoiceBased()) {
      const humanMembers = currentChannel.members.filter((m) => !m.user.bot);
      if (humanMembers.size > 0) {
        await interaction.reply({
          embeds: [errorEmbed("I can't leave because there are other listeners in my current channel.")],
          ephemeral: true,
        });
        return;
      }
    }

    // Move to the new channel by destroying and recreating
    const wasPlaying = player.playing;
    const wasPaused = player.paused;
    const currentTrack = player.queue.current;
    const position = player.position;
    const queue = [...player.queue];
    const volume = player.volume;
    const loop = player.loop;

    player.destroy();

    player = await client.kazagumo.createPlayer({
      guildId: interaction.guildId!,
      textId: interaction.channelId,
      voiceId: voiceChannel.id,
      volume,
    });
    await applyGuildSettings(player, interaction.guildId!);

    // Restore queue state
    if (currentTrack) {
      player.queue.add(currentTrack);
      for (const track of queue) {
        player.queue.add(track);
      }
      player.play();
      // Restore position and pause state after a short delay
      if (position > 0) {
        setTimeout(() => {
          player.seek(position);
          if (wasPaused) player.pause(true);
        }, 500);
      } else if (wasPaused) {
        setTimeout(() => player.pause(true), 500);
      }
    }

    if (loop) player.setLoop(loop);

    broadcastState(client, interaction.guildId!);

    await interaction.reply({
      embeds: [successEmbed(`Moved to **${voiceChannel.name}**.`)],
    });
  } else {
    // No player exists — just join
    // Cancel any pending disconnect timer
    const disconnectTimer = client.disconnectTimers.get(interaction.guildId!);
    if (disconnectTimer) {
      clearTimeout(disconnectTimer);
      client.disconnectTimers.delete(interaction.guildId!);
    }

    player = await client.kazagumo.createPlayer({
      guildId: interaction.guildId!,
      textId: interaction.channelId,
      voiceId: voiceChannel.id,
      volume: 80,
    });
    await applyGuildSettings(player, interaction.guildId!);
    broadcastState(client, interaction.guildId!);

    await interaction.reply({
      embeds: [successEmbed(`Joined **${voiceChannel.name}**.`)],
    });
  }
}
