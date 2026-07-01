"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Cloud, Clouds, Sky } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

/**
 * Warm golden-hour daylight environment.
 * Big sky, low sun, cloud layer, birds silhouettes drifting past.
 */
export default function Environment() {
  return (
    <group>
      <Sky
        distance={450000}
        sunPosition={[80, 40, -60]}
        turbidity={4}
        rayleigh={1.6}
        mieCoefficient={0.005}
        mieDirectionalG={0.75}
        inclination={0.48}
        azimuth={0.25}
      />

      {/* Sun key light — softer, warmer for Ghibli painterly feel */}
      <directionalLight
        position={[35, 40, -25]}
        intensity={1.15}
        color="#fff2c8"
      />
      {/* Sky ambient — stronger hemisphere for wraparound painterly light */}
      <hemisphereLight args={["#cfe6f5", "#6d8a4c", 0.9]} />
      {/* Warm bounce */}
      <ambientLight intensity={0.5} color="#fff2d0" />

      <SoftClouds />
      <Birds />
    </group>
  );
}

function SoftClouds() {
  return (
    <Clouds material={THREE.MeshBasicMaterial} limit={20}>
      <Cloud
        seed={11}
        segments={30}
        bounds={[10, 2, 3]}
        volume={5}
        position={[-15, 22, -40]}
        color="#ffffff"
        opacity={0.55}
      />
      <Cloud
        seed={22}
        segments={22}
        bounds={[8, 2, 3]}
        volume={4}
        position={[20, 24, -50]}
        color="#ffffff"
        opacity={0.5}
      />
      <Cloud
        seed={33}
        segments={26}
        bounds={[9, 2, 3]}
        volume={4.5}
        position={[45, 20, -30]}
        color="#fff8ec"
        opacity={0.45}
      />
      <Cloud
        seed={44}
        segments={22}
        bounds={[8, 1.6, 3]}
        volume={4}
        position={[-30, 26, -20]}
        color="#ffffff"
        opacity={0.4}
      />
    </Clouds>
  );
}

function Birds() {
  const group = useRef<THREE.Group>(null!);
  const birds = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, i) => ({
        x: -20 + i * 6,
        y: 18 + (i % 3) * 2,
        z: -35 + (i % 2) * 4,
        speed: 0.2 + Math.random() * 0.2,
        phase: Math.random() * Math.PI * 2,
      })),
    []
  );
  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    group.current.children.forEach((c, i) => {
      const b = birds[i];
      c.position.x = b.x + Math.sin(t * b.speed + b.phase) * 8;
      c.position.y = b.y + Math.sin(t * b.speed * 2 + b.phase) * 0.5;
      c.rotation.y = Math.cos(t * b.speed + b.phase);
      // Flap
      const flap = Math.sin(t * 8 + b.phase);
      (c.children[0] as THREE.Object3D).rotation.z = flap * 0.5;
      (c.children[1] as THREE.Object3D).rotation.z = -flap * 0.5;
    });
  });
  return (
    <group ref={group}>
      {birds.map((b, i) => (
        <group key={i} position={[b.x, b.y, b.z]}>
          <mesh>
            <boxGeometry args={[0.4, 0.03, 0.08]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          <mesh>
            <boxGeometry args={[0.4, 0.03, 0.08]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
