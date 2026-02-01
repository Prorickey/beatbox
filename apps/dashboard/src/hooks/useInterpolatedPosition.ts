"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Smoothly interpolates the playback position between server updates.
 * When playing, increments position at ~60fps using requestAnimationFrame.
 * Snaps to the server position whenever a new update arrives.
 * Resets completely when the track changes.
 */
export function useInterpolatedPosition(
  serverPosition: number,
  duration: number,
  playing: boolean,
  paused: boolean,
  trackId: string | null
) {
  const [position, setPosition] = useState(serverPosition);
  const rafRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  const positionRef = useRef(serverPosition);
  const durationRef = useRef(duration);

  // Keep duration ref in sync so the rAF closure always has the latest value
  durationRef.current = duration;

  // Reset everything when the track changes
  useEffect(() => {
    positionRef.current = 0;
    lastFrameRef.current = 0;
    setPosition(0);
  }, [trackId]);

  // Snap to server position on each update
  useEffect(() => {
    positionRef.current = serverPosition;
    setPosition(serverPosition);
  }, [serverPosition]);

  // Animation loop
  useEffect(() => {
    if (!playing || paused || duration <= 0) {
      cancelAnimationFrame(rafRef.current);
      lastFrameRef.current = 0;
      return;
    }

    const tick = (timestamp: number) => {
      if (lastFrameRef.current === 0) {
        lastFrameRef.current = timestamp;
      }

      const delta = timestamp - lastFrameRef.current;
      lastFrameRef.current = timestamp;

      positionRef.current = Math.min(
        positionRef.current + delta,
        durationRef.current
      );
      setPosition(positionRef.current);

      if (positionRef.current < durationRef.current) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      lastFrameRef.current = 0;
    };
  }, [playing, paused, duration]);

  // Always clamp — belt and suspenders against any race condition
  return Math.min(Math.max(position, 0), duration);
}
