"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useScrollProgress, sceneProgress } from "@/lib/useScrollProgress";

/**
 * Natural-scene ornaments that fade in/out per scene:
 *  - Scene 2 "Present": fireflies swirling around a golden orb
 *  - Scene 3 "Capabilities": four standing stones (like Stonehenge markers)
 *  - Scene 4 "Timeline": stone milestone posts along the path
 *  - Scene 6 "Credentials": floating paper lanterns
 */
export default function SceneOrnaments() {
  return (
    <>
      <FireflyHub />
      <StandingStones />
      <MilestonePosts />
      <PaperLanterns />
    </>
  );
}

// ---------- Scene 2: fireflies around a warm orb ----------
function FireflyHub() {
  const group = useRef<THREE.Group>(null!);
  const { progress } = useScrollProgress();
  const orb = useRef<THREE.Mesh>(null!);

  const flies = useMemo(() => {
    const arr: { r: number; a: number; y: number; speed: number; wobble: number }[] = [];
    for (let i = 0; i < 60; i++) {
      arr.push({
        r: 1.2 + Math.random() * 2.0,
        a: Math.random() * Math.PI * 2,
        y: 0.5 + Math.random() * 2.4,
        speed: 0.25 + Math.random() * 0.5,
        wobble: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, []);

  useFrame(({ clock }, dt) => {
    if (!group.current) return;
    const t = sceneProgress(progress, "present");
    const vis = smoothstep(0.05, 0.5, t) * (1 - smoothstep(0.85, 1, t));
    group.current.visible = vis > 0.01;
    group.current.position.set(0, 0, -4);
    group.current.rotation.y += dt * 0.1;
    const clockT = clock.getElapsedTime();
    group.current.children.forEach((child, i) => {
      const f = flies[i];
      if (!f) return;
      f.a += dt * f.speed;
      const rr = f.r + Math.sin(clockT * 2 + f.wobble) * 0.15;
      child.position.set(
        Math.cos(f.a) * rr,
        f.y + Math.sin(clockT * 3 + f.wobble) * 0.1,
        Math.sin(f.a) * rr
      );
      const m = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      if (m) {
        const flicker = 0.6 + Math.sin(clockT * 6 + f.wobble) * 0.4;
        m.opacity = flicker * vis;
      }
    });
    if (orb.current) {
      const mat = orb.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.2 * vis;
      orb.current.scale.setScalar(1 + Math.sin(clockT * 1.5) * 0.04);
    }
  });

  return (
    <group ref={group}>
      {flies.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshBasicMaterial color="#ffe08a" transparent opacity={0.8} />
        </mesh>
      ))}
      <mesh ref={orb} position={[0, 1.4, 0]}>
        <sphereGeometry args={[0.45, 24, 20]} />
        <meshStandardMaterial
          color="#fff2b8"
          emissive="#ffb84a"
          emissiveIntensity={1.2}
          roughness={0.15}
          metalness={0.4}
        />
      </mesh>
      {/* Pedestal */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.35, 0.55, 0.8, 12]} />
        <meshStandardMaterial color="#7c6a55" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ---------- Scene 3: standing stones ----------
function StandingStones() {
  const group = useRef<THREE.Group>(null!);
  const { progress } = useScrollProgress();

  const stones = useMemo(
    () => [
      { p: [-2, 0, -7] as [number, number, number], h: 3.8, w: 0.9, tint: "#c3d3e0" },
      { p: [1, 0, -7.5] as [number, number, number], h: 4.4, w: 1.0, tint: "#b0c0a8" },
      { p: [3.5, 0, -6.5] as [number, number, number], h: 3.5, w: 0.85, tint: "#c8bfae" },
      { p: [5, 0, -5] as [number, number, number], h: 4.1, w: 0.95, tint: "#a8b6bf" },
    ],
    []
  );

  useFrame(() => {
    if (!group.current) return;
    const t = sceneProgress(progress, "capabilities");
    const vis = smoothstep(0.05, 0.5, t) * (1 - smoothstep(0.85, 1, t));
    group.current.visible = vis > 0.01;
    group.current.children.forEach((c, i) => {
      const s = stones[i];
      if (!s) return;
      const targetY = vis * (s.h / 2);
      c.position.y = THREE.MathUtils.lerp(c.position.y, targetY, 0.08);
    });
  });

  return (
    <group ref={group}>
      {stones.map((s, i) => (
        <group key={i} position={[s.p[0], 0, s.p[2]]}>
          <mesh>
            <boxGeometry args={[s.w, s.h, s.w * 0.7]} />
            <meshStandardMaterial color={s.tint} roughness={0.95} flatShading />
          </mesh>
          {/* Moss patch */}
          <mesh position={[0, -s.h / 2 + 0.4, s.w * 0.36]}>
            <sphereGeometry args={[s.w * 0.4, 12, 8]} />
            <meshStandardMaterial color="#4a6a2c" roughness={0.95} />
          </mesh>
          {/* Rune glow */}
          <mesh position={[0, 0.4, s.w * 0.36]}>
            <ringGeometry args={[0.08, 0.14, 16]} />
            <meshBasicMaterial
              color={i % 2 === 0 ? "#7dd3fc" : "#fbbf24"}
              transparent
              opacity={0.85}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ---------- Scene 4: stone milestone posts ----------
function MilestonePosts() {
  const group = useRef<THREE.Group>(null!);
  const { progress } = useScrollProgress();
  const posts = useMemo(
    () =>
      Array.from({ length: 8 }).map((_, i) => ({
        p: [6 + (i - 4) * 0.7, 0, -10 + (i % 2 === 0 ? -1.6 : 1.6)] as [
          number,
          number,
          number
        ],
        h: 1.4 + (i % 3) * 0.3,
      })),
    []
  );

  useFrame(() => {
    if (!group.current) return;
    const t = sceneProgress(progress, "timeline");
    const vis = smoothstep(0.02, 0.4, t) * (1 - smoothstep(0.85, 1, t));
    group.current.visible = vis > 0.01;
    group.current.children.forEach((c, i) => {
      const localT = smoothstep(i / posts.length - 0.1, i / posts.length + 0.1, t);
      const targetY = localT * (posts[i].h / 2);
      c.position.y = THREE.MathUtils.lerp(c.position.y, targetY, 0.1);
    });
  });

  return (
    <group ref={group}>
      {posts.map((p, i) => (
        <group key={i} position={[p.p[0], 0, p.p[2]]}>
          <mesh>
            <cylinderGeometry args={[0.16, 0.2, p.h, 10]} />
            <meshStandardMaterial color="#b8a88c" roughness={0.95} flatShading />
          </mesh>
          <mesh position={[0, p.h / 2 + 0.05, 0]}>
            <sphereGeometry args={[0.14, 12, 10]} />
            <meshStandardMaterial
              color="#fff2b8"
              emissive="#ffb84a"
              emissiveIntensity={0.9}
              roughness={0.4}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ---------- Scene 6: floating paper lanterns ----------
function PaperLanterns() {
  const group = useRef<THREE.Group>(null!);
  const { progress } = useScrollProgress();
  const lanterns = useMemo(() => {
    const arr: {
      angle: number;
      radius: number;
      y: number;
      color: string;
      phase: number;
    }[] = [];
    const palette = ["#ffb98a", "#ffd07a", "#ff9a6c", "#f0e6a6"];
    for (let i = 0; i < 8; i++) {
      arr.push({
        angle: (i / 8) * Math.PI * 2,
        radius: 1.6 + Math.random() * 0.6,
        y: 1.6 + Math.random() * 1.2,
        color: palette[i % palette.length],
        phase: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, []);

  useFrame(({ clock }, dt) => {
    if (!group.current) return;
    const t = sceneProgress(progress, "credentials");
    const vis = smoothstep(0.05, 0.5, t) * (1 - smoothstep(0.85, 1, t));
    group.current.visible = vis > 0.01;
    group.current.position.set(12, 0, -4);
    group.current.rotation.y += dt * 0.12;
    const clockT = clock.getElapsedTime();
    group.current.children.forEach((c, i) => {
      const l = lanterns[i];
      if (!l) return;
      c.position.set(
        Math.cos(l.angle + clockT * 0.15) * l.radius,
        l.y + Math.sin(clockT * 0.8 + l.phase) * 0.15,
        Math.sin(l.angle + clockT * 0.15) * l.radius
      );
      const body = c.children[0] as THREE.Mesh;
      if (body) {
        const m = body.material as THREE.MeshStandardMaterial;
        m.emissiveIntensity = 1.1 * vis * (0.85 + Math.sin(clockT * 2 + l.phase) * 0.15);
      }
    });
  });

  return (
    <group ref={group}>
      {lanterns.map((l, i) => (
        <group key={i}>
          <mesh>
            <cylinderGeometry args={[0.16, 0.16, 0.28, 12]} />
            <meshStandardMaterial
              color={l.color}
              emissive={l.color}
              emissiveIntensity={1.1}
              roughness={0.6}
            />
          </mesh>
          {/* Top cap */}
          <mesh position={[0, 0.17, 0]}>
            <cylinderGeometry args={[0.18, 0.16, 0.03, 12]} />
            <meshStandardMaterial color="#3a2418" roughness={0.8} />
          </mesh>
          {/* String */}
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 0.4, 6]} />
            <meshStandardMaterial color="#2a1a10" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
