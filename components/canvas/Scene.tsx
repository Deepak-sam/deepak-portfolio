"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import {
  EffectComposer,
  Bloom,
  Vignette,
  BrightnessContrast,
} from "@react-three/postprocessing";
import Landscape from "./Landscape";
import Character from "./Character";
import Environment from "./Environment";
import CameraRig from "./CameraRig";
import SceneOrnaments from "./SceneOrnaments";

export default function Scene() {
  return (
    <Canvas
      className="canvas-fixed"
      dpr={[1, 1.75]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      }}
      camera={{ position: [0, 2.4, 7], fov: 42, near: 0.1, far: 800 }}
      shadows={false}
    >
      {/* Soft golden-hour haze */}
      <color attach="background" args={["#bfd6e6"]} />
      <fog attach="fog" args={["#d9e8ee", 30, 120]} />

      <Suspense fallback={null}>
        <Environment />
        <Landscape />
        <SceneOrnaments />
        <Character />
        <CameraRig />
      </Suspense>

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={0.35}
          luminanceThreshold={0.65}
          luminanceSmoothing={0.5}
          mipmapBlur
        />
        <BrightnessContrast brightness={0.02} contrast={0.06} />
        <Vignette eskil={false} offset={0.28} darkness={0.55} />
      </EffectComposer>
    </Canvas>
  );
}
