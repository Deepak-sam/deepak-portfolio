"use client";

import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Linkedin, FileText } from "lucide-react";
import { profile } from "@/lib/content";

export default function Contact() {
  return (
    <section
      id="scene-handshake"
      className="relative min-h-[110vh] flex items-center"
      aria-label="Contact"
    >
      <div className="section">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9 }}
          className="max-w-3xl"
        >
          <p className="chip mb-4">Let's talk</p>
          <h2 className="font-display text-4xl md:text-6xl tracking-tightest leading-[1.02]">
            <span className="text-gradient">Ready when you are.</span>
          </h2>
          <p className="mt-4 text-neutral-400 text-lg max-w-xl">
            Open to AVP / VP / CTO conversations focused on enterprise IT strategy,
            digital workplace transformation, and Zero Trust security.
          </p>

          <div className="mt-10 grid sm:grid-cols-2 gap-4">
            <a
              href={`mailto:${profile.email}`}
              className="glass rounded-xl p-5 hover:bg-white/5 transition group"
            >
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-cyan-400" />
                <div>
                  <div className="text-xs uppercase tracking-widest text-neutral-500">
                    Email
                  </div>
                  <div className="text-white group-hover:text-cyan-300 transition">
                    {profile.email}
                  </div>
                </div>
              </div>
            </a>
            <a
              href={`tel:${profile.phone.replace(/\s/g, "")}`}
              className="glass rounded-xl p-5 hover:bg-white/5 transition group"
            >
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-amber-400" />
                <div>
                  <div className="text-xs uppercase tracking-widest text-neutral-500">
                    Phone
                  </div>
                  <div className="text-white group-hover:text-amber-300 transition">
                    {profile.phone}
                  </div>
                </div>
              </div>
            </a>
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noreferrer"
              className="glass rounded-xl p-5 hover:bg-white/5 transition group"
            >
              <div className="flex items-center gap-3">
                <Linkedin className="h-5 w-5 text-cyan-400" />
                <div>
                  <div className="text-xs uppercase tracking-widest text-neutral-500">
                    LinkedIn
                  </div>
                  <div className="text-white group-hover:text-cyan-300 transition">
                    linkedin.com/in/deepaksam020
                  </div>
                </div>
              </div>
            </a>
            <div className="glass rounded-xl p-5">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-amber-400" />
                <div>
                  <div className="text-xs uppercase tracking-widest text-neutral-500">
                    Based in
                  </div>
                  <div className="text-white">{profile.location}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="/resume"
              className="inline-flex items-center gap-2 rounded-full bg-cyan-500/90 hover:bg-cyan-400 text-black px-5 py-2.5 text-sm font-medium transition"
            >
              <FileText className="h-4 w-4" />
              View full resume
            </a>
            <a
              href={profile.resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full glass hover:bg-white/5 px-5 py-2.5 text-sm text-neutral-200 transition"
            >
              Original resume site ↗
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
