"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useScrollProgress, sceneProgress } from "@/lib/useScrollProgress";

/**
 * Cartoon-style rigged character. Pixar-ish proportions (~4.5 heads tall),
 * warm skin, proper face features (eyes with pupils, brows, mouth, ears),
 * business-casual attire. Walks along a spline as the user scrolls,
 * blends idle/walk by scroll velocity, and greets the camera at the end.
 *
 * If /models/deepak.glb + animations.glb are present, they are loaded on top
 * of the same scroll logic (drop-in replacement — the site works without them).
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

  // Optional GLB avatar loader (silent fallback if missing)
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

  const rig = useMemo(() => buildCartoonRig(), []);

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

    // Walk vs idle blend
    const speed = Math.min(1, Math.abs(velocity) * 4);
    const walkWeight = smoothstep(0.05, 0.5, speed);
    rig.tick(dt, walkWeight);

    // Handshake / wave
    if (inHandshake) {
      rig.setGreeting(sceneProgress(p, "handshake"));
    } else {
      rig.setGreeting(0);
    }

    // Look toward camera during handshake, along path otherwise
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

// ---------- Path along the 7 scenes ----------
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

// ---------- Cartoon character rig ----------
// Proportions (heights, in world units, cumulative from ground):
//   feet 0.0 · knees 0.42 · hip 0.82 · chest 1.15 · neck 1.42 · chin 1.5
//   head-center 1.72 · top of head 1.98 · hair peak 2.05
//
// Ratio: body ~1.5m, head ~0.48m => head-to-body ~4.5 heads. Slightly stylised
// but not chibi — feels adult/professional while remaining a "character".

function buildCartoonRig() {
  const root = new THREE.Group();

  // ---- Materials ----
  const skin = new THREE.MeshStandardMaterial({
    color: "#d5a17e",
    roughness: 0.62,
    metalness: 0.02,
  });
  const skinDark = new THREE.MeshStandardMaterial({
    color: "#b98363",
    roughness: 0.6,
  });
  const hair = new THREE.MeshStandardMaterial({
    color: "#1a120c",
    roughness: 0.5,
    metalness: 0.05,
  });
  const eyeWhite = new THREE.MeshStandardMaterial({
    color: "#f8f5ef",
    roughness: 0.4,
    emissive: "#ffffff",
    emissiveIntensity: 0.05,
  });
  const iris = new THREE.MeshStandardMaterial({
    color: "#3b2818",
    roughness: 0.35,
  });
  const pupil = new THREE.MeshBasicMaterial({ color: "#0a0705" });
  const mouth = new THREE.MeshStandardMaterial({
    color: "#8f3a3a",
    roughness: 0.5,
  });
  const shirt = new THREE.MeshStandardMaterial({
    color: "#f4f6fb",
    roughness: 0.65,
  });
  const jacket = new THREE.MeshStandardMaterial({
    color: "#2d3f5f",
    roughness: 0.55,
    metalness: 0.08,
  });
  const pants = new THREE.MeshStandardMaterial({
    color: "#1e2a40",
    roughness: 0.55,
  });
  const shoe = new THREE.MeshStandardMaterial({
    color: "#241812",
    roughness: 0.4,
    metalness: 0.1,
  });
  const glassRim = new THREE.MeshStandardMaterial({
    color: "#1a1a1a",
    metalness: 0.85,
    roughness: 0.25,
  });
  const glassLens = new THREE.MeshPhysicalMaterial({
    color: "#ffffff",
    transparent: true,
    opacity: 0.18,
    roughness: 0.05,
    transmission: 0.85,
    thickness: 0.02,
  });
  const beltMat = new THREE.MeshStandardMaterial({
    color: "#1a120c",
    roughness: 0.5,
    metalness: 0.25,
  });
  const buckle = new THREE.MeshStandardMaterial({
    color: "#d4a24c",
    metalness: 0.9,
    roughness: 0.25,
  });

  // ---- HEAD (with pivot for turning/looking) ----
  const headPivot = new THREE.Group();
  headPivot.position.y = 1.42; // neck join
  root.add(headPivot);

  const headGroup = new THREE.Group();
  headGroup.position.y = 0.3; // head sits above pivot
  headPivot.add(headGroup);

  // Cranium (slightly egg-shaped)
  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.26, 32, 24), skin);
  cranium.scale.set(1.0, 1.08, 0.95);
  headGroup.add(cranium);

  // Jaw (subtle wider base)
  const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.19, 24, 16), skin);
  jaw.scale.set(1.0, 0.55, 0.9);
  jaw.position.set(0, -0.14, 0.03);
  headGroup.add(jaw);

  // Ears
  const ear = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), skin);
  ear.scale.set(0.5, 1, 0.7);
  const earL = ear.clone();
  earL.position.set(-0.26, 0.0, 0);
  const earR = ear.clone();
  earR.position.set(0.26, 0.0, 0);
  headGroup.add(earL, earR);

  // Hair cap
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.275, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2.05),
    hair
  );
  hairCap.scale.set(1.02, 1.15, 1.0);
  hairCap.position.y = 0.02;
  headGroup.add(hairCap);

  // Front hair swoop
  const swoop = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), hair);
  swoop.scale.set(1.6, 0.35, 0.6);
  swoop.position.set(0.05, 0.16, 0.22);
  swoop.rotation.z = -0.35;
  headGroup.add(swoop);

  // Sideburns
  const sideburnL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), hair);
  sideburnL.scale.set(0.5, 1.4, 0.5);
  sideburnL.position.set(-0.22, -0.02, 0.05);
  const sideburnR = sideburnL.clone();
  sideburnR.position.x = 0.22;
  headGroup.add(sideburnL, sideburnR);

  // Eyebrows
  const browGeo = new THREE.BoxGeometry(0.09, 0.018, 0.03);
  const browL = new THREE.Mesh(browGeo, hair);
  browL.position.set(-0.09, 0.075, 0.225);
  browL.rotation.z = 0.08;
  const browR = new THREE.Mesh(browGeo, hair);
  browR.position.set(0.09, 0.075, 0.225);
  browR.rotation.z = -0.08;
  headGroup.add(browL, browR);

  // Eyes — sclera, iris, pupil, highlight
  const eyeOffset = new THREE.Vector3(0.088, 0.03, 0.215);
  const makeEye = (side: 1 | -1) => {
    const g = new THREE.Group();
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.045, 20, 16), eyeWhite);
    g.add(sclera);
    const ir = new THREE.Mesh(new THREE.SphereGeometry(0.024, 16, 12), iris);
    ir.position.set(0, 0, 0.028);
    g.add(ir);
    const pu = new THREE.Mesh(new THREE.SphereGeometry(0.011, 12, 10), pupil);
    pu.position.set(0, 0, 0.042);
    g.add(pu);
    const hl = new THREE.Mesh(
      new THREE.SphereGeometry(0.006, 8, 8),
      new THREE.MeshBasicMaterial({ color: "#ffffff" })
    );
    hl.position.set(0.008, 0.008, 0.048);
    g.add(hl);
    g.position.set(side * eyeOffset.x, eyeOffset.y, eyeOffset.z);
    return { group: g, iris: ir, pupil: pu, highlight: hl };
  };
  const eyeL = makeEye(-1);
  const eyeR = makeEye(1);
  headGroup.add(eyeL.group, eyeR.group);

  // Glasses
  const rimGeo = new THREE.TorusGeometry(0.07, 0.009, 12, 24);
  const rimL = new THREE.Mesh(rimGeo, glassRim);
  rimL.position.set(-0.088, 0.03, 0.24);
  const rimR = new THREE.Mesh(rimGeo, glassRim);
  rimR.position.set(0.088, 0.03, 0.24);
  const bridge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.006, 0.006, 0.045, 10),
    glassRim
  );
  bridge.rotation.z = Math.PI / 2;
  bridge.position.set(0, 0.03, 0.24);
  const templeL = new THREE.Mesh(
    new THREE.CylinderGeometry(0.005, 0.005, 0.12, 8),
    glassRim
  );
  templeL.rotation.z = Math.PI / 2;
  templeL.rotation.y = -0.15;
  templeL.position.set(-0.22, 0.03, 0.16);
  const templeR = templeL.clone();
  templeR.rotation.y = 0.15;
  templeR.position.set(0.22, 0.03, 0.16);
  // Lens fills
  const lensGeo = new THREE.CircleGeometry(0.065, 24);
  const lensL = new THREE.Mesh(lensGeo, glassLens);
  lensL.position.set(-0.088, 0.03, 0.245);
  const lensR = new THREE.Mesh(lensGeo, glassLens);
  lensR.position.set(0.088, 0.03, 0.245);
  headGroup.add(rimL, rimR, bridge, templeL, templeR, lensL, lensR);

  // Nose
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), skinDark);
  nose.scale.set(0.85, 1.3, 1.2);
  nose.position.set(0, -0.03, 0.245);
  headGroup.add(nose);

  // Mouth (subtle smile — capsule slightly curved)
  const mouthShape = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.018, 0.06, 6, 12),
    mouth
  );
  mouthShape.rotation.z = Math.PI / 2;
  mouthShape.position.set(0, -0.13, 0.22);
  headGroup.add(mouthShape);
  // Smile lift — small dots at corners
  const cornerL = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 8), mouth);
  cornerL.position.set(-0.045, -0.115, 0.218);
  const cornerR = cornerL.clone();
  cornerR.position.x = 0.045;
  headGroup.add(cornerL, cornerR);

  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.12, 16), skin);
  neck.position.y = 1.36;
  root.add(neck);

  // ---- TORSO / JACKET ----
  // Chest
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.55, 0.34), jacket);
  chest.position.y = 1.05;
  root.add(chest);
  // Slight taper — waist
  const waist = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.22, 0.3), jacket);
  waist.position.y = 0.72;
  root.add(waist);
  // Shirt V
  const shirtPanel = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.55, 0.02), shirt);
  shirtPanel.position.set(0, 1.06, 0.181);
  root.add(shirtPanel);
  // Collar
  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.14), shirt);
  collar.position.set(0, 1.32, 0.13);
  root.add(collar);
  // Jacket lapels
  const lapelL = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.5, 0.03), jacket);
  lapelL.position.set(-0.11, 1.07, 0.181);
  lapelL.rotation.z = 0.15;
  const lapelR = lapelL.clone();
  lapelR.position.x = 0.11;
  lapelR.rotation.z = -0.15;
  root.add(lapelL, lapelR);

  // Belt
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.06, 0.31), beltMat);
  belt.position.y = 0.6;
  root.add(belt);
  const buckleMesh = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.055, 0.02), buckle);
  buckleMesh.position.set(0, 0.6, 0.16);
  root.add(buckleMesh);

  // ---- LEGS (pivot groups for swing) ----
  const legL = new THREE.Group();
  legL.position.set(-0.13, 0.6, 0);
  const thighL = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.35, 16), pants);
  thighL.position.y = -0.175;
  const shinL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.075, 0.35, 16), pants);
  shinL.position.y = -0.525;
  const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.08, 0.32), shoe);
  shoeL.position.set(0, -0.74, 0.06);
  // Rounded shoe cap
  const shoeCapL = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 12), shoe);
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

  // ---- ARMS ----
  const armL = new THREE.Group();
  armL.position.set(-0.34, 1.28, 0);
  const upperArmL = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.075, 0.32, 16),
    jacket
  );
  upperArmL.position.y = -0.16;
  const foreArmL = new THREE.Mesh(
    new THREE.CylinderGeometry(0.072, 0.06, 0.3, 16),
    jacket
  );
  foreArmL.position.y = -0.47;
  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), skin);
  handL.scale.set(0.9, 1.1, 0.7);
  handL.position.y = -0.65;
  armL.add(upperArmL, foreArmL, handL);
  root.add(armL);

  const armR = new THREE.Group();
  armR.position.set(0.34, 1.28, 0);
  const upperArmR = upperArmL.clone();
  const foreArmR = foreArmL.clone();
  const handR = handL.clone();
  armR.add(upperArmR, foreArmR, handR);
  root.add(armR);

  // ---- Shadow blob ----
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.35, 24),
    new THREE.MeshBasicMaterial({ color: "#000", transparent: true, opacity: 0.28 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.005;
  root.add(shadow);

  // ---- State ----
  let t = 0;
  let blink = 0;
  let blinkTimer = 3 + Math.random() * 2;
  let greeting = 0;
  let lookAmount = 0; // 0 = along path, 1 = at camera

  return {
    root,
    tick(dt: number, w: number) {
      t += dt * (2.2 + w * 4.4);

      // Walk cycle — hips + legs + arms
      const c = Math.sin(t);
      const c2 = Math.sin(t + Math.PI);
      const amp = 0.62 * w;
      legL.rotation.x = c * amp;
      legR.rotation.x = c2 * amp;
      // Knee bend (approximate — bend on the return stroke)
      const kneeL = Math.max(0, -c) * 0.6 * w;
      const kneeR = Math.max(0, -c2) * 0.6 * w;
      shinL.rotation.x = kneeL;
      shinR.rotation.x = kneeR;

      // Arms opposite to legs
      armL.rotation.x = c2 * amp * 0.85;
      armR.rotation.x = c * amp * 0.85;
      // Elbow bend
      foreArmL.rotation.x = Math.max(0, c) * 0.5 * w;
      foreArmR.rotation.x = Math.max(0, c2) * 0.5 * w;

      // Body bob + slight torso twist
      root.position.y = Math.abs(Math.sin(t * 2)) * 0.03 * w;
      chest.rotation.y = c * 0.05 * w;
      headPivot.rotation.y = -c * 0.03 * w + THREE.MathUtils.lerp(0, 0, 0);
      // Subtle idle sway when not walking
      headPivot.rotation.z = Math.sin(t * 0.5) * 0.02 * (1 - w);

      // Blinking
      blinkTimer -= dt;
      if (blinkTimer <= 0) {
        blink = 1;
        blinkTimer = 3 + Math.random() * 3;
      }
      if (blink > 0) blink = Math.max(0, blink - dt * 8);
      const eyeScale = 1 - blink * 0.95;
      eyeL.group.scale.y = eyeScale;
      eyeR.group.scale.y = eyeScale;

      // Greeting / wave — right arm raises + waves
      if (greeting > 0.4) {
        const g = smoothstep(0.4, 1, greeting);
        // Raise
        armR.rotation.x = THREE.MathUtils.lerp(armR.rotation.x, -1.4, g);
        armR.rotation.z = THREE.MathUtils.lerp(armR.rotation.z, -0.5, g);
        foreArmR.rotation.x = THREE.MathUtils.lerp(foreArmR.rotation.x, -0.4, g);
        // Wave motion
        armR.rotation.z += Math.sin(t * 4.5) * 0.28 * g;
        // Mouth grows a bit — greet smile
        mouthShape.scale.z = 1 + 0.4 * g;
      } else {
        mouthShape.scale.z = 1;
      }
    },
    setGreeting(g: number) {
      greeting = g;
    },
    lookAt(camera01: number, dt: number) {
      lookAmount = THREE.MathUtils.lerp(lookAmount, camera01, Math.min(1, dt * 3));
      // Turn head slightly toward camera during greeting
      const targetYaw = camera01 * 0.15;
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
