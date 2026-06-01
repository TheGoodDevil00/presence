import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingClient } from "./onboarding-client";

export default async function OnboardingPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Fetch existing profile data if user refreshed onboarding
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  // If they already have a pair connection, skip straight to silence
  const { data: pair } = await supabase
    .from("pairs")
    .select("id")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .maybeSingle();

  if (pair) {
    redirect("/silence");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <OnboardingClient initialStep={profile ? 2 : 1} initialDisplayName={profile?.display_name || ""} />
    </main>
  );
}
