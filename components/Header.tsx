"use client";

import Link from "next/link";

const sections = [
  { id: "scene-arrival", label: "Home" },
  { id: "scene-present", label: "Present" },
  { id: "scene-capabilities", label: "Capabilities" },
  { id: "scene-timeline", label: "Timeline" },
  { id: "scene-case-studies", label: "Case Studies" },
  { id: "scene-credentials", label: "Credentials" },
  { id: "scene-handshake", label: "Contact" },
];

export default function Header() {
  return (
    <header className="fixed top-0 inset-x-0 z-30 no-print">
      <div className="section flex items-center justify-between py-5">
        <Link href="/" className="flex items-center gap-2 text-white">
          <span className="inline-block h-6 w-6 rounded-md bg-gradient-to-br from-cyan-400 to-amber-400" />
          <span className="font-display text-sm tracking-widest uppercase">DT</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="text-xs uppercase tracking-widest text-neutral-400 hover:text-white transition px-3 py-2"
            >
              {s.label}
            </a>
          ))}
        </nav>
        <a
          href="mailto:deepak.sam@gmail.com"
          className="hidden md:inline-flex items-center gap-2 rounded-full glass hover:bg-white/5 px-4 py-2 text-xs text-neutral-200 transition uppercase tracking-widest"
        >
          Hire
        </a>
      </div>
    </header>
  );
}
