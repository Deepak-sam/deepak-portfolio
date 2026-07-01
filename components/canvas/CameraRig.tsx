"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useScrollProgress } from "@/lib/useScrollProgress";

/**
 * Camera choreography — follows character but pans/dollies per scene.
 */
export default function CameraRig() {
  const { camera } = useThree();
  const { progress } = useScrollProgress();
  const target = useRef(new THREE.Vector3(0, 1.2, 0));
  const desiredPos = useRef(new THREE.Vector3(0, 2.2, 8));

  useFrame((_, dt) => {
    const p = progress;
    const c = characterPos(p);

    // Camera keyframes per scene
    // scene 1 arrival: pull back and slightly up
    // scene 2 present: over-shoulder tracking
    // scene 3 capabilities: side-on tracking
    // scene 4 timeline: from front-left, wide
    // scene 5 case studies: dolly-in close
    // scene 6 credentials: slight orbit
    // scene 7 handshake: face-on, low

    const kf: { p: number; offset: THREE.Vector3; look: THREE.Vector3 }[] = [
      { p: 0.0, offset: new THREE.Vector3(0, 3.0, 8), look: new THREE.Vector3(0, 1.5, 0) },
      { p: 0.12, offset: new THREE.Vector3(-2.0, 3.2, 6.5), look: new THREE.Vector3(0, 1.4, -0.5) },
      { p: 0.26, offset: new THREE.Vector3(-3.6, 3.0, 5.0), look: new THREE.Vector3(0.5, 1.4, -0.5) },
      { p: 0.42, offset: new THREE.Vector3(-4.5, 3.6, 5.5), look: new THREE.Vector3(0.5, 1.3, -0.5) },
      { p: 0.58, offset: new THREE.Vector3(-3.8, 2.6, 4.0), look: new THREE.Vector3(0.2, 1.5, -0.5) },
      { p: 0.72, offset: new THREE.Vector3(-2.8, 3.0, 5.0), look: new THREE.Vector3(0, 1.5, -0.5) },
      { p: 0.86, offset: new THREE.Vector3(0, 2.2, 5.0), look: new THREE.Vector3(0, 1.4, 0) },
      { p: 1.0, offset: new THREE.Vector3(0, 1.9, 3.5), look: new THREE.Vector3(0, 1.5, 0) },
    ];

    // Find surrounding keyframes
    let a = kf[0];
    let b = kf[1];
    for (let i = 0; i < kf.length - 1; i++) {
      if (p >= kf[i].p && p <= kf[i + 1].p) {
        a = kf[i];
        b = kf[i + 1];
        break;
      }
    }
    const t = (p - a.p) / Math.max(0.0001, b.p - a.p);
    const et = easeInOut(t);
    const offset = new THREE.Vector3().lerpVectors(a.offset, b.offset, et);
    const lookOff = new THREE.Vector3().lerpVectors(a.look, b.look, et);

    desiredPos.current.copy(c).add(offset);
    target.current.copy(c).add(lookOff);

    camera.position.lerp(desiredPos.current, Math.min(1, dt * 3));
    // Smooth look-at
    const currentLook = new THREE.Vector3();
    camera.getWorldDirection(currentLook);
    const desiredLook = new THREE.Vector3().subVectors(target.current, camera.position).normalize();
    const blended = currentLook.lerp(desiredLook, Math.min(1, dt * 4)).normalize();
    const lookTarget = new THREE.Vector3().copy(camera.position).add(blended);
    camera.lookAt(lookTarget);
  });

  return null;
}

// Copy of path (kept in sync with Character.tsx)
const PATH_POINTS: THREE.Vector3[] = [
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0, 0, -4),
  new THREE.Vector3(2.5, 0, -8),
  new THREE.Vector3(6, 0, -10),
  new THREE.Vector3(10, 0, -8),
  new THREE.Vector3(12, 0, -4),
  new THREE.Vector3(12, 0, 0),
];
const CURVE = new THREE.CatmullRomCurve3(PATH_POINTS, false, "catmullrom", 0.4);
function characterPos(p: number) {
  return CURVE.getPointAt(Math.min(1, Math.max(0, p)));
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
