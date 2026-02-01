import { prisma } from "@beatbox/database";
import type { KazagumoPlayer } from "kazagumo";

/**
 * Applies guild settings (default repeat mode, volume, etc.) to a newly created player.
 */
export async function applyGuildSettings(
  player: KazagumoPlayer,
  guildId: string
) {
  try {
    const settings = await prisma.guildSettings.findUnique({
      where: { guildId },
    });
    if (!settings) return;

    // Apply default repeat mode
    if (settings.defaultRepeatMode && settings.defaultRepeatMode !== "off") {
      player.setLoop(settings.defaultRepeatMode as any);
    }
  } catch (err) {
    console.error(`[settings] Failed to apply guild settings for ${guildId}:`, err);
  }
}
