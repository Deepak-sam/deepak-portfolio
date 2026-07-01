"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Natural landscape: rolling grass hills, distant mountains, a lake to the
 * north, scattered stylised trees, wildflowers along the path.
 * Everything is stylised (cartoon/Pixar-ish) so it sits well with the character.
 */
export default function Landscape() {
  return (
    <group>
      <Ground />
      <Lake />
      <Mountains />
      <Trees />
      <Flowers />
      <PathStones />
    </group>
  );
}

// ---------- Rolling ground with vertex-noise hills ----------
function Ground() {
  const grassMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#6fa74a",
        roughness: 0.92,
        metalness: 0,
        flatShading: false,
      }),
    []
  );

  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(220, 220, 140, 140);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const rng = mulberry32(7);
    const noise = makeSmoothNoise(rng);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // Distance from path corridor
      const distFromPath = distanceToPathXY(x, -y); // note: plane is XY before rotation
      const corridor = smoothstep(0, 3, distFromPath); // flatter near path
      const h =
        (noise(x * 0.045, y * 0.045) * 0.6 +
          noise(x * 0.12, y * 0.12) * 0.25 +
          noise(x * 0.3, y * 0.3) * 0.08) *
        3.2 *
        corridor;
      pos.setZ(i, h);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  // Colour ramp: darker in dips, lighter on peaks — vertex colours
  useMemo(() => {
    const colors: number[] = [];
    const pos = geom.attributes.position as THREE.BufferAttribute;
    const cGrass = new THREE.Color("#6fa74a");
    const cGrassLight = new THREE.Color("#96c065");
    const cDirt = new THREE.Color("#7a5a3a");
    const cGrassDark = new THREE.Color("#4b7a30");
    for (let i = 0; i < pos.count; i++) {
      const h = pos.getZ(i);
      let c = cGrass.clone();
      if (h > 1.6) c = cGrassLight.clone();
      else if (h < 0.05) c = cGrassDark.clone();
      // Path corridor becomes dirt
      const x = pos.getX(i);
      const y = -pos.getY(i);
      const d = distanceToPathXY(x, y);
      if (d < 0.7) c.lerp(cDirt, 1 - d / 0.7);
      colors.push(c.r, c.g, c.b);
    }
    geom.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  }, [geom]);

  return (
    <mesh
      geometry={geom}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[6, 0, -5]}
      receiveShadow
    >
      <meshStandardMaterial vertexColors roughness={0.93} metalness={0} />
    </mesh>
  );
}

