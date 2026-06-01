import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SilenceClient } from "./silence-client";

export default async function SilencePage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Verify user is paired before accessing the main page
  const { data: pair } = await supabase
    .from("pairs")
    .select("id")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .maybeSingle();

  if (!pair) {
    redirect("/onboarding");
  }

  return <SilenceClient />;
}
