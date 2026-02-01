"use client";

import { usePlayer } from "@/hooks/usePlayer";
import { formatDuration } from "@beatbox/shared";
import { Trash2, GripVertical, ListX } from "lucide-react";

export function QueueView({ guildId }: { guildId: string }) {
  const { state, removeTrack, clearQueue } = usePlayer(guildId);
  const { queue } = state;

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-semibold">
          Queue{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({queue.length} tracks)
          </span>
        </h3>
        {queue.length > 0 && (
          <button
            onClick={clearQueue}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <ListX className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {queue.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Queue is empty
        </div>
      ) : (
        <div className="max-h-[500px] overflow-y-auto">
          {queue.map((track, i) => (
            <div
              key={`${track.id}-${i}`}
              className="group flex items-center gap-3 border-b px-4 py-2.5 last:border-b-0 hover:bg-accent/50"
            >
              <GripVertical className="h-4 w-4 flex-shrink-0 text-muted-foreground/30" />
              <span className="w-6 text-right text-xs text-muted-foreground">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{track.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {track.author}
                </p>
              </div>
              <span className="flex-shrink-0 text-xs text-muted-foreground">
                {formatDuration(track.duration)}
              </span>
              <button
                onClick={() => removeTrack(i)}
                className="flex-shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
