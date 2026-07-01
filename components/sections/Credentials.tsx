"use client";

import { motion } from "framer-motion";
import { credentials, languages } from "@/lib/content";

export default function Credentials() {
  return (
    <section
      id="scene-credentials"
      className="relative min-h-[110vh] flex items-center"
      aria-label="Credentials"
    >
      <div className="section">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl"
        >
          <p className="chip mb-4">Credentials</p>
          <h2 className="font-display text-3xl md:text-5xl tracking-tightest leading-[1.05]">
            Continuing to earn the badge.
          </h2>
        </motion.div>

        <div className="mt-12 grid md:grid-cols-3 gap-4">
          {credentials.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="glass rounded-xl p-5"
            >
              <div className="text-xs text-neutral-500 uppercase tracking-widest">
                {c.status}
              </div>
              <div className="mt-2 font-display text-lg text-white leading-tight">
                {c.title}
              </div>
              <div className="text-sm text-neutral-400 mt-1">{c.issuer}</div>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-2">
          {languages.map((l) => (
            <span key={l.name} className="chip">
              {l.name} · {l.level}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
