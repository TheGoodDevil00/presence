import type * as Party from "partykit/server";
import { createHmac } from "crypto";

// Room ID convention: sorted UUIDs joined with '-'
// e.g. "018e1a2b-...-018e1a2c-..."
// The client derives this deterministically from the pair

export default class SilenceRoom implements Party.Server {
  constructor(readonly room: Party.Room) {}

  // Verify a signed token issued by Next.js
  private verifyToken(token: string, userId: string): boolean {
    const expected = createHmac("sha256", this.room.env.PARTYKIT_SECRET as string)
      .update(`${userId}:${this.room.id}`)
      .digest("hex");
    return token === expected;
  }

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    const url = new URL(ctx.request.url);
    const userId = url.searchParams.get("userId");
    const token = url.searchParams.get("token");

    if (!userId || !token || !this.verifyToken(token, userId)) {
      conn.close(4001, "Unauthorized");
      return;
    }

    // Tag the connection with the userId
    conn.setState({ userId });

    // Broadcast updated presence list to all connections in room
    this.broadcastPresence();
  }

  onClose() {
    this.broadcastPresence();
  }

  onError() {
    this.broadcastPresence();
  }

  private broadcastPresence() {
    const connected = Array.from(this.room.getConnections())
      .map((c) => (c.state as { userId: string })?.userId)
      .filter(Boolean);

    const message = JSON.stringify({ type: "presence", users: connected });
    this.room.broadcast(message);
  }
}

SilenceRoom satisfies Party.Worker;