// ---------- Lake ----------
function Lake() {
  const mat = useRef<THREE.MeshStandardMaterial>(null!);
  useFrame(({ clock }) => {
    if (!mat.current) return;
    // Subtle shimmer
    const t = clock.getElapsedTime();
    mat.current.emissiveIntensity = 0.1 + Math.sin(t * 0.6) * 0.02;
  });
  return (
    <group position={[-8, 0.02, -18]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[14, 48]} />
        <meshStandardMaterial
          ref={mat}
          color="#4a8fb0"
          roughness={0.25}
          metalness={0.4}
          emissive="#22526e"
          emissiveIntensity={0.1}
        />
      </mesh>
      {/* Reeds around the near edge */}
      {Array.from({ length: 18 }).map((_, i) => {
        const a = (i / 18) * Math.PI * 0.9 + Math.PI * 0.2;
        const r = 13.5 + Math.random() * 0.4;
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;
        return (
          <mesh key={i} position={[x, 0.35, z]}>
            <coneGeometry args={[0.05, 0.7, 6]} />
            <meshStandardMaterial color="#5c8a2c" roughness={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}

// ---------- Distant mountains (billboard-ish cones) ----------
function Mountains() {
  const peaks = useMemo(() => {
    const rng = mulberry32(101);
    const arr: { x: number; z: number; r: number; h: number; c: string }[] = [];
    // Ring of mountains far out
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2 + rng() * 0.15;
      const dist = 55 + rng() * 20;
      const x = Math.cos(a) * dist + 6;
      const z = Math.sin(a) * dist - 5;
      arr.push({
        x,
        z,
        r: 8 + rng() * 6,
        h: 10 + rng() * 12,
        c: rng() > 0.6 ? "#6a7a92" : "#57697f",
      });
    }
    return arr;
  }, []);

  return (
    <group>
      {peaks.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]}>
          <mesh position={[0, p.h / 2, 0]}>
            <coneGeometry args={[p.r, p.h, 8]} />
            <meshStandardMaterial color={p.c} roughness={0.95} flatShading />
          </mesh>
          {/* Snow cap */}
          <mesh position={[0, p.h * 0.85, 0]}>
            <coneGeometry args={[p.r * 0.35, p.h * 0.3, 8]} />
            <meshStandardMaterial color="#f2f4f8" roughness={0.7} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ---------- Stylised trees ----------
function Trees() {
  const trees = useMemo(() => {
    const rng = mulberry32(23);
    const arr: {
      x: number;
      z: number;
      scale: number;
      kind: "pine" | "round";
      seed: number;
    }[] = [];
    for (let i = 0; i < 80; i++) {
      const x = -35 + rng() * 80;
      const z = -35 + rng() * 45;
      // Avoid path corridor
      if (distanceToPathXY(x, z) < 2.5) continue;
      // Avoid lake
      const dl = Math.hypot(x - -8 - 6, z - -18); // path offset 6 applied to ground group
      if (dl < 15) continue;
      arr.push({
        x,
        z,
        scale: 0.8 + rng() * 1.4,
        kind: rng() > 0.5 ? "pine" : "round",
        seed: rng(),
      });
    }
    return arr;
  }, []);

  return (
    <group>
      {trees.map((t, i) => (
        <group key={i} position={[t.x, groundHeightAt(t.x, t.z), t.z]} scale={t.scale}>
          {t.kind === "pine" ? <PineTree seed={t.seed} /> : <RoundTree seed={t.seed} />}
        </group>
      ))}
    </group>
  );
}

function PineTree({ seed }: { seed: number }) {
  const trunkColor = "#5a3a22";
  const leafColor = seed > 0.5 ? "#2f6b2f" : "#3b7a3d";
  return (
    <group>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.09, 0.13, 1.0, 10]} />
        <meshStandardMaterial color={trunkColor} roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.4, 0]}>
        <coneGeometry args={[0.65, 1.3, 10]} />
        <meshStandardMaterial color={leafColor} roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 2.0, 0]}>
        <coneGeometry args={[0.5, 1.1, 10]} />
        <meshStandardMaterial color={leafColor} roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 2.55, 0]}>
        <coneGeometry args={[0.32, 0.9, 10]} />
        <meshStandardMaterial color={leafColor} roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

function RoundTree({ seed }: { seed: number }) {
  const leafColor = seed > 0.5 ? "#4c8f3f" : "#6aa652";
  return (
    <group>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.11, 0.15, 1.2, 10]} />
        <meshStandardMaterial color="#5a3a22" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.8, 0]}>
        <sphereGeometry args={[0.85, 16, 12]} />
        <meshStandardMaterial color={leafColor} roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0.35, 2.0, 0.1]}>
        <sphereGeometry args={[0.55, 12, 10]} />
        <meshStandardMaterial color={leafColor} roughness={0.9} flatShading />
      </mesh>
      <mesh position={[-0.3, 2.0, -0.1]}>
        <sphereGeometry args={[0.5, 12, 10]} />
        <meshStandardMaterial color={leafColor} roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

