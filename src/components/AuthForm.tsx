"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AuthForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();
  const searchParams = useSearchParams();

  const handleSendLink = async () => {
    if (!email) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Preserve `next` param (e.g. /invite/<token>) through the email magic link
      const next = searchParams.get("next") ?? "/";
      const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: callbackUrl,
        },
      });

      if (otpError) throw otpError;
      setSuccess(true);
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err?.message || "Couldn't send link. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm px-8 py-12 flex flex-col items-center justify-center font-serif">
      <h1 className="text-3xl text-[#f5f0e8] mb-8 tracking-wider font-light">Presence</h1>
      {success ? (
        <p className="text-[#8a8470] text-center text-sm leading-relaxed">
          We sent a magic link to your email. Click it to log in.
        </p>
      ) : (
        <div className="w-full flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full bg-transparent border border-[#4a4a4a] focus:border-[#f5f0e8] text-[#f5f0e8] rounded-full px-5 py-3 text-center text-sm tracking-wider focus:outline-none transition-colors duration-300 placeholder:text-[#4a4a4a]"
            disabled={loading}
            onKeyDown={(e) => e.key === "Enter" && handleSendLink()}
          />
          <button
            onClick={handleSendLink}
            disabled={loading}
            className="w-full bg-[#f5f0e8] text-[#0a0a0a] rounded-full py-3 text-sm tracking-widest uppercase hover:bg-opacity-90 active:scale-95 transition-all duration-300 font-medium"
          >
            {loading ? "Sending..." : "Send link"}
          </button>
          {error && (
            <p className="text-[#ffb4ab] text-center text-sm mt-2">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
