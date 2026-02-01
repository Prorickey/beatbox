import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { prisma } from "@beatbox/database";
import type { BeatboxClient } from "../structures/Client";

const INTERACTION_THRESHOLD = 30;
const VOICE_TIME_THRESHOLD = 600; // seconds (10 minutes)
const VOICE_FLUSH_INTERVAL = 2 * 60 * 1000; // 2 minutes

/**
 * Track a slash command or button interaction.
 * Upserts the engagement record, increments count, and checks promo threshold.
 */
export async function trackInteraction(userId: string, client: BeatboxClient) {
  try {
    const record = await prisma.userEngagement.upsert({
      where: { id: userId },
      create: { id: userId, interactionCount: 1 },
      update: { interactionCount: { increment: 1 } },
    });

    if (!record.promoSent && record.interactionCount >= INTERACTION_THRESHOLD) {
      await sendPromotionalDM(userId, client);
    }
  } catch (err) {
    console.error("[engagement] Failed to track interaction:", err);
  }
}

/**
 * Called when a non-bot user joins the bot's voice channel.
 * Stores the join timestamp in memory and starts a periodic flush interval.
 */
export function trackVoiceJoin(userId: string, client: BeatboxClient) {
  client.voiceJoinTimes.set(userId, Date.now());

  // Clear any existing interval for this user
  const existing = client.voiceUpdateTimers.get(userId);
  if (existing) clearInterval(existing);

  // Periodically flush accumulated voice time to DB
  const interval = setInterval(async () => {
    const joinTime = client.voiceJoinTimes.get(userId);
    if (!joinTime) {
      clearInterval(interval);
      client.voiceUpdateTimers.delete(userId);
      return;
    }

    const elapsed = Math.floor((Date.now() - joinTime) / 1000);
    if (elapsed <= 0) return;

    // Reset join time to now (we've flushed up to this point)
    client.voiceJoinTimes.set(userId, Date.now());

    try {
      const record = await prisma.userEngagement.upsert({
        where: { id: userId },
        create: { id: userId, totalVoiceTime: elapsed },
        update: { totalVoiceTime: { increment: elapsed } },
      });

      if (!record.promoSent && record.totalVoiceTime >= VOICE_TIME_THRESHOLD) {
        await sendPromotionalDM(userId, client);
      }
    } catch (err) {
      console.error("[engagement] Failed to flush voice time:", err);
    }
  }, VOICE_FLUSH_INTERVAL);

  client.voiceUpdateTimers.set(userId, interval);
}

/**
 * Called when a non-bot user leaves the bot's voice channel.
 * Calculates final session duration, updates DB, clears interval, checks promo threshold.
 */
export async function trackVoiceLeave(userId: string, client: BeatboxClient) {
  const joinTime = client.voiceJoinTimes.get(userId);
  client.voiceJoinTimes.delete(userId);

  // Clear the periodic flush interval
  const interval = client.voiceUpdateTimers.get(userId);
  if (interval) {
    clearInterval(interval);
    client.voiceUpdateTimers.delete(userId);
  }

  if (!joinTime) return;

  const elapsed = Math.floor((Date.now() - joinTime) / 1000);
  if (elapsed <= 0) return;

  try {
    const record = await prisma.userEngagement.upsert({
      where: { id: userId },
      create: { id: userId, totalVoiceTime: elapsed },
      update: { totalVoiceTime: { increment: elapsed } },
    });

    if (!record.promoSent && record.totalVoiceTime >= VOICE_TIME_THRESHOLD) {
      await sendPromotionalDM(userId, client);
    }
  } catch (err) {
    console.error("[engagement] Failed to update voice time on leave:", err);
  }
}

/**
 * Send a one-time promotional DM to a user.
 * Sets promoSent = true in DB *before* sending to prevent race conditions.
 */
async function sendPromotionalDM(userId: string, client: BeatboxClient) {
  try {
    // Mark as sent BEFORE attempting DM (prevents races / duplicates)
    await prisma.userEngagement.update({
      where: { id: userId },
      data: { promoSent: true, promoSentAt: new Date() },
    });

    const user = await client.users.fetch(userId);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("Thanks for using Beatbox!")
      .setDescription(
        "You've been enjoying Beatbox — here's what else you can do:"
      )
      .addFields(
        {
          name: "Web Dashboard",
          value: "Control music, manage playlists, and adjust settings from your browser.",
          inline: true,
        },
        {
          name: "Playlists",
          value: "Save your favorite queues with `/playlist save` and load them anytime.",
          inline: true,
        },
        {
          name: "Server Stats",
          value: "See what your server's been listening to with `/stats`.",
          inline: true,
        }
      )
      .setFooter({ text: "You won't receive this message again." });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("Add Beatbox to Another Server")
        .setStyle(ButtonStyle.Link)
        .setURL(
          `https://discord.com/oauth2/authorize?client_id=${client.user!.id}&permissions=3147776&scope=bot%20applications.commands`
        )
    );

    await user.send({ embeds: [embed], components: [row] });
    console.log(`[engagement] Sent promotional DM to user ${userId}`);
  } catch (err: any) {
    // Error 50007 = Cannot send messages to this user (DMs disabled)
    if (err?.code === 50007) {
      console.log(`[engagement] User ${userId} has DMs disabled, skipping (already marked as sent)`);
    } else {
      console.error("[engagement] Failed to send promotional DM:", err);
    }
  }
}
