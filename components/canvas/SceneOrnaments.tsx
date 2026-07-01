"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useScrollProgress, sceneProgress } from "@/lib/useScrollProgress";

/**
 * Scene ornaments: hub orbits, capability monoliths, timeline pillars,
 * credentials badges. Each fades in during its scene.
 */
export default function SceneOrnaments() {
  return (
    <>
      <HubOrbits />
      <Monoliths />
      <TimelinePillars />
      <CredentialsGrove />
    </>
  );
}

// ---------- Scene 2: Hub with orbiting endpoints ----------
function HubOrbits() {
  const group = useRef<THREE.Group>(null!);
  const { progress } = useScrollProgress();

  const dots = useMemo(() => {
    const arr: { r: number; a: number; y: number; speed: number }[] = [];
    for (let i = 0; i < 90; i++) {
      arr.push({
        r: 1.4 + Math.random() * 1.6,
        a: Math.random() * Math.PI * 2,
        y: 0.4 + Math.random() * 1.6,
        speed: 0.25 + Math.random() * 0.4,
      });
    }
    return arr;
  }, []);

  useFrame((_, dt) => {
    if (!group.current) return;
    const t = sceneProgress(progress, "present");
    const vis = smoothstep(0.05, 0.6, t) * (1 - smoothstep(0.85, 1, t));
    group.current.visible = vis > 0.01;
    (group.current as any).userData.vis = vis;
    group.current.rotation.y += dt * 0.15;
    group.current.position.set(0, 0, -4);
    group.current.children.forEach((child, i) => {
      const d = dots[i];
      if (!d) return;
      d.a += dt * d.speed;
      child.position.set(Math.cos(d.a) * d.r, d.y, Math.sin(d.a) * d.r);
      const m = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      if (m) m.opacity = 0.85 * vis;
    });
  });

  return (
    <group ref={group}>
      {dots.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.8} />
        </mesh>
      ))}
      {/* Central hub */}
      <mesh position={[0, 1, 0]}>
        <icosahedronGeometry args={[0.35, 1]} />
        <meshStandardMaterial
          color="#0a1220"
          emissive="#22d3ee"
          emissiveIntensity={0.9}
          roughness={0.2}
          metalness={0.6}
        />
      </mesh>
    </group>
  );
}

// ---------- Scene 3: Four capability monoliths ----------
function Monoliths() {
  const group = useRef<THREE.Group>(null!);
  const { progress } = useScrollProgress();
  const positions: [number, number, number][] = [
    [-2, 0, -7],
    [1, 0, -7.5],
    [3.5, 0, -6.5],
    [5, 0, -5],
  ];
  const colors = ["#22d3ee", "#f59e0b", "#22d3ee", "#f59e0b"];

  useFrame(() => {
    if (!group.current) return;
    const t = sceneProgress(progress, "capabilities");
    const vis = smoothstep(0.05, 0.5, t) * (1 - smoothstep(0.85, 1, t));
    group.current.visible = vis > 0.01;
    group.current.children.forEach((c, i) => {
      const targetY = vis * 2.2;
      c.position.y = THREE.MathUtils.lerp(c.position.y, targetY, 0.08);
      const m = ((c as THREE.Mesh).material as THREE.MeshStandardMaterial);
      if (m) m.emissiveIntensity = 0.6 * vis;
    });
  });

  return (
    <group ref={group}>
      {positions.map((p, i) => (
        <mesh key={i} position={p}>
          <boxGeometry args={[0.55, 4.4, 0.55]} />
          <meshStandardMaterial
            color="#0d1524"
            emissive={colors[i]}
            emissiveIntensity={0.6}
            roughness={0.35}
            metalness={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

// ---------- Scene 4: Timeline pillars ----------
function TimelinePillars() {
  const group = useRef<THREE.Group>(null!);
  const { progress } = useScrollProgress();
  const years = [2006, 2009, 2013, 2014, 2015, 2017, 2021, 2022];

  useFrame(() => {
    if (!group.current) return;
    const t = sceneProgress(progress, "timeline");
    const vis = smoothstep(0.02, 0.4, t) * (1 - smoothstep(0.85, 1, t));
    group.current.visible = vis > 0.01;
    group.current.children.forEach((c, i) => {
      const localT = smoothstep(i / years.length - 0.1, i / years.length + 0.1, t);
      const targetH = localT * (1.5 + (i % 3) * 0.4);
      c.scale.y = THREE.MathUtils.lerp(c.scale.y, Math.max(0.01, targetH), 0.1);
      const m = ((c as THREE.Mesh).material as THREE.MeshStandardMaterial);
      if (m) m.emissiveIntensity = 0.5 * vis * localT;
    });
  });

  return (
    <group ref={group} position={[6, 0, -10]}>
      {years.map((y, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        const x = (i - years.length / 2) * 0.6;
        return (
          <mesh key={y} position={[x, 0.75, side * 1.4]} scale={[1, 0.01, 1]}>
            <boxGeometry args={[0.22, 1.5, 0.22]} />
            <meshStandardMaterial
              color="#0e1626"
              emissive={i % 2 === 0 ? "#22d3ee" : "#f59e0b"}
              emissiveIntensity={0.4}
              roughness={0.4}
              metalness={0.5}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ---------- Scene 6: Credentials badges ----------
function CredentialsGrove() {
  const group = useRef<THREE.Group>(null!);
  const { progress } = useScrollProgress();

  useFrame((_, dt) => {
    if (!group.current) return;
    const t = sceneProgress(progress, "credentials");
    const vis = smoothstep(0.05, 0.5, t) * (1 - smoothstep(0.85, 1, t));
    group.current.visible = vis > 0.01;
    group.current.rotation.y += dt * 0.15;
    group.current.position.set(12, 0, -4);
    group.current.children.forEach((c) => {
      const m = ((c as THREE.Mesh).material as THREE.MeshStandardMaterial);
      if (m) m.emissiveIntensity = 0.7 * vis;
    });
  });

  const badges = [
    { angle: 0, y: 1.8, color: "#22d3ee" },
    { angle: (Math.PI * 2) / 6, y: 2.2, color: "#f59e0b" },
    { angle: (Math.PI * 4) / 6, y: 1.6, color: "#22d3ee" },
    { angle: Math.PI, y: 2.0, color: "#f59e0b" },
    { angle: (Math.PI * 8) / 6, y: 1.7, color: "#22d3ee" },
    { angle: (Math.PI * 10) / 6, y: 2.1, color: "#f59e0b" },
  ];

  return (
    <group ref={group}>
      {badges.map((b, i) => (
        <mesh key={i} position={[Math.cos(b.angle) * 1.8, b.y, Math.sin(b.angle) * 1.8]}>
          <torusGeometry args={[0.22, 0.05, 12, 32]} />
          <meshStandardMaterial
            color="#0e1626"
            emissive={b.color}
            emissiveIntensity={0.7}
            roughness={0.3}
            metalness={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
