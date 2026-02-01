import { SocketEvents } from "@beatbox/shared";
import type { BeatboxClient } from "../structures/Client";
import { getPlayerState } from "../utils/playerState";

export function setupSocketServer(client: BeatboxClient) {
  client.io.on("connection", (socket) => {
    console.log(`Dashboard client connected: ${socket.id}`);

    socket.on(SocketEvents.JOIN_GUILD, async (guildId: string) => {
      socket.join(`guild:${guildId}`);
      const state = getPlayerState(client, guildId);
      socket.emit(SocketEvents.PLAYER_STATE, state);
    });

    socket.on(SocketEvents.LEAVE_GUILD, (guildId: string) => {
      socket.leave(`guild:${guildId}`);
    });

    socket.on(SocketEvents.PLAYER_PAUSE, (guildId: string) => {
      const player = client.kazagumo.players.get(guildId);
      if (player) {
        player.pause(true);
        broadcastState(client, guildId);
      }
    });

    socket.on(SocketEvents.PLAYER_RESUME, (guildId: string) => {
      const player = client.kazagumo.players.get(guildId);
      if (player) {
        player.pause(false);
        broadcastState(client, guildId);
      }
    });

    socket.on(SocketEvents.PLAYER_SKIP, (guildId: string) => {
      const player = client.kazagumo.players.get(guildId);
      if (player) player.skip();
    });

    socket.on(SocketEvents.PLAYER_STOP, (guildId: string) => {
      const player = client.kazagumo.players.get(guildId);
      if (player) player.destroy();
    });

    socket.on(SocketEvents.PLAYER_VOLUME, ({ guildId, volume }: { guildId: string; volume: number }) => {
      const player = client.kazagumo.players.get(guildId);
      if (player) {
        player.setVolume(volume);
        broadcastState(client, guildId);
      }
    });

    socket.on(SocketEvents.PLAYER_SEEK, ({ guildId, position }: { guildId: string; position: number }) => {
      const player = client.kazagumo.players.get(guildId);
      if (player) {
        player.seekTo(position);
        broadcastState(client, guildId);
      }
    });

    socket.on(SocketEvents.QUEUE_REMOVE, ({ guildId, position }: { guildId: string; position: number }) => {
      const player = client.kazagumo.players.get(guildId);
      if (player) {
        player.queue.splice(position, 1);
        broadcastState(client, guildId);
      }
    });

    socket.on(SocketEvents.QUEUE_CLEAR, (guildId: string) => {
      const player = client.kazagumo.players.get(guildId);
      if (player) {
        player.queue.clear();
        broadcastState(client, guildId);
      }
    });

    socket.on(SocketEvents.SEARCH, async ({ guildId, query }: { guildId: string; query: string }) => {
      try {
        const result = await client.kazagumo.search(query);
        socket.emit(SocketEvents.SEARCH_RESULTS, {
          tracks: result.tracks.map((t) => ({
            id: t.identifier,
            title: t.title,
            author: t.author,
            duration: t.length,
            uri: t.uri,
            artworkUrl: t.thumbnail,
            sourceName: t.sourceName,
          })),
          source: result.type,
        });
      } catch {
        socket.emit(SocketEvents.PLAYER_ERROR, {
          guildId,
          message: "Search failed",
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`Dashboard client disconnected: ${socket.id}`);
    });
  });
}

export function broadcastState(client: BeatboxClient, guildId: string) {
  const state = getPlayerState(client, guildId);
  client.io.to(`guild:${guildId}`).emit(SocketEvents.PLAYER_STATE, state);
}
