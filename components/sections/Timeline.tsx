"use client";

import { motion } from "framer-motion";
import { timeline } from "@/lib/content";

export default function Timeline() {
  return (
    <section
      id="scene-timeline"
      className="relative min-h-[130vh] flex items-center"
      aria-label="Career timeline"
    >
      <div className="section">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl"
        >
          <p className="chip mb-4">2006 — Present</p>
          <h2 className="font-display text-3xl md:text-5xl tracking-tightest leading-[1.05]">
            Two decades on the bridge.
          </h2>
          <p className="mt-4 text-neutral-400">
            From frontline escalation to enterprise IT strategy — each role sharpened a
            different lens on infrastructure, service, and business alignment.
          </p>
        </motion.div>

        <ol className="mt-14 relative pl-6 md:pl-8 border-l border-white/10 space-y-8">
          {timeline.map((t, i) => (
            <motion.li
              key={t.company + t.year}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.5, delay: i * 0.04 }}
              className="relative"
            >
              <span
                className={`absolute -left-[35px] top-1 h-3 w-3 rounded-full ring-4 ring-ink-950 ${
                  i === 0 ? "bg-cyan-400" : "bg-white/50"
                }`}
              />
              <div className="text-xs uppercase tracking-widest text-neutral-500">
                {t.year}
              </div>
              <div className="mt-1 font-display text-xl text-white">
                {t.role}
                <span className="text-neutral-500 font-sans text-base"> · {t.company}</span>
              </div>
              <p className="mt-1 text-sm text-neutral-400">{t.note}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
