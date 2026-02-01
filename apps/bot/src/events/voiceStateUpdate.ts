import { Events, type VoiceState } from "discord.js";
import type { BeatboxClient } from "../structures/Client";
import { broadcastState } from "../handlers/socketHandler";
import { SocketEvents } from "@beatbox/shared";
import { trackVoiceJoin, trackVoiceLeave } from "../utils/engagement";
import { prisma } from "@beatbox/database";

const DISCONNECT_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export const name = Events.VoiceStateUpdate;
export const once = false;

export async function execute(
  oldState: VoiceState,
  newState: VoiceState,
  client: BeatboxClient
) {
  const guildId = newState.guild.id;
  const userId = newState.id;
  const botId = client.user?.id;
  if (!botId) return;

  // Notify dashboard clients about voice state changes for non-bot users
  if (userId !== botId) {
    const joined = !oldState.channelId && !!newState.channelId;
    const left = !!oldState.channelId && !newState.channelId;
    if (joined || left) {
      client.io.emit(SocketEvents.VOICE_STATE_CHANGED, {
        userId,
        guildId,
        channelId: newState.channelId ?? null,
      });
    }
  }

  const player = client.kazagumo.players.get(guildId);
  if (!player) return;

  // Bot was disconnected by someone (e.g. kicked from VC)
  if (oldState.id === botId && oldState.channelId && !newState.channelId) {
    console.log(`[voice] Bot was disconnected from VC in guild ${guildId}`);
    // End voice tracking for all users that were in the bot's old channel
    const oldChannel = oldState.guild.channels.cache.get(oldState.channelId);
    if (oldChannel?.isVoiceBased()) {
      for (const [memberId, member] of oldChannel.members) {
        if (!member.user.bot) trackVoiceLeave(memberId, client);
      }
    }
    startDisconnectTimer(client, guildId);
    return;
  }

  // Bot moved to a different channel
  if (oldState.id === botId && oldState.channelId !== newState.channelId) {
    // End tracking for users in old channel, start for users in new channel
    if (oldState.channelId) {
      const oldChannel = oldState.guild.channels.cache.get(oldState.channelId);
      if (oldChannel?.isVoiceBased()) {
        for (const [memberId, member] of oldChannel.members) {
          if (!member.user.bot) trackVoiceLeave(memberId, client);
        }
      }
    }
    if (newState.channelId) {
      const newChannel = newState.guild.channels.cache.get(newState.channelId);
      if (newChannel?.isVoiceBased()) {
        for (const [memberId, member] of newChannel.members) {
          if (!member.user.bot) trackVoiceJoin(memberId, client);
        }
      }
    }
    return;
  }

  // Track non-bot user voice engagement with the bot's channel
  if (userId !== botId) {
    const botVoiceChannelForTracking = newState.guild.members.cache.get(botId)?.voice.channel;
    if (botVoiceChannelForTracking) {
      const joinedBotChannel = !oldState.channelId && newState.channelId === botVoiceChannelForTracking.id;
      const movedToBotChannel = oldState.channelId !== newState.channelId && newState.channelId === botVoiceChannelForTracking.id;
      const leftBotChannel = oldState.channelId === botVoiceChannelForTracking.id && newState.channelId !== botVoiceChannelForTracking.id;

      if (joinedBotChannel || movedToBotChannel) {
        trackVoiceJoin(userId, client);
      } else if (leftBotChannel) {
        trackVoiceLeave(userId, client);
      }
    }
  }

  // A user (not the bot) changed voice state — check the bot's channel
  const botVoiceChannel = newState.guild.members.cache.get(botId)?.voice.channel;
  if (!botVoiceChannel) return;

  // Count non-bot members in the bot's voice channel
  const humanMembers = botVoiceChannel.members.filter((m) => !m.user.bot).size;
  console.log(
    `[voice] VC update in guild ${guildId}: ${humanMembers} listeners in ${botVoiceChannel.name}`
  );

  if (humanMembers === 0) {
    // Check if 24/7 mode is enabled
    const guildSettings = await prisma.guildSettings.findUnique({
      where: { guildId },
    });
    const twentyFourSevenEnabled = guildSettings?.twentyFourSeven ?? false;

    if (twentyFourSevenEnabled) {
      console.log(`[voice] No listeners left in guild ${guildId}, but 24/7 mode is enabled — staying active`);
      return;
    }

    console.log(`[voice] No listeners left in guild ${guildId}, pausing and starting disconnect timer`);
    player.pause(true);
    startDisconnectTimer(client, guildId);
    broadcastState(client, guildId);
  } else {
    // Someone rejoined — cancel any pending disconnect
    const existingTimer = client.disconnectTimers.get(guildId);
    if (existingTimer) {
      console.log(`[voice] Listener rejoined guild ${guildId}, cancelling disconnect timer`);
      clearTimeout(existingTimer);
      client.disconnectTimers.delete(guildId);
      player.pause(false);
      broadcastState(client, guildId);
    }
  }
}

async function startDisconnectTimer(client: BeatboxClient, guildId: string) {
  // Check if 24/7 mode is enabled
  const guildSettings = await prisma.guildSettings.findUnique({
    where: { guildId },
  });
  const twentyFourSevenEnabled = guildSettings?.twentyFourSeven ?? false;

  if (twentyFourSevenEnabled) {
    console.log(`[voice] 24/7 mode enabled for guild ${guildId} — skipping disconnect timer`);
    return;
  }

  // Clear any existing timer first
  const existing = client.disconnectTimers.get(guildId);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(() => {
    console.log(`[voice] Disconnect timeout reached for guild ${guildId}, destroying player`);
    const player = client.kazagumo.players.get(guildId);
    if (player) player.destroy();
    client.disconnectTimers.delete(guildId);
    broadcastState(client, guildId);
  }, DISCONNECT_TIMEOUT);

  client.disconnectTimers.set(guildId, timer);

  // Leave the voice channel but keep the player alive for now
  const player = client.kazagumo.players.get(guildId);
  if (player) {
    player.pause(true);
  }
}
