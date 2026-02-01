"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Music } from "lucide-react";

export function GuildSelector() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className="text-center text-muted-foreground">
        Sign in to see your servers.
      </div>
    );
  }

  return (
    <div>
      <p className="mb-6 text-muted-foreground">
        Select a server to manage its music player.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Guilds will be populated from Discord API via session */}
        <GuildCard
          id="placeholder"
          name="Your Server"
          icon={null}
          memberCount={0}
        />
      </div>
    </div>
  );
}

function GuildCard({
  id,
  name,
  icon,
  memberCount,
}: {
  id: string;
  name: string;
  icon: string | null;
  memberCount: number;
}) {
  return (
    <Link
      href={`/dashboard/${id}`}
      className="group flex items-center gap-4 rounded-xl border bg-card p-4 transition-all hover:border-primary/50 hover:bg-accent/50"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Music className="h-6 w-6" />
      </div>
      <div>
        <h3 className="font-semibold group-hover:text-primary">{name}</h3>
        <p className="text-sm text-muted-foreground">
          {memberCount} members
        </p>
      </div>
    </Link>
  );
}
