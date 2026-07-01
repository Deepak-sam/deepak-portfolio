"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Returns global scroll progress in [0, 1] driven by ScrollProvider events.
 * Also returns velocity (approx, in progress-units per second).
 */
export function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const lastProgress = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    let raf = 0;
    const handler = (e: Event) => {
      const p = (e as CustomEvent<number>).detail;
      const now = performance.now();
      const dt = Math.max(1, now - lastTime.current);
      const v = ((p - lastProgress.current) / dt) * 1000; // per second
      setProgress(p);
      setVelocity(v);
      lastProgress.current = p;
      lastTime.current = now;
    };
    window.addEventListener("scrollprogress", handler as EventListener);

    // Fallback for native scroll (no Lenis: reduced motion / mobile)
    const nativeHandler = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      const now = performance.now();
      const dt = Math.max(1, now - lastTime.current);
      const v = ((p - lastProgress.current) / dt) * 1000;
      setProgress(p);
      setVelocity(v);
      lastProgress.current = p;
      lastTime.current = now;
    };
    window.addEventListener("scroll", nativeHandler, { passive: true });
    // Prime once
    nativeHandler();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scrollprogress", handler as EventListener);
      window.removeEventListener("scroll", nativeHandler);
    };
  }, []);

  return { progress, velocity };
}

/**
 * Scene boundaries in normalized [0, 1] scroll progress space.
 * These MUST match the 7 <section> heights composed in page.tsx.
 */
export const SCENES = {
  arrival: [0.0, 0.12],
  present: [0.12, 0.26],
  capabilities: [0.26, 0.42],
  timeline: [0.42, 0.58],
  caseStudies: [0.58, 0.72],
  credentials: [0.72, 0.86],
  handshake: [0.86, 1.0],
} as const;

export type SceneKey = keyof typeof SCENES;

export function sceneProgress(progress: number, scene: SceneKey) {
  const [a, b] = SCENES[scene];
  return Math.min(1, Math.max(0, (progress - a) / (b - a)));
}

export function currentScene(progress: number): SceneKey {
  const keys = Object.keys(SCENES) as SceneKey[];
  for (const k of keys) {
    const [a, b] = SCENES[k];
    if (progress >= a && progress < b) return k;
  }
  return "handshake";
}
