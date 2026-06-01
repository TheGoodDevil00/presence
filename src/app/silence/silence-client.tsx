"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { usePresence } from "@/lib/partykit/usePresence";
import { PresenceDot } from "@/components/PresenceDot";
import { AmbientPlayer } from "@/components/AmbientPlayer";
import { SoundPicker } from "@/components/SoundPicker";

export function SilenceClient() {
  const presenceState = usePresence();
  const router = useRouter();
  const supabase = createClient();

  const [leaving, setLeaving] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const handleLeave = async () => {
    if (!confirmLeave) {
      setConfirmLeave(true);
      setTimeout(() => setConfirmLeave(false), 3000);
      return;
    }
    setLeaving(true);
    try {
      await fetch("/api/reset", { method: "POST" });
      await supabase.auth.signOut();
      router.push("/auth");
    } catch {
      setLeaving(false);
    }
  };

  const [currentSound, setCurrentSound] = useState<"rain" | "cafe" | "forest" | "off">("off");
  const [volumePercent, setVolumePercent] = useState<number>(60);

  const soundSrcMap = {
    rain: "/sounds/rain.mp3",
    cafe: "/sounds/cafe.mp3",
    forest: "/sounds/forest.mp3",
    off: null,
  };

  const currentSrc = soundSrcMap[currentSound];
  const volumeFraction = volumePercent / 100;

  const getStatusText = () => {
    if (presenceState === "partner-present") return "here with you";
    if (presenceState === "partner-absent" || presenceState === "error") return "not here yet";
    return ""; // loading
  };

  const getStatusColorClass = () => {
    if (presenceState === "partner-present") return "text-[#8a8470]";
    return "text-[#4a4a4a]";
  };

  return (
    <main className="h-screen w-screen bg-[#0a0a0a] flex flex-col items-center justify-center relative select-none font-serif">
      {/* Leave button — top right */}
      <button
        onClick={handleLeave}
        disabled={leaving}
        className="absolute top-5 right-6 text-xs tracking-widest uppercase transition-colors duration-300 disabled:opacity-30"
        style={{ color: confirmLeave ? "#ffb4ab" : "#2a2a2a" }}
      >
        {leaving ? "Leaving..." : confirmLeave ? "Tap again to leave" : "Leave"}
      </button>
      {/* Presence Dot & Status text */}
      <div className="flex flex-col items-center justify-center mb-16">
        <PresenceDot state={presenceState} />
        <div className={`mt-[20px] h-[20px] text-sm tracking-widest uppercase transition-colors duration-1000 ${getStatusColorClass()}`}>
          {getStatusText()}
        </div>
      </div>

      {/* Invisible Web Audio manager */}
      <AmbientPlayer src={currentSrc} volume={volumeFraction} />

      {/* Pill Controls placed 40px from bottom */}
      <div className="absolute bottom-[40px] left-0 w-full flex justify-center px-6">
        <SoundPicker
          currentSound={currentSound}
          onSoundChange={setCurrentSound}
          volume={volumePercent}
          onVolumeChange={setVolumePercent}
        />
      </div>
    </main>
  );
}
