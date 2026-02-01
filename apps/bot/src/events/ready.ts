import { Events, ActivityType } from "discord.js";
import type { BeatboxClient } from "../structures/Client";

export const name = Events.ClientReady;
export const once = true;

const ROTATE_INTERVAL = 2 * 60 * 1000; // 2 minutes

// Idle statuses when nothing is playing — cycles through these
const idleStatuses: { text: string; type: ActivityType }[] = [
  { text: "🎶 /play to Start Vibing!", type: ActivityType.Listening },
  { text: "⏳ Waiting for Requests...", type: ActivityType.Custom },
  { text: "🔍 Your Next Favorite Song", type: ActivityType.Watching },
  { text: "🎧 Silence... for Now", type: ActivityType.Listening },
  { text: "📋 the Queue Build Up", type: ActivityType.Watching },
  { text: "🎮 /play Commands", type: ActivityType.Competing },
];

let rotationIndex = 0;

export async function execute(client: BeatboxClient) {
  console.log(`Logged in as ${client.user?.tag}`);

  const updatePresence = () => {
    const players = [...client.kazagumo.players.values()];
    const activePlayers = players.filter(
      (p) => p.queue.current && !p.paused
    );

    if (activePlayers.length === 0) {
      // Nothing playing — rotate idle statuses
      const status = idleStatuses[rotationIndex % idleStatuses.length];
      client.user?.setActivity(status.text, { type: status.type });
      rotationIndex++;
      return;
    }

    // Something is playing — cycle through active servers and info
    const variants: { text: string; type: ActivityType }[] = [];

    // Add currently playing tracks from each server
    for (const player of activePlayers) {
      const track = player.queue.current!;
      const title =
        track.title.length > 40
          ? track.title.slice(0, 37) + "..."
          : track.title;

      variants.push({
        text: `🎵 ${title}`,
        type: ActivityType.Listening,
      });

      variants.push({
        text: `🎧 ${track.author} — ${title}`,
        type: ActivityType.Listening,
      });
    }

    // Add aggregate stats
    const totalQueued = activePlayers.reduce(
      (sum, p) => sum + p.queue.length,
      0
    );

    if (activePlayers.length === 1) {
      const queueLen = activePlayers[0].queue.length;
      if (queueLen > 0) {
        variants.push({
          text: `📋 ${queueLen} Track${queueLen === 1 ? "" : "s"} in Queue`,
          type: ActivityType.Watching,
        });
      }
    } else {
      variants.push({
        text: `🌐 Music in ${activePlayers.length} Servers`,
        type: ActivityType.Listening,
      });

      if (totalQueued > 0) {
        variants.push({
          text: `🎶 ${totalQueued} Tracks Queued Across Servers`,
          type: ActivityType.Watching,
        });
      }
    }

    const chosen = variants[rotationIndex % variants.length];
    client.user?.setActivity(chosen.text, { type: chosen.type });
    rotationIndex++;
  };

  // Set initial presence
  updatePresence();

  // Rotate every 2 minutes
  setInterval(updatePresence, ROTATE_INTERVAL);
}
