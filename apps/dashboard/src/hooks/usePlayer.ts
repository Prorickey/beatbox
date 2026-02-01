"use client";

import { useEffect, useState, useCallback } from "react";
import { getSocket } from "@/lib/socket";
import { SocketEvents, type PlayerState } from "@beatbox/shared";

const defaultState: PlayerState = {
  guildId: "",
  playing: false,
  paused: false,
  currentTrack: null,
  position: 0,
  volume: 80,
  repeatMode: "off",
  queue: [],
};

export function usePlayer(guildId: string) {
  const [state, setState] = useState<PlayerState>(defaultState);
  const socket = getSocket();

  useEffect(() => {
    socket.emit(SocketEvents.JOIN_GUILD, guildId);

    socket.on(SocketEvents.PLAYER_STATE, (newState: PlayerState) => {
      setState(newState);
    });

    socket.on(SocketEvents.QUEUE_UPDATE, (newState: PlayerState) => {
      setState(newState);
    });

    return () => {
      socket.emit(SocketEvents.LEAVE_GUILD, guildId);
      socket.off(SocketEvents.PLAYER_STATE);
      socket.off(SocketEvents.QUEUE_UPDATE);
    };
  }, [guildId, socket]);

  const pause = useCallback(() => {
    socket.emit(SocketEvents.PLAYER_PAUSE, guildId);
  }, [guildId, socket]);

  const resume = useCallback(() => {
    socket.emit(SocketEvents.PLAYER_RESUME, guildId);
  }, [guildId, socket]);

  const skip = useCallback(() => {
    socket.emit(SocketEvents.PLAYER_SKIP, guildId);
  }, [guildId, socket]);

  const stop = useCallback(() => {
    socket.emit(SocketEvents.PLAYER_STOP, guildId);
  }, [guildId, socket]);

  const setVolume = useCallback(
    (volume: number) => {
      socket.emit(SocketEvents.PLAYER_VOLUME, { guildId, volume });
    },
    [guildId, socket]
  );

  const seek = useCallback(
    (position: number) => {
      socket.emit(SocketEvents.PLAYER_SEEK, { guildId, position });
    },
    [guildId, socket]
  );

  const removeTrack = useCallback(
    (position: number) => {
      socket.emit(SocketEvents.QUEUE_REMOVE, { guildId, position });
    },
    [guildId, socket]
  );

  const clearQueue = useCallback(() => {
    socket.emit(SocketEvents.QUEUE_CLEAR, guildId);
  }, [guildId, socket]);

  const shuffle = useCallback(() => {
    socket.emit(SocketEvents.PLAYER_SHUFFLE, guildId);
  }, [guildId, socket]);

  const setRepeat = useCallback(
    (mode: "off" | "track" | "queue") => {
      socket.emit(SocketEvents.PLAYER_REPEAT, { guildId, mode });
    },
    [guildId, socket]
  );

  return {
    state,
    pause,
    resume,
    skip,
    stop,
    setVolume,
    seek,
    removeTrack,
    clearQueue,
    shuffle,
    setRepeat,
  };
}
