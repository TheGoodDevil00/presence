import { useEffect, useRef, useState } from "react";
import PartySocket from "partysocket";
import { createClient } from "@/lib/supabase/client";

type PresenceState = "loading" | "partner-present" | "partner-absent" | "error";

export function usePresence() {
  const [state, setState] = useState<PresenceState>("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const socketRef = useRef<PartySocket | null>(null);

  useEffect(() => {
    let cancelled = false;
    let channel: any;

    async function init() {
      try {
        const res = await fetch("/api/presence-token");
        if (!res.ok) throw new Error("Token fetch failed");
        const { token, roomId, userId: uid, pairId } = await res.json();

        if (cancelled) return;
        setUserId(uid);

        const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999";
        const socket = new PartySocket({
          host,
          room: roomId,
          query: { userId: uid, token },
        });

        socketRef.current = socket;

        socket.addEventListener("message", (evt) => {
          const msg = JSON.parse(evt.data);
          if (msg.type === "presence") {
            const othersPresent = (msg.users as string[]).some((id) => id !== uid);
            setState(othersPresent ? "partner-present" : "partner-absent");
          }
        });

        socket.addEventListener("error", () => setState("error"));

        const supabase = createClient();
        channel = supabase
          .channel(`pair_${pairId}`)
          .on(
            "postgres_changes",
            { event: "DELETE", schema: "public", table: "pairs", filter: `id=eq.${pairId}` },
            () => {
              setState("error");
            }
          )
          .subscribe();

      } catch {
        if (!cancelled) setState("error");
      }
    }

    init();
    return () => {
      cancelled = true;
      socketRef.current?.close();
      if (channel) channel.unsubscribe();
    };
  }, []);

  return state;
}
