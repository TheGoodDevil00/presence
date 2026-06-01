import { useEffect, useRef, useState } from "react";
import PartySocket from "partysocket";

type PresenceState = "loading" | "partner-present" | "partner-absent" | "error";

export function usePresence() {
  const [state, setState] = useState<PresenceState>("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const socketRef = useRef<PartySocket | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const res = await fetch("/api/presence-token");
        if (!res.ok) throw new Error("Token fetch failed");
        const { token, roomId, userId: uid } = await res.json();

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
      } catch {
        if (!cancelled) setState("error");
      }
    }

    init();
    return () => {
      cancelled = true;
      socketRef.current?.close();
    };
  }, []);

  return state;
}
