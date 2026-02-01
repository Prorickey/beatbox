"use client";

import { usePlayer } from "@/hooks/usePlayer";
import { Volume, Volume1, Volume2, VolumeX } from "lucide-react";

export function VolumeControl({ guildId }: { guildId: string }) {
  const { state, setVolume } = usePlayer(guildId);
  const { volume } = state;

  const VolumeIcon =
    volume === 0 ? VolumeX : volume < 30 ? Volume : volume < 70 ? Volume1 : Volume2;

  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card px-6 py-4">
      <VolumeIcon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
      <div className="flex-1">
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-full accent-primary"
        />
      </div>
      <span className="w-10 text-right text-sm font-medium">{volume}%</span>
    </div>
  );
}
