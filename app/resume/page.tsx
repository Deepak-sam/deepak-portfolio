import type { Metadata } from "next";
import Link from "next/link";
import { profile, present, capabilities, timeline, credentials, languages, caseStudies } from "@/lib/content";

export const metadata: Metadata = {
  title: `${profile.name} — Resume`,
  description: profile.summary,
};

export default function ResumePage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 print:bg-white">
      <div className="max-w-4xl mx-auto px-8 py-10 print:py-4">
        <header className="flex items-start justify-between border-b border-neutral-300 pb-6">
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-tight">
              {profile.name}
            </h1>
            <p className="mt-1 text-neutral-700">
              {profile.headline} · {profile.subheadline}
            </p>
          </div>
          <div className="text-right text-sm text-neutral-700">
            <div>{profile.email}</div>
            <div>{profile.phone}</div>
            <div>{profile.location}</div>
            <div>
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                linkedin.com/in/deepaksam020
              </a>
            </div>
          </div>
        </header>

        <section className="mt-6">
          <h2 className="font-display text-lg font-semibold uppercase tracking-widest text-neutral-500">
            Professional summary
          </h2>
          <p className="mt-2 leading-relaxed">{profile.summary}</p>
        </section>

        <section className="mt-6">
          <h2 className="font-display text-lg font-semibold uppercase tracking-widest text-neutral-500">
            Current role
          </h2>
          <div className="mt-2">
            <div className="flex justify-between">
              <div>
                <div className="font-semibold">{present.role}</div>
                <div className="text-neutral-700">{present.company}</div>
              </div>
              <div className="text-sm text-neutral-700 text-right">
                <div>{present.period}</div>
                <div>{present.location}</div>
              </div>
            </div>
            <ul className="mt-3 list-disc pl-5 space-y-1 text-sm leading-relaxed">
              {present.highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-6">
          <h2 className="font-display text-lg font-semibold uppercase tracking-widest text-neutral-500">
            Experience
          </h2>
          <ul className="mt-2 space-y-3">
            {timeline.slice(1).map((t) => (
              <li key={t.company + t.year}>
                <div className="flex justify-between text-sm">
                  <div className="font-semibold">
                    {t.role} — {t.company}
                  </div>
                  <div className="text-neutral-700">{t.year}</div>
                </div>
                <div className="text-sm text-neutral-700">{t.note}</div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="font-display text-lg font-semibold uppercase tracking-widest text-neutral-500">
            Core capabilities
          </h2>
          <div className="mt-2 grid md:grid-cols-2 gap-4 text-sm">
            {capabilities.map((c) => (
              <div key={c.id}>
                <div className="font-semibold">{c.title}</div>
                <div className="text-neutral-700 mt-1">
                  {c.skills.join(" · ")}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="font-display text-lg font-semibold uppercase tracking-widest text-neutral-500">
            Selected programmes
          </h2>
          <ul className="mt-2 space-y-3 text-sm">
            {caseStudies.map((c) => (
              <li key={c.title}>
                <div className="font-semibold">{c.title}</div>
                <p className="text-neutral-700">{c.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="font-display text-lg font-semibold uppercase tracking-widest text-neutral-500">
              Education & certifications
            </h2>
            <ul className="mt-2 space-y-2 text-sm">
              {credentials.map((c) => (
                <li key={c.title}>
                  <div className="font-semibold">{c.title}</div>
                  <div className="text-neutral-700">
                    {c.issuer} · {c.status}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold uppercase tracking-widest text-neutral-500">
              Languages
            </h2>
            <ul className="mt-2 space-y-1 text-sm">
              {languages.map((l) => (
                <li key={l.name}>
                  {l.name} — {l.level}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="mt-8 no-print">
          <Link href="/" className="text-cyan-700 underline">
            ← Back to interactive portfolio
          </Link>
        </div>
      </div>
    </div>
  );
}
