"use client";

import { motion } from "framer-motion";
import { capabilities } from "@/lib/content";
import { cn } from "@/lib/cn";

export default function Capabilities() {
  return (
    <section
      id="scene-capabilities"
      className="relative min-h-[110vh] flex items-center"
      aria-label="Capabilities"
    >
      <div className="section">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl"
        >
          <p className="chip mb-4">Capabilities</p>
          <h2 className="font-display text-3xl md:text-5xl tracking-tightest leading-[1.05]">
            Four pillars of a modern digital workplace.
          </h2>
          <p className="mt-4 text-neutral-400">
            Deep, hands-on expertise across the Microsoft 365 ecosystem — built and
            operated at enterprise scale for 19+ years.
          </p>
        </motion.div>

        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {capabilities.map((c, i) => (
            <motion.article
              key={c.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="glass rounded-2xl p-5"
            >
              <div
                className={cn(
                  "h-1 w-10 rounded-full mb-4",
                  c.accent === "cyan" ? "bg-cyan-400" : "bg-amber-400"
                )}
              />
              <h3 className="font-display text-lg text-white leading-tight">
                {c.title}
              </h3>
              <ul className="mt-4 space-y-1.5 text-sm text-neutral-300">
                {c.skills.map((s) => (
                  <li key={s} className="flex gap-2">
                    <span
                      className={cn(
                        "mt-1.5 h-1 w-1 rounded-full",
                        c.accent === "cyan" ? "bg-cyan-400" : "bg-amber-400"
                      )}
                    />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
