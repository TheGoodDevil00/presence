import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";

export default async function AuthPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Check if profile exists to decide route target
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (profile) {
      // Check if they have a pair
      const { data: pair } = await supabase
        .from("pairs")
        .select("id")
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .maybeSingle();

      if (pair) {
        redirect("/silence");
      } else {
        redirect("/onboarding");
      }
    } else {
      redirect("/onboarding");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <AuthForm />
    </main>
  );
}
