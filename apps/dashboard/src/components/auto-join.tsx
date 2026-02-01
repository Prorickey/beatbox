"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { getSocket } from "@/lib/socket";
import { SocketEvents } from "@beatbox/shared";

export function AutoJoin({ guildId }: { guildId: string }) {
  const { data: session } = useSession();
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    const userId = (session?.user as any)?.id;
    if (!userId) return;

    hasFired.current = true;
    const socket = getSocket();
    socket.emit(SocketEvents.AUTO_JOIN, { guildId, userId });
  }, [guildId, session]);

  return null;
}
