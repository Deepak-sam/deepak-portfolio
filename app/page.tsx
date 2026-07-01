import CanvasClient from "@/components/CanvasClient";
import ScrollProvider from "@/components/ScrollProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProgressRail from "@/components/ProgressRail";
import Hero from "@/components/sections/Hero";
import Present from "@/components/sections/Present";
import Capabilities from "@/components/sections/Capabilities";
import Timeline from "@/components/sections/Timeline";
import CaseStudies from "@/components/sections/CaseStudies";
import Credentials from "@/components/sections/Credentials";
import Contact from "@/components/sections/Contact";

export default function HomePage() {
  return (
    <ScrollProvider>
      <div className="relative">
        {/* Fixed cinematic canvas */}
        <div aria-hidden className="canvas-fixed">
          <CanvasClient />
        </div>

        {/* Subtle grid overlay */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-10 bg-grid opacity-40 mix-blend-screen no-print"
        />

        <Header />
        <ProgressRail />

        <main className="relative z-20">
          <Hero />
          <Present />
          <Capabilities />
          <Timeline />
          <CaseStudies />
          <Credentials />
          <Contact />
        </main>

        <Footer />
      </div>
    </ScrollProvider>
  );
}
