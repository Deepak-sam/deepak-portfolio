"use client";

import { motion } from "framer-motion";
import { present } from "@/lib/content";

export default function Present() {
  return (
    <section
      id="scene-present"
      className="relative min-h-[110vh] flex items-center"
      aria-label="Current role"
    >
      <div className="section grid md:grid-cols-2 gap-10 items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="md:col-start-2"
        >
          <p className="chip mb-4">Present</p>
          <h2 className="font-display text-3xl md:text-5xl tracking-tightest leading-[1.05]">
            {present.role}
          </h2>
          <p className="mt-2 text-cyan-300 text-lg">{present.company}</p>
          <p className="text-neutral-500 text-sm">
            {present.period} · {present.location}
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4">
            {present.stats.map((s) => (
              <div key={s.label} className="glass rounded-xl p-4">
                <div className="text-xs text-neutral-500 uppercase tracking-widest">
                  {s.label}
                </div>
                <div className="mt-1 font-display text-3xl text-white">
                  {s.value}
                </div>
                <div className="text-xs text-neutral-400">{s.unit}</div>
              </div>
            ))}
          </div>

          <ul className="mt-8 space-y-2 text-sm text-neutral-300 leading-relaxed">
            {present.highlights.slice(0, 4).map((h, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-cyan-400 mt-1">▸</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
