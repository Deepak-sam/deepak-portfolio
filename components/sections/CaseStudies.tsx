"use client";

import { motion } from "framer-motion";
import { caseStudies } from "@/lib/content";

export default function CaseStudies() {
  return (
    <section
      id="scene-case-studies"
      className="relative min-h-[120vh] flex items-center"
      aria-label="Case studies"
    >
      <div className="section">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl"
        >
          <p className="chip chip-amber mb-4">Case studies</p>
          <h2 className="font-display text-3xl md:text-5xl tracking-tightest leading-[1.05]">
            Three programmes that shaped organisations.
          </h2>
        </motion.div>

        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {caseStudies.map((c, i) => (
            <motion.article
              key={c.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="glass rounded-2xl p-6 flex flex-col"
            >
              <div className="text-xs text-neutral-500 uppercase tracking-widest">
                Case {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="mt-3 font-display text-xl leading-tight text-white">
                {c.title}
              </h3>
              <p className="mt-3 text-sm text-neutral-300 leading-relaxed flex-1">
                {c.body}
              </p>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {c.metrics.map((m) => (
                  <span key={m} className="chip chip-amber">
                    {m}
                  </span>
                ))}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
