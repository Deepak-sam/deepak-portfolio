"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Infinite-feeling voxel-grid ground plane with animated gridline glow.
 */
export default function Landscape() {
  const gridRef = useRef<THREE.LineSegments>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);

  const gridGeom = useMemo(() => {
    const size = 200;
    const step = 2;
    const half = size / 2;
    const pts: number[] = [];
    for (let i = -half; i <= half; i += step) {
      pts.push(i, 0, -half, i, 0, half);
      pts.push(-half, 0, i, half, 0, i);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (glowRef.current) {
      const m = glowRef.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.18 + Math.sin(t * 0.7) * 0.04;
    }
  });

  return (
    <group position={[0, -0.01, 0]}>
      {/* Horizon glow disc */}
      <mesh ref={glowRef} position={[0, -0.02, -40]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[60, 64]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.18} />
      </mesh>

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#070b14" roughness={1} metalness={0} />
      </mesh>

      {/* Grid lines */}
      <lineSegments ref={gridRef} geometry={gridGeom} position={[0, 0.001, 0]}>
        <lineBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0.14}
          depthWrite={false}
        />
      </lineSegments>

      {/* Faint server-rack skyline silhouette */}
      <Skyline />
    </group>
  );
}

function Skyline() {
  const rects = useMemo(() => {
    const arr: { x: number; z: number; w: number; h: number; d: number }[] = [];
    const rng = mulberry32(42);
    for (let i = 0; i < 34; i++) {
      const x = -50 + i * 3 + (rng() - 0.5) * 1.2;
      const w = 1.2 + rng() * 1.6;
      const h = 1.5 + rng() * 5.5;
      const d = 1 + rng() * 1.4;
      const z = -45 - rng() * 6;
      arr.push({ x, z, w, h, d });
    }
    return arr;
  }, []);

  return (
    <group>
      {rects.map((r, i) => (
        <mesh key={i} position={[r.x, r.h / 2, r.z]}>
          <boxGeometry args={[r.w, r.h, r.d]} />
          <meshStandardMaterial
            color="#0e1524"
            emissive="#0b1a2b"
            emissiveIntensity={0.5}
            roughness={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
