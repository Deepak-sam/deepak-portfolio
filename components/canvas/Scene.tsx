"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
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
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 2.2, 8], fov: 45, near: 0.1, far: 200 }}
      shadows={false}
    >
      <color attach="background" args={["#05070d"]} />
      <fog attach="fog" args={["#05070d", 22, 90]} />

      <Suspense fallback={null}>
        <Environment />
        <Landscape />
        <SceneOrnaments />
        <Character />
        <CameraRig />
      </Suspense>

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={0.7}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.4}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.2} darkness={0.85} />
      </EffectComposer>
    </Canvas>
  );
}
