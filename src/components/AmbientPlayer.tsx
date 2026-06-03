"use client";

import { useEffect, useRef } from "react";

interface AmbientPlayerProps {
  src: string | null;
  volume: number; // 0 to 1
}

export function AmbientPlayer({ src, volume }: AmbientPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const currentSrcRef = useRef<string | null>(null);

  // Initialize HTMLAudioElement
  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  // Initialize Web Audio API
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const initAudioContext = () => {
      if (audioContextRef.current) return;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const gain = ctx.createGain();
      
      try {
        const source = ctx.createMediaElementSource(audio);
        source.connect(gain);
        gain.connect(ctx.destination);
        
        audioContextRef.current = ctx;
        gainNodeRef.current = gain;
        sourceNodeRef.current = source;
        
        // Set initial gain
        gain.gain.setValueAtTime(volume, ctx.currentTime);
      } catch (e) {
        console.error("Web Audio API initialization error:", e);
      }
    };

    // Initialize on first click/interaction
    const handleInteraction = () => {
      initAudioContext();
      if (audioContextRef.current && audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }
    };

    window.addEventListener("click", handleInteraction, { passive: true });
    window.addEventListener("touchstart", handleInteraction, { passive: true });

    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [volume]);

  // Handle source changes with crossfade
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const ctx = audioContextRef.current;
    const gain = gainNodeRef.current;

    const fadeOutAndChange = async () => {
      if (ctx && gain) {
        gain.gain.setValueAtTime(0, ctx.currentTime);
      } else {
        audio.pause();
      }

      if (src) {
        audio.src = src;
        audio.load();
        
        // Resume AudioContext if suspended
        if (ctx && ctx.state === "suspended") {
          await ctx.resume();
        }

        try {
          await audio.play();
          if (ctx && gain) {
            const now = ctx.currentTime;
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(volume, now + 0.8);
          } else {
            audio.volume = volume;
          }
        } catch (error) {
          console.error("Autoplay or play was prevented:", error);
        }
      } else {
        audio.pause();
        audio.src = "";
      }
      currentSrcRef.current = src;
    };

    if (currentSrcRef.current !== src) {
      fadeOutAndChange();
    }
  }, [src, volume]);

  // Handle volume adjustments when source is not changing
  useEffect(() => {
    const audio = audioRef.current;
    const ctx = audioContextRef.current;
    const gain = gainNodeRef.current;

    if (audio && currentSrcRef.current === src) {
      if (ctx && gain) {
        const now = ctx.currentTime;
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(volume, now + 0.1); // subtle ramp for smooth adjustment
      } else {
        audio.volume = volume;
      }
    }
  }, [volume, src]);

  return null; // pure controller, renders no UI
}
