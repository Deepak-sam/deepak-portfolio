import { profile } from "@/lib/content";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/5 mt-12 no-print">
      <div className="section py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-neutral-500">
        <div>
          © {new Date().getFullYear()} {profile.name} · {profile.location}
        </div>
        <div className="flex flex-wrap gap-4">
          <a href={`mailto:${profile.email}`} className="hover:text-white transition">
            {profile.email}
          </a>
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition"
          >
            LinkedIn
          </a>
          <a href="/resume" className="hover:text-white transition">
            Resume
          </a>
        </div>
      </div>
    </footer>
  );
}
