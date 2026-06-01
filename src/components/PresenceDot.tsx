interface PresenceDotProps {
  state: "loading" | "partner-present" | "partner-absent" | "error";
}

export function PresenceDot({ state }: PresenceDotProps) {
  let className = "w-[80px] h-[80px] rounded-full transition-all duration-1000 ";

  if (state === "partner-present") {
    className += "bg-[#f5f0e8] animate-breathe shadow-[0_0_40px_rgba(245,240,232,0.1)]";
  } else if (state === "loading") {
    className += "bg-[#2a2a2a] animate-pulse opacity-60";
  } else {
    // partner-absent or error
    className += "bg-[#2a2a2a] opacity-60";
  }

  return <div className={className} />;
}
