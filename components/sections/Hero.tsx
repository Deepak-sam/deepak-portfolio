"use client";

import { motion } from "framer-motion";
import { profile } from "@/lib/content";

export default function Hero() {
  return (
    <section
      id="scene-arrival"
      className="relative min-h-[100vh] flex items-center"
      aria-label="Introduction"
    >
      <div className="section grid md:grid-cols-2 gap-12 items-center pt-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="chip mb-6">Portfolio · 2026</p>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tightest">
            <span className="text-gradient">{profile.name}</span>
          </h1>
          <p className="mt-6 text-xl md:text-2xl text-neutral-200 font-light">
            {profile.headline}
          </p>
          <p className="mt-2 text-base md:text-lg text-neutral-400">
            {profile.subheadline}
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            {profile.taglines.slice(0, 3).map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
          </div>

          <div className="mt-10 flex gap-3">
            <a
              href="#scene-handshake"
              className="inline-flex items-center gap-2 rounded-full bg-cyan-500/90 hover:bg-cyan-400 text-black px-5 py-2.5 text-sm font-medium transition"
            >
              Get in touch
            </a>
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full glass hover:bg-white/5 px-5 py-2.5 text-sm text-neutral-200 transition"
            >
              LinkedIn
            </a>
          </div>
        </motion.div>
      </div>

      <ScrollCue />
    </section>
  );
}

function ScrollCue() {
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-neutral-500 text-xs tracking-widest uppercase animate-pulse no-print">
      <div className="flex flex-col items-center gap-2">
        <span>Scroll to walk with him</span>
        <span aria-hidden>↓</span>
      </div>
    </div>
  );
}
