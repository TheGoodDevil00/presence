import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const acceptSchema = z.object({
  token: z.string().min(1),
});

export async function POST(request: Request) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = acceptSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
  }

  const { token } = result.data;

  const { data: invite, error: fetchError } = await supabase
    .from("invites")
    .select("*")
    .eq("token", token)
    .single();

  if (fetchError || !invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  if (invite.accepted_at || invite.accepted_by) {
    return NextResponse.json({ error: "This invite has already been used." }, { status: 400 });
  }

  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "This invite has expired. Ask for a new one." }, { status: 400 });
  }

  if (invite.inviter_id === user.id) {
    return NextResponse.json({ error: "You can't accept your own invite." }, { status: 400 });
  }

  // Ensure the user has a profile, otherwise the pair insert will fail a foreign key constraint
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    const defaultName = user.email ? user.email.split('@')[0] : "Partner";
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({ id: user.id, display_name: defaultName });

    if (profileError) {
      console.error("profileInsertError", profileError);
      return NextResponse.json({ error: "Failed to create default profile", details: profileError }, { status: 500 });
    }
  }

  // 1. Update invite status to accepted
  const { error: inviteUpdateError } = await supabase
    .from("invites")
    .update({
      accepted_by: user.id,
      accepted_at: new Date().toISOString(),
    })
    .eq("id", invite.id);

  if (inviteUpdateError) {
    console.error("inviteUpdateError", inviteUpdateError);
    return NextResponse.json({ error: "Failed to update invite", details: inviteUpdateError }, { status: 500 });
  }

  // 2. Create pair row (with canonical sorting user_a < user_b)
  const ids = [invite.inviter_id, user.id].sort();
  const { error: pairInsertError } = await supabase
    .from("pairs")
    .insert({
      user_a: ids[0],
      user_b: ids[1],
    });

  if (pairInsertError) {
    console.error("pairInsertError", pairInsertError);
    // Rollback invite acceptance if pair creation fails
    await supabase
      .from("invites")
      .update({
        accepted_by: null,
        accepted_at: null,
      })
      .eq("id", invite.id);

    return NextResponse.json({ error: "Failed to create pair connection", details: pairInsertError }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
