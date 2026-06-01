"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function InvitePage() {
  const params = useParams();
  const token = params?.token as string;
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const processInvite = async () => {
      try {
        // 1. Get current session
        const { data: { session } } = await supabase.auth.getSession();

        // 2. Fetch the invite info
        const { data: invite, error: inviteError } = await supabase
          .from("invites")
          .select("*")
          .eq("token", token)
          .single();

        if (inviteError || !invite) {
          setError("This invite has expired. Ask for a new one.");
          setLoading(false);
          return;
        }

        // 3. Validate invite constraints
        if (invite.accepted_at || invite.accepted_by) {
          setError("This invite has already been used.");
          setLoading(false);
          return;
        }

        if (new Date(invite.expires_at) < new Date()) {
          setError("This invite has expired. Ask for a new one.");
          setLoading(false);
          return;
        }

        // 4. If user is not logged in: store token in sessionStorage and redirect to auth
        if (!session || !session.user) {
          sessionStorage.setItem("pending_invite_token", token);
          router.push("/auth");
          return;
        }

        // 5. If same person: error
        if (invite.inviter_id === session.user.id) {
          setError("You can't accept your own invite.");
          setLoading(false);
          return;
        }

        // 6. Valid user, accept invite
        const res = await fetch("/api/invite/accept", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to accept invite");
        }

        // 7. Success, redirect to /silence
        router.push("/silence");
      } catch (err: any) {
        setError(err.message || "Failed to process invite.");
        setLoading(false);
      }
    };

    processInvite();
  }, [token, router, supabase]);

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] font-serif">
        <div className="w-8 h-8 rounded-full bg-[#f5f0e8] animate-pulse" />
        <p className="mt-4 text-[#8a8470] text-sm tracking-widest uppercase">Processing invite...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] font-serif text-center px-6">
      <div className="max-w-md w-full flex flex-col gap-6">
        <h2 className="text-2xl text-[#ffb4ab] tracking-wider font-light">Invite Error</h2>
        <p className="text-[#8a8470] text-sm leading-relaxed font-light">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 bg-[#2a2a2a] text-[#f5f0e8] border border-[#4a4a4a] rounded-full py-3 px-6 text-sm tracking-wider hover:bg-opacity-95 active:scale-95 transition-all duration-300"
        >
          Go Home
        </button>
      </div>
    </main>
  );
}
