"use client";

import { modeToInt } from "@/lib/utils";

interface ModeSelectorProps {
  mode: string;
  mods: string;
  onChange: (mode: string, mods: string) => void;
}

const MODES = [
  { key: "std", label: "osu!" },
  { key: "taiko", label: "Taiko" },
  { key: "catch", label: "Catch" },
  { key: "mania", label: "Mania" },
];

const MODS = [
  { key: "vn", label: "Vanilla" },
  { key: "rx", label: "Relax" },
  { key: "ap", label: "Autopilot" },
];

function isDisabled(mode: string, mods: string): boolean {
  if (mods === "rx" && mode === "mania") return true;
  if (mods === "ap" && (mode === "taiko" || mode === "catch" || mode === "mania")) return true;
  return false;
}

export default function ModeSelector({ mode, mods, onChange }: ModeSelectorProps) {
  return (
    <div className="mode-bar">
      <div style={{ display: "flex", alignItems: "center" }}>
        {MODES.map((m) => (
          <button
            key={m.key}
            className={`mode-tab${mode === m.key ? " active" : ""}${isDisabled(m.key, mods) ? " disabled" : ""}`}
            onClick={() => {
              if (!isDisabled(m.key, mods)) onChange(m.key, mods);
            }}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="mode-divider" />
      <div style={{ display: "flex", alignItems: "center" }}>
        {MODS.map((md) => {
          const wouldDisable = isDisabled(mode, md.key);
          return (
            <button
              key={md.key}
              className={`mode-tab${mods === md.key ? " active" : ""}${wouldDisable ? " disabled" : ""}`}
              onClick={() => {
                if (!wouldDisable) onChange(mode, md.key);
              }}
            >
              {md.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { modeToInt };
