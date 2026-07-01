"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useScrollProgress, sceneProgress } from "@/lib/useScrollProgress";

/**
 * Studio Ghibli-style character.
 *
 * Visual language:
 *  - Cel-shaded (MeshToonMaterial + 3-step gradient) — flat colour with one
 *    hard shadow band, giving that hand-painted Ghibli look.
 *  - Soft rounded features, larger almond eyes with two white highlights,
 *    painterly layered hair clumps, gentle blush, thin brows, small nose.
 *  - Warm muted palette. Business-casual chambray shirt (Ghibli protagonists
 *    dress soft; still professional-appropriate for Deepak's likeness).
 *
 * Grounded on plausible features for the resume owner (adult South-Asian male,
 * dark hair, warm tan skin, glasses). Not a photo-perfect likeness — a
 * "Ghibli portrait" interpretation.
 *
 * If /models/deepak.glb + animations.glb are dropped in, they take over.
 */
export default function Character() {
  const group = useRef<THREE.Group>(null!);
  const { progress, velocity } = useScrollProgress();
  const [gltfScene, setGltfScene] = useState<THREE.Object3D | null>(null);
  const [rpmAnims, setRpmAnims] = useState<{
    mixer: THREE.AnimationMixer;
    idle?: THREE.AnimationAction;
    walk?: THREE.AnimationAction;
    handshake?: THREE.AnimationAction;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = new GLTFLoader();
    loader.load(
      "/models/deepak.glb",
      (gltf) => {
        if (cancelled) return;
        gltf.scene.traverse((o: any) => {
          if (o.isMesh && o.material) o.material.envMapIntensity = 0.8;
        });
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const size = new THREE.Vector3();
        box.getSize(size);
        const scale = size.y > 0 ? 1.7 / size.y : 1;
        gltf.scene.scale.setScalar(scale);
        const b2 = new THREE.Box3().setFromObject(gltf.scene);
        gltf.scene.position.y -= b2.min.y;
        setGltfScene(gltf.scene);

        loader.load(
          "/models/animations.glb",
          (anim) => {
            if (cancelled) return;
            const mixer = new THREE.AnimationMixer(gltf.scene);
            const idleClip = anim.animations.find((c) => /idle/i.test(c.name));
            const walkClip = anim.animations.find((c) => /walk/i.test(c.name));
            const shakeClip = anim.animations.find((c) =>
              /(hand)?shake|greet|wave/i.test(c.name)
            );
            const idle = idleClip ? mixer.clipAction(idleClip) : undefined;
            const walk = walkClip ? mixer.clipAction(walkClip) : undefined;
            const shake = shakeClip ? mixer.clipAction(shakeClip) : undefined;
            idle?.play();
            walk?.play();
            walk?.setEffectiveWeight(0);
            idle?.setEffectiveWeight(1);
            setRpmAnims({ mixer, idle, walk, handshake: shake });
          },
          undefined,
          () => {}
        );
      },
      undefined,
      () => {}
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const rig = useMemo(() => buildGhibliRig(), []);

  useFrame((_, dt) => {
    if (!group.current) return;
    const p = progress;
    const pos = pathPosition(p);
    const tangent = pathTangent(p);
    group.current.position.lerp(pos, 0.12);

    const inHandshake = p >= 0.9;
    if (inHandshake) {
      const t = sceneProgress(p, "handshake");
      const facing = new THREE.Vector3().lerpVectors(
        tangent,
        new THREE.Vector3(0, 0, 1),
        Math.min(1, (t - 0.3) / 0.5)
      );
      const targetYaw = Math.atan2(facing.x, facing.z);
      group.current.rotation.y = dampAngle(group.current.rotation.y, targetYaw, dt, 6);
    } else {
      const targetYaw = Math.atan2(tangent.x, tangent.z);
      group.current.rotation.y = dampAngle(group.current.rotation.y, targetYaw, dt, 8);
    }

    const speed = Math.min(1, Math.abs(velocity) * 4);
    const walkWeight = smoothstep(0.05, 0.5, speed);
    rig.tick(dt, walkWeight);

    if (inHandshake) rig.setGreeting(sceneProgress(p, "handshake"));
    else rig.setGreeting(0);

    rig.lookAt(inHandshake ? 1 : 0, dt);

    if (rpmAnims) {
      rpmAnims.mixer.update(dt);
      rpmAnims.walk?.setEffectiveWeight(walkWeight);
      rpmAnims.idle?.setEffectiveWeight(1 - walkWeight);
      if (inHandshake && rpmAnims.handshake && !rpmAnims.handshake.isRunning()) {
        rpmAnims.handshake.reset().setLoop(THREE.LoopOnce, 1).play();
      }
    }
  });

  return (
    <group ref={group}>
      {gltfScene ? <primitive object={gltfScene} /> : <primitive object={rig.root} />}
    </group>
  );
}

// ---------- Path ----------
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
function pathPosition(p: number) {
  return CURVE.getPointAt(Math.min(1, Math.max(0, p)));
}
function pathTangent(p: number) {
  return CURVE.getTangentAt(Math.min(0.999, Math.max(0.001, p))).normalize();
}

// ---------- Ghibli toon gradient map ----------
function makeToonGradient(): THREE.Texture {
  // 3-step ramp: shadow / midtone / light — hard bands like cel shading
  const data = new Uint8Array([80, 80, 80, 175, 175, 175, 255, 255, 255]);
  const tex = new THREE.DataTexture(data, 3, 1, THREE.RGBFormat as any);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

// ---------- Ghibli character rig ----------
function buildGhibliRig() {
  const root = new THREE.Group();
  const gradientMap = makeToonGradient();

  // Materials — soft muted Ghibli palette
  const skin = new THREE.MeshToonMaterial({ color: "#e6b892", gradientMap });
  const skinShadow = new THREE.MeshToonMaterial({ color: "#c99872", gradientMap });
  const hair = new THREE.MeshToonMaterial({ color: "#20160e", gradientMap });
  const hairHi = new THREE.MeshToonMaterial({ color: "#3a2418", gradientMap });
  const eyeWhite = new THREE.MeshBasicMaterial({ color: "#fbf6ec" });
  const iris = new THREE.MeshBasicMaterial({ color: "#3d251a" });
  const pupil = new THREE.MeshBasicMaterial({ color: "#0d0806" });
  const shirt = new THREE.MeshToonMaterial({ color: "#8aa8c4", gradientMap });
  const shirtShadow = new THREE.MeshToonMaterial({ color: "#6285a4", gradientMap });
  const vest = new THREE.MeshToonMaterial({ color: "#5c4433", gradientMap });
  const pants = new THREE.MeshToonMaterial({ color: "#3a3226", gradientMap });
  const shoe = new THREE.MeshToonMaterial({ color: "#2a1a12", gradientMap });
  const glassRim = new THREE.MeshBasicMaterial({ color: "#1a120a" });
  const lens = new THREE.MeshBasicMaterial({
    color: "#eef3f6",
    transparent: true,
    opacity: 0.18,
  });
  const blush = new THREE.MeshBasicMaterial({
    color: "#e58c7a",
    transparent: true,
    opacity: 0.5,
  });
  const mouthMat = new THREE.MeshBasicMaterial({ color: "#7a3a2f" });
  const brow = new THREE.MeshBasicMaterial({ color: "#1a0e08" });
  const noseShadow = new THREE.MeshBasicMaterial({
    color: "#b98063",
    transparent: true,
    opacity: 0.6,
  });

  // ---- HEAD pivot ----
  const headPivot = new THREE.Group();
  headPivot.position.y = 1.42;
  root.add(headPivot);

  // Ghibli heads: slightly larger, rounder, softer chin
  const headGroup = new THREE.Group();
  headGroup.position.y = 0.32;
  headPivot.add(headGroup);

  // Cranium — slightly ovoid, rounded
  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.3, 40, 32), skin);
  cranium.scale.set(1.0, 1.05, 0.95);
  headGroup.add(cranium);

  // Soft jaw — smaller, more rounded
  const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 18), skin);
  jaw.scale.set(0.95, 0.55, 0.9);
  jaw.position.set(0, -0.16, 0.02);
  headGroup.add(jaw);

  // Ears — small, tucked
  const ear = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), skin);
  ear.scale.set(0.45, 1.0, 0.6);
  const earL = ear.clone();
  earL.position.set(-0.29, -0.01, 0);
  const earR = ear.clone();
  earR.position.set(0.29, -0.01, 0);
  headGroup.add(earL, earR);

  // Hair — layered painterly clumps
  // Back cap
  const hairBack = new THREE.Mesh(
    new THREE.SphereGeometry(0.315, 32, 24, 0, Math.PI * 2, 0, Math.PI / 1.85),
    hair
  );
  hairBack.scale.set(1.02, 1.12, 1.02);
  hairBack.position.y = 0.015;
  headGroup.add(hairBack);

  // Bangs — three overlapping tufts across the forehead
  const bangGeo = new THREE.SphereGeometry(0.11, 16, 12);
  const bang1 = new THREE.Mesh(bangGeo, hair);
  bang1.scale.set(1.4, 0.5, 0.7);
  bang1.position.set(-0.11, 0.14, 0.22);
  bang1.rotation.z = 0.35;
  const bang2 = new THREE.Mesh(bangGeo, hairHi);
  bang2.scale.set(1.6, 0.45, 0.7);
  bang2.position.set(0.02, 0.17, 0.24);
  bang2.rotation.z = -0.15;
  const bang3 = new THREE.Mesh(bangGeo, hair);
  bang3.scale.set(1.3, 0.5, 0.7);
  bang3.position.set(0.14, 0.14, 0.22);
  bang3.rotation.z = -0.35;
  headGroup.add(bang1, bang2, bang3);

  // Side hair sweeps
  const sideGeo = new THREE.SphereGeometry(0.08, 12, 10);
  const sideL = new THREE.Mesh(sideGeo, hair);
  sideL.scale.set(0.55, 1.6, 0.7);
  sideL.position.set(-0.26, 0.02, 0.06);
  const sideR = sideL.clone();
  sideR.position.x = 0.26;
  headGroup.add(sideL, sideR);

  // Slight side-part tuft (Ghibli signature — one strand catches light)
  const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), hairHi);
  tuft.scale.set(1.6, 0.5, 0.5);
  tuft.position.set(-0.05, 0.22, 0.19);
  tuft.rotation.z = 0.6;
  headGroup.add(tuft);

  // Thin painted brows
  const browGeo = new THREE.BoxGeometry(0.085, 0.014, 0.02);
  const browL = new THREE.Mesh(browGeo, brow);
  browL.position.set(-0.095, 0.075, 0.255);
  browL.rotation.z = 0.06;
  const browR = new THREE.Mesh(browGeo, brow);
  browR.position.set(0.095, 0.075, 0.255);
  browR.rotation.z = -0.06;
  headGroup.add(browL, browR);

  // ---- Eyes — big almond Ghibli eyes ----
  // Each eye = sclera oval + big iris + pupil + TWO white highlights
  const makeGhibliEye = (side: 1 | -1) => {
    const g = new THREE.Group();
    // Sclera — flattened sphere
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.056, 24, 18), eyeWhite);
    sclera.scale.set(1.0, 0.85, 0.55);
    g.add(sclera);
    // Iris — LARGE, dominant
    const ir = new THREE.Mesh(new THREE.SphereGeometry(0.04, 20, 16), iris);
    ir.scale.set(1.0, 1.05, 0.4);
    ir.position.set(0, -0.005, 0.032);
    g.add(ir);
    // Pupil
    const pu = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 10), pupil);
    pu.scale.set(1, 1.1, 0.4);
    pu.position.set(0, -0.005, 0.045);
    g.add(pu);
    // Two Ghibli highlights
    const hl1 = new THREE.Mesh(
      new THREE.SphereGeometry(0.011, 10, 8),
      new THREE.MeshBasicMaterial({ color: "#ffffff" })
    );
    hl1.position.set(-0.014, 0.013, 0.05);
    g.add(hl1);
    const hl2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.006, 8, 8),
      new THREE.MeshBasicMaterial({ color: "#ffffff" })
    );
    hl2.position.set(0.012, -0.014, 0.05);
    g.add(hl2);
    // Upper lid line — thin dark strip
    const lid = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.008, 0.004),
      new THREE.MeshBasicMaterial({ color: "#150a06" })
    );
    lid.position.set(0, 0.043, 0.05);
    lid.rotation.z = side * 0.05;
    g.add(lid);
    g.position.set(side * 0.09, 0.028, 0.235);
    return { group: g };
  };
  const eyeL = makeGhibliEye(-1);
  const eyeR = makeGhibliEye(1);
  headGroup.add(eyeL.group, eyeR.group);

  // ---- Glasses ----
  const rimGeo = new THREE.TorusGeometry(0.075, 0.008, 12, 24);
  const rimL = new THREE.Mesh(rimGeo, glassRim);
  rimL.position.set(-0.09, 0.028, 0.26);
  const rimR = new THREE.Mesh(rimGeo, glassRim);
  rimR.position.set(0.09, 0.028, 0.26);
  const bridge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.005, 0.005, 0.04, 10),
    glassRim
  );
  bridge.rotation.z = Math.PI / 2;
  bridge.position.set(0, 0.028, 0.26);
  const templeL = new THREE.Mesh(
    new THREE.CylinderGeometry(0.004, 0.004, 0.13, 8),
    glassRim
  );
  templeL.rotation.z = Math.PI / 2;
  templeL.rotation.y = -0.15;
  templeL.position.set(-0.23, 0.028, 0.17);
  const templeR = templeL.clone();
  templeR.rotation.y = 0.15;
  templeR.position.set(0.23, 0.028, 0.17);
  const lensL = new THREE.Mesh(new THREE.CircleGeometry(0.07, 24), lens);
  lensL.position.set(-0.09, 0.028, 0.264);
  const lensR = new THREE.Mesh(new THREE.CircleGeometry(0.07, 24), lens);
  lensR.position.set(0.09, 0.028, 0.264);
  headGroup.add(rimL, rimR, bridge, templeL, templeR, lensL, lensR);

  // Nose — Ghibli style: barely a bump + a small shadow line
  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), skinShadow);
  noseTip.position.set(0, -0.04, 0.28);
  headGroup.add(noseTip);
  const noseLine = new THREE.Mesh(
    new THREE.PlaneGeometry(0.008, 0.06),
    noseShadow
  );
  noseLine.position.set(0.012, -0.015, 0.276);
  headGroup.add(noseLine);

  // Mouth — soft small smile line
  const mouthShape = new THREE.Mesh(
    new THREE.TorusGeometry(0.045, 0.006, 6, 16, Math.PI * 0.75),
    mouthMat
  );
  mouthShape.rotation.z = Math.PI + 0.3;
  mouthShape.rotation.x = 0.1;
  mouthShape.position.set(0, -0.14, 0.245);
  headGroup.add(mouthShape);

  // Blush circles — Ghibli signature
  const blushL = new THREE.Mesh(new THREE.CircleGeometry(0.035, 20), blush);
  blushL.position.set(-0.14, -0.05, 0.255);
  const blushR = blushL.clone();
  blushR.position.x = 0.14;
  headGroup.add(blushL, blushR);

  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.088, 0.13, 16), skin);
  neck.position.y = 1.36;
  root.add(neck);

  // ---- Torso — soft chambray shirt over vest ----
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.55, 0.32), shirt);
  chest.position.y = 1.05;
  // Round shoulders a touch
  root.add(chest);
  // Vest opening down the middle
  const vestPanel = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.55, 0.02), vest);
  vestPanel.position.set(0, 1.05, 0.171);
  root.add(vestPanel);
  // Buttons
  for (let i = 0; i < 4; i++) {
    const btn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.008, 10),
      new THREE.MeshBasicMaterial({ color: "#c9a15a" })
    );
    btn.rotation.x = Math.PI / 2;
    btn.position.set(0, 1.22 - i * 0.13, 0.185);
    root.add(btn);
  }
  // Collar (soft, open)
  const collarL = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.02), shirt);
  collarL.position.set(-0.09, 1.32, 0.16);
  collarL.rotation.z = 0.5;
  const collarR = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.02), shirt);
  collarR.position.set(0.09, 1.32, 0.16);
  collarR.rotation.z = -0.5;
  root.add(collarL, collarR);
  // Waist
  const waist = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.2, 0.29), shirt);
  waist.position.y = 0.73;
  root.add(waist);
  // Shirt shadow band on left side (cel-shading suggestion)
  const shadowBand = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.55, 0.32), shirtShadow);
  shadowBand.position.set(-0.28, 1.05, 0);
  root.add(shadowBand);

  // ---- Legs ----
  const legL = new THREE.Group();
  legL.position.set(-0.13, 0.6, 0);
  const thighL = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.35, 14), pants);
  thighL.position.y = -0.175;
  const shinL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.075, 0.35, 14), pants);
  shinL.position.y = -0.525;
  const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.08, 0.3), shoe);
  shoeL.position.set(0, -0.74, 0.06);
  const shoeCapL = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 12), shoe);
  shoeCapL.scale.set(1, 0.6, 1.4);
  shoeCapL.position.set(0, -0.74, 0.16);
  legL.add(thighL, shinL, shoeL, shoeCapL);
  root.add(legL);

  const legR = new THREE.Group();
  legR.position.set(0.13, 0.6, 0);
  const thighR = thighL.clone();
  const shinR = shinL.clone();
  const shoeR = shoeL.clone();
  const shoeCapR = shoeCapL.clone();
  legR.add(thighR, shinR, shoeR, shoeCapR);
  root.add(legR);

  // ---- Arms ----
  const armL = new THREE.Group();
  armL.position.set(-0.33, 1.28, 0);
  const upperArmL = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.075, 0.32, 14),
    shirt
  );
  upperArmL.position.y = -0.16;
  const foreArmL = new THREE.Mesh(
    new THREE.CylinderGeometry(0.072, 0.058, 0.3, 14),
    shirt
  );
  foreArmL.position.y = -0.47;
  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 12), skin);
  handL.scale.set(0.9, 1.1, 0.7);
  handL.position.y = -0.65;
  armL.add(upperArmL, foreArmL, handL);
  root.add(armL);

  const armR = new THREE.Group();
  armR.position.set(0.33, 1.28, 0);
  const upperArmR = upperArmL.clone();
  const foreArmR = foreArmL.clone();
  const handR = handL.clone();
  armR.add(upperArmR, foreArmR, handR);
  root.add(armR);

  // Shadow blob
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.36, 24),
    new THREE.MeshBasicMaterial({ color: "#000", transparent: true, opacity: 0.28 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.005;
  root.add(shadow);

  // ---- Anim state ----
  let t = 0;
  let blink = 0;
  let blinkTimer = 3 + Math.random() * 2;
  let greeting = 0;
  let lookAmount = 0;

  return {
    root,
    tick(dt: number, w: number) {
      t += dt * (2.2 + w * 4.4);

      const c = Math.sin(t);
      const c2 = Math.sin(t + Math.PI);
      const amp = 0.6 * w;
      legL.rotation.x = c * amp;
      legR.rotation.x = c2 * amp;
      shinL.rotation.x = Math.max(0, -c) * 0.6 * w;
      shinR.rotation.x = Math.max(0, -c2) * 0.6 * w;
      armL.rotation.x = c2 * amp * 0.85;
      armR.rotation.x = c * amp * 0.85;
      foreArmL.rotation.x = Math.max(0, c) * 0.5 * w;
      foreArmR.rotation.x = Math.max(0, c2) * 0.5 * w;

      root.position.y = Math.abs(Math.sin(t * 2)) * 0.03 * w;
      chest.rotation.y = c * 0.05 * w;
      // Head bob — gentle Ghibli
      headPivot.rotation.z = Math.sin(t * 0.5) * 0.02 * (1 - w);

      // Blink
      blinkTimer -= dt;
      if (blinkTimer <= 0) {
        blink = 1;
        blinkTimer = 3 + Math.random() * 3;
      }
      if (blink > 0) blink = Math.max(0, blink - dt * 8);
      const eyeScale = 1 - blink * 0.95;
      eyeL.group.scale.y = eyeScale;
      eyeR.group.scale.y = eyeScale;

      // Wave / greet
      if (greeting > 0.4) {
        const g = smoothstep(0.4, 1, greeting);
        armR.rotation.x = THREE.MathUtils.lerp(armR.rotation.x, -1.4, g);
        armR.rotation.z = THREE.MathUtils.lerp(armR.rotation.z, -0.5, g);
        foreArmR.rotation.x = THREE.MathUtils.lerp(foreArmR.rotation.x, -0.4, g);
        armR.rotation.z += Math.sin(t * 4.5) * 0.28 * g;
      }
    },
    setGreeting(g: number) {
      greeting = g;
    },
    lookAt(camera01: number, dt: number) {
      lookAmount = THREE.MathUtils.lerp(lookAmount, camera01, Math.min(1, dt * 3));
      const targetYaw = camera01 * 0.18;
      headPivot.rotation.y = THREE.MathUtils.lerp(headPivot.rotation.y, targetYaw, 0.15);
    },
  };
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
function dampAngle(current: number, target: number, dt: number, speed: number) {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * Math.min(1, dt * speed);
}
