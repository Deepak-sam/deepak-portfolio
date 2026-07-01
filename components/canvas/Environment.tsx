"use client";

import { Stars } from "@react-three/drei";

export default function Environment() {
  return (
    <>
      <ambientLight intensity={0.35} color="#8ab4ff" />
      <hemisphereLight args={["#22d3ee", "#0a0e18", 0.35]} />
      {/* Key light — cyan rim */}
      <directionalLight
        position={[8, 10, 5]}
        intensity={1.1}
        color="#a5f3fc"
      />
      {/* Fill — warm amber from behind */}
      <directionalLight
        position={[-6, 6, -8]}
        intensity={0.6}
        color="#fbbf24"
      />
      <Stars
        radius={90}
        depth={40}
        count={2200}
        factor={2.4}
        saturation={0.1}
        fade
        speed={0.4}
      />
    </>
  );
}
