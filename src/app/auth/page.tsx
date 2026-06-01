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
      redirect("/silence");
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
