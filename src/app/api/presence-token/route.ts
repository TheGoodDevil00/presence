import { createHmac } from "crypto";
import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch pair
  const { data: pair } = await supabase
    .from("pairs")
    .select("id, user_a, user_b")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .single();

  if (!pair) {
    return NextResponse.json({ error: "No pair found" }, { status: 404 });
  }

  // Derive canonical room ID
  const roomId = [pair.user_a, pair.user_b].sort().join("-");

  const token = createHmac("sha256", process.env.PARTYKIT_SECRET!)
    .update(`${user.id}:${roomId}`)
    .digest("hex");

  return NextResponse.json({ token, roomId, userId: user.id });
}
