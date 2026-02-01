import type { PlayerState } from "@beatbox/shared";
import type { BeatboxClient } from "../structures/Client";

export function getPlayerState(
  client: BeatboxClient,
  guildId: string
): PlayerState {
  const player = client.kazagumo.players.get(guildId);

  if (!player || !player.queue.current) {
    return {
      guildId,
      playing: false,
      paused: false,
      currentTrack: null,
      position: 0,
      volume: 80,
      repeatMode: "off",
      queue: [],
    };
  }

  const current = player.queue.current;
  return {
    guildId,
    playing: player.playing,
    paused: player.paused,
    currentTrack: {
      id: current.identifier,
      title: current.title,
      author: current.author,
      duration: current.length ?? 0,
      uri: current.uri ?? "",
      artworkUrl: current.thumbnail ?? null,
      sourceName: current.sourceName ?? "unknown",
      requester: current.requester as any,
    },
    position: player.position,
    volume: player.volume,
    repeatMode: (player.loop as any) ?? "off",
    queue: player.queue.map((track, i) => ({
      id: track.identifier,
      title: track.title,
      author: track.author,
      duration: track.length ?? 0,
      uri: track.uri ?? "",
      artworkUrl: track.thumbnail ?? null,
      sourceName: track.sourceName ?? "unknown",
      requester: track.requester as any,
      addedAt: new Date().toISOString(),
      position: i,
    })),
  };
}
