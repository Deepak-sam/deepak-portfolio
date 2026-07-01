"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Scene = dynamic(() => import("./canvas/Scene"), { ssr: false });

export default function CanvasClient() {
  const [ok, setOk] = useState<boolean>(false);
  const [reduced, setReduced] = useState<boolean>(false);

  useEffect(() => {
    // Detect WebGL
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        (canvas.getContext("experimental-webgl") as any);
      setOk(!!gl);
    } catch {
      setOk(false);
    }
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  if (reduced || !ok) return null;
  return <Scene />;
}
