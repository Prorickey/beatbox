"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePlayer } from "@/hooks/usePlayer";
import { useInterpolatedPosition } from "@/hooks/useInterpolatedPosition";
import { formatDuration } from "@beatbox/shared";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Square,
  Repeat,
  Repeat1,
} from "lucide-react";
import Image from "next/image";

export function NowPlaying({ guildId }: { guildId: string }) {
  const { state, pause, resume, skip, previous, stop, seek, setRepeat } =
    usePlayer(guildId);
  const { currentTrack, playing, paused, position: serverPosition, repeatMode } = state;
  const interpolated = useInterpolatedPosition(
    serverPosition,
    currentTrack?.duration ?? 0,
    playing,
    paused,
    currentTrack?.id ?? null
  );

  // Seek-drag state
  const barRef = useRef<HTMLDivElement>(null);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);
  const seekPositionRef = useRef(0);
  const durationRef = useRef(0);
  durationRef.current = currentTrack?.duration ?? 0;

  const getPositionFromPointer = useCallback((clientX: number) => {
    if (!barRef.current || durationRef.current <= 0) return 0;
    const rect = barRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.floor(pct * durationRef.current);
  }, []);

  const handleSeekStart = useCallback(
    (e: React.PointerEvent) => {
      const pos = getPositionFromPointer(e.clientX);
      setSeekPosition(pos);
      seekPositionRef.current = pos;
      setIsSeeking(true);
    },
    [getPositionFromPointer]
  );

  useEffect(() => {
    if (!isSeeking) return;

    const handleMove = (e: PointerEvent) => {
      const pos = getPositionFromPointer(e.clientX);
      setSeekPosition(pos);
      seekPositionRef.current = pos;
    };

    const handleUp = () => {
      seek(seekPositionRef.current);
      // Keep showing seekPosition briefly so the interpolated hook can snap
      // to the new optimistic value before we hand control back.
      requestAnimationFrame(() => setIsSeeking(false));
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [isSeeking, seek, getPositionFromPointer]);

  const position = isSeeking ? seekPosition : interpolated;

  if (!currentTrack) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <p className="text-lg text-muted-foreground">Nothing playing</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Use <code className="rounded bg-muted px-1.5 py-0.5">/play</code> in
          Discord to start listening
        </p>
      </div>
    );
  }

  const elapsed = formatDuration(position);
  const total = formatDuration(currentTrack.duration);
  const progress =
    currentTrack.duration > 0 ? (position / currentTrack.duration) * 100 : 0;

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="relative flex gap-6 p-6">
        {/* Artwork */}
        {currentTrack.artworkUrl && (
          <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-lg shadow-lg">
            <Image
              src={currentTrack.artworkUrl}
              alt={currentTrack.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Track info */}
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <p className="text-xs font-medium uppercase tracking-wider text-primary">
            Now Playing
          </p>
          <h2 className="mt-1 line-clamp-2 break-words text-xl font-bold">
            {currentTrack.title}
          </h2>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {currentTrack.author}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-6">
        <div
          ref={barRef}
          className="group relative h-1.5 cursor-pointer rounded-full bg-muted"
          onPointerDown={handleSeekStart}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary"
            style={{ width: `${progress}%` }}
          />
          <div
            className={`absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-primary shadow transition-opacity ${
              isSeeking ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
            style={{ left: `${progress}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
          <span>{elapsed}</span>
          <span>{total}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 px-6 pb-6 pt-4">
        <button
          onClick={previous}
          className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <SkipBack className="h-5 w-5" />
        </button>
        <button
          onClick={paused ? resume : pause}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105"
        >
          {paused ? (
            <Play className="ml-0.5 h-5 w-5" />
          ) : (
            <Pause className="h-5 w-5" />
          )}
        </button>
        <button
          onClick={skip}
          className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <SkipForward className="h-5 w-5" />
        </button>
        <button
          onClick={() => {
            const modes: Array<"off" | "track" | "queue"> = [
              "off",
              "track",
              "queue",
            ];
            const idx = modes.indexOf(repeatMode);
            setRepeat(modes[(idx + 1) % 3]);
          }}
          className={`rounded-full p-2 transition-colors ${
            repeatMode !== "off"
              ? "text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          {repeatMode === "track" ? (
            <Repeat1 className="h-4 w-4" />
          ) : (
            <Repeat className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
