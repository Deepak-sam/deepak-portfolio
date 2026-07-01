"use client";

import { useScrollProgress } from "@/lib/useScrollProgress";

const scenes = [
  { id: "scene-arrival", label: "Arrival" },
  { id: "scene-present", label: "Present" },
  { id: "scene-capabilities", label: "Capabilities" },
  { id: "scene-timeline", label: "Timeline" },
  { id: "scene-case-studies", label: "Cases" },
  { id: "scene-credentials", label: "Badges" },
  { id: "scene-handshake", label: "Contact" },
];

export default function ProgressRail() {
  const { progress } = useScrollProgress();
  const idx = Math.min(scenes.length - 1, Math.floor(progress * scenes.length));
  return (
    <aside className="fixed right-6 top-1/2 -translate-y-1/2 z-30 hidden lg:flex flex-col items-end gap-3 no-print">
      {scenes.map((s, i) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className="group flex items-center gap-3"
          aria-label={`Jump to ${s.label}`}
        >
          <span
            className={`text-[10px] uppercase tracking-widest transition-opacity ${
              i === idx ? "opacity-100 text-white" : "opacity-40 text-neutral-400 group-hover:opacity-90"
            }`}
          >
            {s.label}
          </span>
          <span
            className={`h-[2px] transition-all ${
              i === idx
                ? "w-10 bg-cyan-400"
                : "w-5 bg-white/30 group-hover:w-8 group-hover:bg-white/60"
            }`}
          />
        </a>
      ))}
    </aside>
  );
}
