import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delete all pairs the user is part of
  const { error: pairError } = await supabase
    .from("pairs")
    .delete()
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

  if (pairError) {
    console.error("Failed to delete pairs:", pairError);
  }

  // Delete all invites the user created (expired, used, or pending)
  const { error: inviteError } = await supabase
    .from("invites")
    .delete()
    .eq("inviter_id", user.id);

  if (inviteError) {
    console.error("Failed to delete invites:", inviteError);
  }

  return NextResponse.json({ success: true });
}
