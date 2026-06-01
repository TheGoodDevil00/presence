"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface OnboardingClientProps {
  initialStep: 1 | 2;
  initialDisplayName: string;
}

export function OnboardingClient({ initialStep, initialDisplayName }: OnboardingClientProps) {
  const [step, setStep] = useState<1 | 2>(initialStep);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  // Poll for invite acceptance in Step 2
  useEffect(() => {
    if (step !== 2) return;

    let intervalId: NodeJS.Timeout;

    const checkInviteAccepted = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: invites } = await supabase
        .from("invites")
        .select("accepted_at, accepted_by")
        .eq("inviter_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (invites && invites.length > 0 && invites[0].accepted_at) {
        clearInterval(intervalId);
        router.push("/silence");
      }
    };

    const checkPairExists = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: pair } = await supabase
        .from("pairs")
        .select("id")
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .maybeSingle();

      if (pair) {
        clearInterval(intervalId);
        router.push("/silence");
      }
    };

    intervalId = setInterval(() => {
      checkInviteAccepted();
      checkPairExists();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [step, router, supabase]);

  // Handle display name submit (Step 1)
  const handleStep1Submit = async () => {
    if (!displayName.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          display_name: displayName.trim(),
        });

      if (upsertError) throw upsertError;

      // Advance to Step 2 and generate the invite URL
      const res = await fetch("/api/invite/create", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create invite link");

      const data = await res.json();
      setInviteUrl(data.url);
      setStep(2);
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // If initialStep was 2, load or generate the invite URL on mount
  useEffect(() => {
    if (initialStep === 2 && !inviteUrl) {
      const getOrCreateInvite = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data: invites } = await supabase
            .from("invites")
            .select("token")
            .eq("inviter_id", user.id)
            .is("accepted_at", null)
            .gt("expires_at", new Date().toISOString())
            .order("created_at", { ascending: false })
            .limit(1);

          if (invites && invites.length > 0) {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
            setInviteUrl(`${appUrl}/invite/${invites[0].token}`);
          } else {
            const res = await fetch("/api/invite/create", { method: "POST" });
            if (res.ok) {
              const data = await res.json();
              setInviteUrl(data.url);
            }
          }
        } catch (e) {
          console.error("Failed to load invite", e);
        }
      };

      getOrCreateInvite();
    }
  }, [initialStep, inviteUrl, supabase]);

  const handleCopyLink = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-sm px-8 py-12 flex flex-col items-center justify-center font-serif text-center">
      {step === 1 ? (
        <div className="w-full flex flex-col gap-6">
          <h2 className="text-2xl text-[#f5f0e8] tracking-wider font-light">Name your presence</h2>
          <p className="text-[#8a8470] text-sm leading-relaxed font-light">
            What should your partner see when you're here?
          </p>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Display Name"
            className="w-full bg-transparent border border-[#4a4a4a] focus:border-[#f5f0e8] text-[#f5f0e8] rounded-full px-5 py-3 text-center text-sm tracking-wider focus:outline-none transition-colors duration-300 placeholder:text-[#4a4a4a]"
            disabled={loading}
          />
          <button
            onClick={handleStep1Submit}
            disabled={loading || !displayName.trim()}
            className="w-full bg-[#f5f0e8] text-[#0a0a0a] rounded-full py-3 text-sm tracking-widest uppercase hover:bg-opacity-90 active:scale-95 transition-all duration-300 font-medium disabled:opacity-50 disabled:active:scale-100"
          >
            {loading ? "Saving..." : "Continue"}
          </button>
          {error && (
            <p className="text-[#ffb4ab] text-center text-sm mt-2">{error}</p>
          )}
        </div>
      ) : (
        <div className="w-full flex flex-col gap-6">
          <h2 className="text-2xl text-[#f5f0e8] tracking-wider font-light">Invite your partner</h2>
          <p className="text-[#8a8470] text-sm leading-relaxed font-light">
            Share this link with the person you want to pair with.
          </p>
          <div className="w-full flex flex-col gap-3">
            <input
              type="text"
              readOnly
              value={inviteUrl || "Generating invite link..."}
              className="w-full bg-transparent border border-[#4a4a4a] text-[#8a8470] rounded-full px-5 py-3 text-center text-xs tracking-wider focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              disabled={!inviteUrl}
              className="w-full bg-[#f5f0e8] text-[#0a0a0a] rounded-full py-3 text-sm tracking-widest uppercase hover:bg-opacity-90 active:scale-95 transition-all duration-300 font-medium disabled:opacity-50"
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#f5f0e8] animate-ping" />
            <p className="text-[#4a4a4a] text-sm italic">Waiting for them to join...</p>
          </div>
        </div>
      )}
    </div>
  );
}
