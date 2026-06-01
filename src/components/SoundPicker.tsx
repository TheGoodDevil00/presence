"use client";

interface SoundPickerProps {
  currentSound: "rain" | "cafe" | "forest" | "off";
  onSoundChange: (sound: "rain" | "cafe" | "forest" | "off") => void;
  volume: number; // 0 to 100
  onVolumeChange: (volume: number) => void;
}

export function SoundPicker({
  currentSound,
  onSoundChange,
  volume,
  onVolumeChange,
}: SoundPickerProps) {
  const options: { id: "rain" | "cafe" | "forest" | "off"; label: string; icon?: string }[] = [
    { id: "off", label: "off" },
    { id: "rain", label: "Rain", icon: "🌧" },
    { id: "cafe", label: "Café", icon: "☕" },
    { id: "forest", label: "Forest", icon: "🌲" },
  ];

  return (
    <div className="flex flex-col items-center gap-6 font-serif">
      {/* Pills Container */}
      <div className="flex items-center gap-3">
        {options.map((opt) => {
          const isSelected = currentSound === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onSoundChange(opt.id)}
              className={`flex items-center justify-center border rounded-full px-4 py-2 text-xs tracking-wider transition-all duration-300 active:scale-95 ${
                isSelected
                  ? "border-[#f5f0e8] text-[#f5f0e8]"
                  : "border-[#4a4a4a] text-[#4a4a4a] hover:border-[#8a8470] hover:text-[#8a8470]"
              }`}
            >
              {opt.icon && <span className="mr-1.5">{opt.icon}</span>}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Volume Slider Container */}
      <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity duration-300">
        <span className="text-xs text-[#4a4a4a]">🔈</span>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="w-[200px] h-[4px] cursor-pointer appearance-none rounded-full outline-none focus:outline-none"
          style={{
            background: `linear-gradient(to right, #4a4a4a 0%, #4a4a4a ${volume}%, #2a2a2a ${volume}%, #2a2a2a 100%)`,
          }}
        />
        <span className="text-xs text-[#4a4a4a]">🔊</span>
      </div>
    </div>
  );
}