// ---------- Wildflowers along the path ----------
function Flowers() {
  const items = useMemo(() => {
    const rng = mulberry32(313);
    const arr: { x: number; z: number; color: string; scale: number }[] = [];
    for (let i = 0; i < 220; i++) {
      const x = -20 + rng() * 60;
      const z = -30 + rng() * 35;
      const d = distanceToPathXY(x, z);
      // Only near path
      if (d < 0.9 || d > 3.5) continue;
      // Not in lake
      const dl = Math.hypot(x - -2, z - -18);
      if (dl < 15) continue;
      const palette = ["#ffd4e5", "#fff2a8", "#ffb3b3", "#e0c8ff", "#ffffff"];
      arr.push({
        x,
        z,
        color: palette[Math.floor(rng() * palette.length)],
        scale: 0.7 + rng() * 0.5,
      });
    }
    return arr;
  }, []);

  return (
    <group>
      {items.map((f, i) => (
        <group
          key={i}
          position={[f.x, groundHeightAt(f.x, f.z) + 0.05, f.z]}
          scale={f.scale}
        >
          <mesh>
            <cylinderGeometry args={[0.008, 0.01, 0.16, 5]} />
            <meshStandardMaterial color="#4c7a2a" />
          </mesh>
          <mesh position={[0, 0.13, 0]}>
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshStandardMaterial
              color={f.color}
              emissive={f.color}
              emissiveIntensity={0.15}
              roughness={0.7}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ---------- Stepping stones along the path ----------
function PathStones() {
  const stones = useMemo(() => {
    const arr: { p: number; x: number; z: number; scale: number; rot: number }[] = [];
    for (let i = 0; i < 40; i++) {
      const p = (i + 0.5) / 40;
      const pt = pathXYAt(p);
      const scale = 0.7 + (i % 3) * 0.15;
      arr.push({ p, x: pt.x, z: pt.z, scale, rot: (i * 0.7) % Math.PI });
    }
    return arr;
  }, []);
  return (
    <group>
      {stones.map((s, i) => (
        <mesh
          key={i}
          position={[s.x, 0.03, s.z]}
          rotation={[-Math.PI / 2, 0, s.rot]}
          scale={[s.scale, s.scale, s.scale]}
        >
          <circleGeometry args={[0.35, 8]} />
          <meshStandardMaterial color="#a99680" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// ---------- Utilities ----------

// Same 7 points as Character / CameraRig — must stay in sync
const PATH_POINTS_2D: { x: number; z: number }[] = [
  { x: 0, z: 0 },
  { x: 0, z: -4 },
  { x: 2.5, z: -8 },
  { x: 6, z: -10 },
  { x: 10, z: -8 },
  { x: 12, z: -4 },
  { x: 12, z: 0 },
];

const CURVE = new THREE.CatmullRomCurve3(
  PATH_POINTS_2D.map((p) => new THREE.Vector3(p.x, 0, p.z)),
  false,
  "catmullrom",
  0.4
);

function pathXYAt(t: number) {
  const p = CURVE.getPointAt(Math.min(1, Math.max(0, t)));
  return { x: p.x, z: p.z };
}

function distanceToPathXY(x: number, z: number) {
  let best = Infinity;
  const samples = 60;
  for (let i = 0; i <= samples; i++) {
    const p = CURVE.getPointAt(i / samples);
    const d = Math.hypot(p.x - x, p.z - z);
    if (d < best) best = d;
  }
  return best;
}

function groundHeightAt(x: number, z: number) {
  // Cheap approx of ground displacement — replicates the noise field used in Ground()
  const noise = _noise;
  const distFromPath = distanceToPathXY(x, z);
  const corridor = smoothstep(0, 3, distFromPath);
  const nx = x - 6;
  const ny = -(z + 5);
  return (
    (noise(nx * 0.045, ny * 0.045) * 0.6 +
      noise(nx * 0.12, ny * 0.12) * 0.25 +
      noise(nx * 0.3, ny * 0.3) * 0.08) *
    3.2 *
    corridor
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

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// Shared noise instance
function makeSmoothNoise(rng: () => number) {
  // Value-noise grid, 128×128, bilinear filtered
  const size = 128;
  const grid: number[] = new Array(size * size);
  for (let i = 0; i < size * size; i++) grid[i] = rng() * 2 - 1;
  return function (x: number, y: number) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const g = (xi: number, yi: number) => {
      const xx = ((xi % size) + size) % size;
      const yy = ((yi % size) + size) % size;
      return grid[yy * size + xx];
    };
    const a = g(ix, iy);
    const b = g(ix + 1, iy);
    const c = g(ix, iy + 1);
    const d = g(ix + 1, iy + 1);
    const u = fx * fx * (3 - 2 * fx);
    const v = fy * fy * (3 - 2 * fy);
    return THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(a, b, u),
      THREE.MathUtils.lerp(c, d, u),
      v
    );
  };
}

const _noise = makeSmoothNoise(mulberry32(7));
