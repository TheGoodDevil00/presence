import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: invite, error } = await supabase
    .from("invites")
    .insert({ inviter_id: user.id })
    .select("token")
    .single();

  if (error || !invite) {
    console.error("Invite insertion failed:", error);
    return NextResponse.json({ error: error?.message || "Failed to create invite" }, { status: 500 });
  }

  const origin = new URL(request.url).origin;
  const inviteUrl = `${origin}/invite/${invite.token}`;

  return NextResponse.json({ url: inviteUrl });
}
