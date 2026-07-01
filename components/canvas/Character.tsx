"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useScrollProgress, sceneProgress } from "@/lib/useScrollProgress";

/**
 * Studio-Ghibli-styled Indian male character.
 *
 * Design brief:
 *  - Indian male, warm tan skin, dark hair, well-groomed short beard
 *  - Business casual: rolled-sleeve shirt, chinos
 *  - Smooth organic geometry: capsules/ellipsoids/lathed forms only.
 *    NO axis-aligned boxes on the body — that's what made him look wooden.
 *  - Cel-shaded via MeshToonMaterial + 3-band gradient for Ghibli look.
 *
 * Grounded on the resume owner (adult Indian male ~40s, glasses).
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
        const scale = size.y > 0 ? 1.75 / size.y : 1;
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

  const rig = useMemo(() => buildGhibliIndianMale(), []);

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

// ---------- Toon gradient ----------
function makeToonGradient(): THREE.Texture {
  const data = new Uint8Array([120, 120, 120, 200, 200, 200, 255, 255, 255]);
  const tex = new THREE.DataTexture(data, 3, 1);
  tex.format = THREE.RGBAFormat as any;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

// ---------- Helper: lathed tapered limb (like a bowling pin) ----------
function tapered(topR: number, midR: number, botR: number, height: number, seg = 20) {
  const pts: THREE.Vector2[] = [];
  const N = 12;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    // Two-piece taper: top→mid→bot
    let r: number;
    if (t < 0.5) r = THREE.MathUtils.lerp(topR, midR, t * 2);
    else r = THREE.MathUtils.lerp(midR, botR, (t - 0.5) * 2);
    pts.push(new THREE.Vector2(Math.max(0.001, r), t * height));
  }
  return new THREE.LatheGeometry(pts, seg);
}

// ---------- Helper: shirt torso — barrel with shoulder taper ----------
function torsoGeometry(shoulderW: number, chestR: number, waistR: number, height: number) {
  const pts: THREE.Vector2[] = [];
  const N = 14;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    // Bottom (waist) → mid (chest) → top (shoulders)
    let r: number;
    if (t < 0.15) r = THREE.MathUtils.lerp(waistR * 0.9, waistR, t / 0.15);
    else if (t < 0.55) r = THREE.MathUtils.lerp(waistR, chestR, (t - 0.15) / 0.4);
    else if (t < 0.9) r = THREE.MathUtils.lerp(chestR, shoulderW, (t - 0.55) / 0.35);
    else r = THREE.MathUtils.lerp(shoulderW, shoulderW * 0.85, (t - 0.9) / 0.1);
    pts.push(new THREE.Vector2(Math.max(0.005, r), t * height));
  }
  return new THREE.LatheGeometry(pts, 24);
}

// ---------- BUILD ----------
function buildGhibliIndianMale() {
  const root = new THREE.Group();
  const gradientMap = makeToonGradient();

  // ---- Materials (warm tan Indian skin tones) ----
  const skin = new THREE.MeshToonMaterial({ color: "#c68e63", gradientMap });
  const skinLit = new THREE.MeshToonMaterial({ color: "#d9a67e", gradientMap });
  const hair = new THREE.MeshToonMaterial({ color: "#1a0e08", gradientMap });
  const hairHi = new THREE.MeshToonMaterial({ color: "#331e12", gradientMap });
  const beard = new THREE.MeshToonMaterial({ color: "#1e120a", gradientMap });
  const eyeWhite = new THREE.MeshBasicMaterial({ color: "#f5efe2" });
  const iris = new THREE.MeshBasicMaterial({ color: "#4a2a15" });
  const pupil = new THREE.MeshBasicMaterial({ color: "#0a0503" });

  const shirt = new THREE.MeshToonMaterial({ color: "#e8dcc3", gradientMap }); // linen cream
  const shirtShade = new THREE.MeshToonMaterial({ color: "#b8a687", gradientMap });
  const pants = new THREE.MeshToonMaterial({ color: "#4a3a2a", gradientMap }); // chinos
  const belt = new THREE.MeshToonMaterial({ color: "#2a1a10", gradientMap });
  const buckle = new THREE.MeshBasicMaterial({ color: "#c9a15a" });
  const shoe = new THREE.MeshToonMaterial({ color: "#2a1a12", gradientMap });
  const glassRim = new THREE.MeshBasicMaterial({ color: "#151008" });
  const lens = new THREE.MeshBasicMaterial({
    color: "#eef3f6",
    transparent: true,
    opacity: 0.18,
  });
  const blush = new THREE.MeshBasicMaterial({
    color: "#cf7a5a",
    transparent: true,
    opacity: 0.35,
  });
  const mouthMat = new THREE.MeshBasicMaterial({ color: "#5a2822" });
  const browMat = new THREE.MeshBasicMaterial({ color: "#120806" });

  // =====================================================================
  // HEAD (pivot at neck join, head sits above)
  // =====================================================================
  const headPivot = new THREE.Group();
  headPivot.position.y = 1.5;
  root.add(headPivot);

  const headGroup = new THREE.Group();
  headGroup.position.y = 0.32;
  headPivot.add(headGroup);

  // Cranium — smooth egg (denser sphere = smooth silhouette)
  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.3, 48, 40), skin);
  cranium.scale.set(1.0, 1.08, 0.95);
  headGroup.add(cranium);

  // Rounded jaw (Indian face: slightly angular but softened by beard)
  const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.24, 32, 24), skin);
  jaw.scale.set(0.93, 0.7, 0.9);
  jaw.position.set(0, -0.16, 0.015);
  headGroup.add(jaw);

  // Cheeks — small ellipsoids adding fullness
  const cheekL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 16), skinLit);
  cheekL.scale.set(1.1, 0.7, 0.7);
  cheekL.position.set(-0.16, -0.06, 0.19);
  const cheekR = cheekL.clone();
  cheekR.position.x = 0.16;
  headGroup.add(cheekL, cheekR);

  // Ears — soft capsules
  const earGeo = new THREE.CapsuleGeometry(0.045, 0.06, 8, 12);
  const earL = new THREE.Mesh(earGeo, skin);
  earL.rotation.z = 0.1;
  earL.scale.set(0.85, 1, 0.55);
  earL.position.set(-0.29, -0.02, 0);
  const earR = new THREE.Mesh(earGeo, skin);
  earR.rotation.z = -0.1;
  earR.scale.set(0.85, 1, 0.55);
  earR.position.set(0.29, -0.02, 0);
  headGroup.add(earL, earR);

  // Ear inner shadow
  const earInnerL = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 10), skinShadow());
  earInnerL.scale.set(0.7, 1.2, 0.3);
  earInnerL.position.set(-0.285, -0.02, 0.015);
  const earInnerR = earInnerL.clone();
  earInnerR.position.x = 0.285;
  headGroup.add(earInnerL, earInnerR);

  function skinShadow() {
    return new THREE.MeshBasicMaterial({
      color: "#8a5a3a",
      transparent: true,
      opacity: 0.6,
    });
  }

  // -------- HAIR (short, slightly wavy, Indian style) --------
  // Base cap — cover top and back of cranium, leave forehead
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.315, 40, 32, 0, Math.PI * 2, 0, Math.PI / 1.9),
    hair
  );
  hairCap.scale.set(1.03, 1.13, 1.02);
  hairCap.position.y = 0.02;
  headGroup.add(hairCap);

  // Painterly hair clumps on top (adds volume + Ghibli irregularity)
  const clumpPositions = [
    { x: -0.15, y: 0.24, z: 0.05, s: [1.4, 0.5, 0.9] as const, r: 0.3 },
    { x: 0.0, y: 0.28, z: 0.02, s: [1.6, 0.55, 0.9] as const, r: 0 },
    { x: 0.15, y: 0.24, z: 0.05, s: [1.4, 0.5, 0.9] as const, r: -0.3 },
    { x: -0.2, y: 0.19, z: 0.15, s: [1.2, 0.5, 0.9] as const, r: 0.5 },
    { x: 0.2, y: 0.19, z: 0.15, s: [1.2, 0.5, 0.9] as const, r: -0.5 },
  ];
  for (const c of clumpPositions) {
    const clump = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 16), hair);
    clump.scale.set(c.s[0], c.s[1], c.s[2]);
    clump.position.set(c.x, c.y, c.z);
    clump.rotation.z = c.r;
    headGroup.add(clump);
  }

  // Front fringe — a couple of forward-falling tufts (Ghibli signature)
  const fringe1 = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 16), hairHi);
  fringe1.scale.set(1.4, 0.5, 0.65);
  fringe1.position.set(-0.05, 0.19, 0.22);
  fringe1.rotation.z = 0.35;
  headGroup.add(fringe1);
  const fringe2 = new THREE.Mesh(new THREE.SphereGeometry(0.08, 20, 16), hair);
  fringe2.scale.set(1.3, 0.45, 0.6);
  fringe2.position.set(0.08, 0.2, 0.23);
  fringe2.rotation.z = -0.35;
  headGroup.add(fringe2);

  // Sideburns — narrow strips coming down in front of ears
  const sideburnGeo = new THREE.CapsuleGeometry(0.025, 0.09, 6, 10);
  const sideburnL = new THREE.Mesh(sideburnGeo, hair);
  sideburnL.scale.set(0.8, 1, 0.6);
  sideburnL.position.set(-0.245, -0.02, 0.05);
  const sideburnR = sideburnL.clone();
  sideburnR.position.x = 0.245;
  headGroup.add(sideburnL, sideburnR);

  // -------- BEARD (short well-groomed) --------
  // Chin strap — arc of small spheres along jawline
  const beardPositions = [
    // Chin
    { x: 0, y: -0.24, z: 0.14, s: [1.2, 0.65, 0.8] as const },
    { x: -0.05, y: -0.24, z: 0.13, s: [1.0, 0.6, 0.7] as const },
    { x: 0.05, y: -0.24, z: 0.13, s: [1.0, 0.6, 0.7] as const },
    // Along jawline down to ears
    { x: -0.12, y: -0.22, z: 0.11, s: [1.0, 0.6, 0.7] as const },
    { x: 0.12, y: -0.22, z: 0.11, s: [1.0, 0.6, 0.7] as const },
    { x: -0.18, y: -0.19, z: 0.08, s: [1.0, 0.6, 0.7] as const },
    { x: 0.18, y: -0.19, z: 0.08, s: [1.0, 0.6, 0.7] as const },
    { x: -0.22, y: -0.14, z: 0.04, s: [0.9, 0.7, 0.7] as const },
    { x: 0.22, y: -0.14, z: 0.04, s: [0.9, 0.7, 0.7] as const },
    { x: -0.24, y: -0.08, z: 0.01, s: [0.8, 0.7, 0.6] as const },
    { x: 0.24, y: -0.08, z: 0.01, s: [0.8, 0.7, 0.6] as const },
  ];
  for (const b of beardPositions) {
    const bm = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), beard);
    bm.scale.set(b.s[0], b.s[1], b.s[2]);
    bm.position.set(b.x, b.y, b.z);
    headGroup.add(bm);
  }

  // Moustache — thin curved strip below nose
  const moustacheL = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.05, 6, 10), beard);
  moustacheL.rotation.z = Math.PI / 2;
  moustacheL.rotation.y = 0.3;
  moustacheL.position.set(-0.035, -0.09, 0.25);
  const moustacheR = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.05, 6, 10), beard);
  moustacheR.rotation.z = Math.PI / 2;
  moustacheR.rotation.y = -0.3;
  moustacheR.position.set(0.035, -0.09, 0.25);
  headGroup.add(moustacheL, moustacheR);

  // Soul patch under lower lip (small)
  const soulPatch = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 10), beard);
  soulPatch.scale.set(1, 0.7, 0.6);
  soulPatch.position.set(0, -0.175, 0.245);
  headGroup.add(soulPatch);

  // -------- BROWS --------
  const browGeo = new THREE.CapsuleGeometry(0.011, 0.075, 6, 10);
  const browL = new THREE.Mesh(browGeo, browMat);
  browL.rotation.z = Math.PI / 2 + 0.08;
  browL.position.set(-0.095, 0.075, 0.255);
  browL.scale.set(1, 1, 0.5);
  const browR = new THREE.Mesh(browGeo, browMat);
  browR.rotation.z = Math.PI / 2 - 0.08;
  browR.position.set(0.095, 0.075, 0.255);
  browR.scale.set(1, 1, 0.5);
  headGroup.add(browL, browR);

  // -------- EYES (Ghibli almond) --------
  const makeEye = (side: 1 | -1) => {
    const g = new THREE.Group();
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.05, 24, 18), eyeWhite);
    sclera.scale.set(1.0, 0.85, 0.5);
    g.add(sclera);
    const ir = new THREE.Mesh(new THREE.SphereGeometry(0.036, 24, 18), iris);
    ir.scale.set(1.0, 1.05, 0.35);
    ir.position.set(0, -0.003, 0.03);
    g.add(ir);
    const pu = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 10), pupil);
    pu.scale.set(1, 1.1, 0.35);
    pu.position.set(0, -0.003, 0.043);
    g.add(pu);
    const hl1 = new THREE.Mesh(
      new THREE.SphereGeometry(0.011, 10, 8),
      new THREE.MeshBasicMaterial({ color: "#ffffff" })
    );
    hl1.position.set(-0.012, 0.014, 0.048);
    g.add(hl1);
    const hl2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.006, 8, 8),
      new THREE.MeshBasicMaterial({ color: "#ffffff" })
    );
    hl2.position.set(0.011, -0.013, 0.048);
    g.add(hl2);
    // Upper lid line
    const lid = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.004, 0.09, 4, 8),
      new THREE.MeshBasicMaterial({ color: "#150a06" })
    );
    lid.rotation.z = Math.PI / 2 + side * 0.05;
    lid.position.set(0, 0.038, 0.048);
    lid.scale.set(1, 1, 0.4);
    g.add(lid);
    g.position.set(side * 0.09, 0.028, 0.235);
    return { group: g };
  };
  const eyeL = makeEye(-1);
  const eyeR = makeEye(1);
  headGroup.add(eyeL.group, eyeR.group);

  // -------- GLASSES --------
  const rimGeo = new THREE.TorusGeometry(0.077, 0.007, 12, 32);
  const rimL = new THREE.Mesh(rimGeo, glassRim);
  rimL.position.set(-0.09, 0.028, 0.263);
  const rimR = new THREE.Mesh(rimGeo, glassRim);
  rimR.position.set(0.09, 0.028, 0.263);
  const bridge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.005, 0.005, 0.045, 10),
    glassRim
  );
  bridge.rotation.z = Math.PI / 2;
  bridge.position.set(0, 0.028, 0.263);
  const templeL = new THREE.Mesh(
    new THREE.CylinderGeometry(0.004, 0.004, 0.14, 8),
    glassRim
  );
  templeL.rotation.z = Math.PI / 2;
  templeL.rotation.y = -0.14;
  templeL.position.set(-0.23, 0.028, 0.175);
  const templeR = templeL.clone();
  templeR.rotation.y = 0.14;
  templeR.position.set(0.23, 0.028, 0.175);
  const lensL = new THREE.Mesh(new THREE.CircleGeometry(0.072, 24), lens);
  lensL.position.set(-0.09, 0.028, 0.267);
  const lensR = new THREE.Mesh(new THREE.CircleGeometry(0.072, 24), lens);
  lensR.position.set(0.09, 0.028, 0.267);
  headGroup.add(rimL, rimR, bridge, templeL, templeR, lensL, lensR);

  // -------- NOSE (Indian-appropriate — slightly more defined than earlier) --------
  // Nose bridge (small vertical capsule)
  const noseBridge = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.05, 6, 10), skin);
  noseBridge.scale.set(0.9, 1, 0.7);
  noseBridge.position.set(0, 0.005, 0.27);
  headGroup.add(noseBridge);
  // Nose tip
  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.028, 20, 16), skin);
  noseTip.scale.set(1, 0.9, 1.1);
  noseTip.position.set(0, -0.05, 0.285);
  headGroup.add(noseTip);
  // Nostrils shadow
  const nostrilMat = new THREE.MeshBasicMaterial({
    color: "#6a3a24",
    transparent: true,
    opacity: 0.55,
  });
  const nostrilL = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 8), nostrilMat);
  nostrilL.position.set(-0.014, -0.065, 0.29);
  const nostrilR = nostrilL.clone();
  nostrilR.position.x = 0.014;
  headGroup.add(nostrilL, nostrilR);

  // -------- MOUTH (partially hidden by moustache — subtle smile) --------
  const mouthShape = new THREE.Mesh(
    new THREE.TorusGeometry(0.04, 0.005, 6, 16, Math.PI * 0.7),
    mouthMat
  );
  mouthShape.rotation.z = Math.PI + 0.35;
  mouthShape.rotation.x = 0.15;
  mouthShape.position.set(0, -0.135, 0.25);
  headGroup.add(mouthShape);

  // -------- BLUSH --------
  const blushL = new THREE.Mesh(new THREE.CircleGeometry(0.035, 20), blush);
  blushL.position.set(-0.16, -0.07, 0.245);
  const blushR = blushL.clone();
  blushR.position.x = 0.16;
  headGroup.add(blushL, blushR);

  // =====================================================================
  // NECK
  // =====================================================================
  const neckGeo = tapered(0.078, 0.086, 0.09, 0.14);
  const neck = new THREE.Mesh(neckGeo, skin);
  neck.position.y = 1.36;
  root.add(neck);

  // =====================================================================
  // TORSO — smooth lathed shirt shape (barrel with shoulder taper)
  // =====================================================================
  const torsoGeo = torsoGeometry(0.34, 0.32, 0.26, 0.65);
  const torso = new THREE.Mesh(torsoGeo, shirt);
  torso.position.y = 0.7;
  root.add(torso);

  // Shirt shadow band (subtle side shadow)
  const shadowSide = new THREE.Mesh(torsoGeo.clone(), shirtShade);
  shadowSide.position.y = 0.7;
  shadowSide.scale.set(1.005, 1.005, 1.005);
  // Clip via a plane — simplest: rotate & offset to left half via z clipping trick
  // Instead: overlay a soft strip
  root.add(shadowSide);
  shadowSide.visible = false; // simplification — full torso is already toon-shaded

  // Collar band (small torus around neck)
  const collarBand = new THREE.Mesh(
    new THREE.TorusGeometry(0.11, 0.025, 10, 24),
    shirt
  );
  collarBand.rotation.x = Math.PI / 2;
  collarBand.position.y = 1.3;
  root.add(collarBand);

  // Collar wings (two small tilted planes / capsules)
  const collarWingGeo = new THREE.SphereGeometry(0.06, 16, 12);
  const collarL = new THREE.Mesh(collarWingGeo, shirt);
  collarL.scale.set(1.2, 0.35, 0.6);
  collarL.position.set(-0.08, 1.28, 0.14);
  collarL.rotation.z = 0.45;
  const collarR = new THREE.Mesh(collarWingGeo, shirt);
  collarR.scale.set(1.2, 0.35, 0.6);
  collarR.position.set(0.08, 1.28, 0.14);
  collarR.rotation.z = -0.45;
  root.add(collarL, collarR);

  // V-neck opening (dark small triangle to suggest shirt open)
  const chestOpening = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 12, 10),
    skin
  );
  chestOpening.scale.set(0.9, 1.2, 0.3);
  chestOpening.position.set(0, 1.22, 0.19);
  root.add(chestOpening);

  // Shirt buttons (down the middle)
  for (let i = 0; i < 4; i++) {
    const btn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.011, 0.011, 0.005, 10),
      new THREE.MeshBasicMaterial({ color: "#c9a15a" })
    );
    btn.rotation.x = Math.PI / 2;
    btn.position.set(0, 1.13 - i * 0.13, 0.22);
    root.add(btn);
  }

  // Pocket (small square outline suggestion — using a thin torus)
  const pocket = new THREE.Mesh(
    new THREE.TorusGeometry(0.045, 0.004, 6, 16),
    shirtShade
  );
  pocket.rotation.x = Math.PI / 2;
  pocket.scale.set(1.1, 0.85, 1);
  pocket.position.set(-0.13, 1.06, 0.215);
  root.add(pocket);

  // Belt
  const beltMesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.24, 0.025, 10, 32),
    belt
  );
  beltMesh.rotation.x = Math.PI / 2;
  beltMesh.scale.set(1.05, 0.55, 1);
  beltMesh.position.y = 0.7;
  root.add(beltMesh);
  const buckleMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.045, 0.02),
    buckle
  );
  buckleMesh.position.set(0, 0.7, 0.25);
  root.add(buckleMesh);

  // =====================================================================
  // LEGS — smooth tapered lathes (like actual leg shape)
  // =====================================================================
  const legL = new THREE.Group();
  legL.position.set(-0.13, 0.7, 0);
  // Thigh: wider at top (hip), narrows to knee
  const thighL = new THREE.Mesh(tapered(0.115, 0.1, 0.09, 0.36), pants);
  thighL.position.y = -0.36;
  thighL.rotation.x = Math.PI;
  // Shin: tapered from knee to ankle
  const shinPivotL = new THREE.Group();
  shinPivotL.position.y = -0.36;
  const shinL = new THREE.Mesh(tapered(0.09, 0.08, 0.065, 0.36), pants);
  shinL.position.y = -0.36;
  shinL.rotation.x = Math.PI;
  shinPivotL.add(shinL);
  // Shoe — smooth ellipsoid (not a box)
  const shoeL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 14), shoe);
  shoeL.scale.set(1.0, 0.55, 2.0);
  shoeL.position.set(0, -0.4, 0.08);
  shinPivotL.add(shoeL);
  legL.add(thighL, shinPivotL);
  root.add(legL);

  const legR = new THREE.Group();
  legR.position.set(0.13, 0.7, 0);
  const thighR = new THREE.Mesh(tapered(0.115, 0.1, 0.09, 0.36), pants);
  thighR.position.y = -0.36;
  thighR.rotation.x = Math.PI;
  const shinPivotR = new THREE.Group();
  shinPivotR.position.y = -0.36;
  const shinR = new THREE.Mesh(tapered(0.09, 0.08, 0.065, 0.36), pants);
  shinR.position.y = -0.36;
  shinR.rotation.x = Math.PI;
  shinPivotR.add(shinR);
  const shoeR = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 14), shoe);
  shoeR.scale.set(1.0, 0.55, 2.0);
  shoeR.position.set(0, -0.4, 0.08);
  shinPivotR.add(shoeR);
  legR.add(thighR, shinPivotR);
  root.add(legR);

  // =====================================================================
  // ARMS — tapered rolled sleeves + bare forearms
  // =====================================================================
  const armL = new THREE.Group();
  armL.position.set(-0.34, 1.28, 0);
  // Upper arm: shirt sleeve (rolled up to elbow)
  const upperArmL = new THREE.Mesh(tapered(0.085, 0.08, 0.075, 0.28), shirt);
  upperArmL.position.y = -0.28;
  upperArmL.rotation.x = Math.PI;
  // Sleeve cuff (roll) — small torus at elbow
  const cuffL = new THREE.Mesh(
    new THREE.TorusGeometry(0.088, 0.014, 8, 20),
    shirt
  );
  cuffL.rotation.x = Math.PI / 2;
  cuffL.position.y = -0.28;
  // Forearm: bare skin, tapered
  const foreArmPivotL = new THREE.Group();
  foreArmPivotL.position.y = -0.28;
  const foreArmL = new THREE.Mesh(tapered(0.075, 0.065, 0.055, 0.3), skin);
  foreArmL.position.y = -0.3;
  foreArmL.rotation.x = Math.PI;
  // Hand — ellipsoid + subtle finger stub
  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.062, 20, 14), skin);
  handL.scale.set(0.85, 1.15, 0.55);
  handL.position.set(0, -0.36, 0);
  foreArmPivotL.add(foreArmL, handL);
  armL.add(upperArmL, cuffL, foreArmPivotL);
  root.add(armL);

  const armR = new THREE.Group();
  armR.position.set(0.34, 1.28, 0);
  const upperArmR = new THREE.Mesh(tapered(0.085, 0.08, 0.075, 0.28), shirt);
  upperArmR.position.y = -0.28;
  upperArmR.rotation.x = Math.PI;
  const cuffR = new THREE.Mesh(
    new THREE.TorusGeometry(0.088, 0.014, 8, 20),
    shirt
  );
  cuffR.rotation.x = Math.PI / 2;
  cuffR.position.y = -0.28;
  const foreArmPivotR = new THREE.Group();
  foreArmPivotR.position.y = -0.28;
  const foreArmR = new THREE.Mesh(tapered(0.075, 0.065, 0.055, 0.3), skin);
  foreArmR.position.y = -0.3;
  foreArmR.rotation.x = Math.PI;
  const handR = new THREE.Mesh(new THREE.SphereGeometry(0.062, 20, 14), skin);
  handR.scale.set(0.85, 1.15, 0.55);
  handR.position.set(0, -0.36, 0);
  foreArmPivotR.add(foreArmR, handR);
  armR.add(upperArmR, cuffR, foreArmPivotR);
  root.add(armR);

  // Shadow blob
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.38, 24),
    new THREE.MeshBasicMaterial({ color: "#000", transparent: true, opacity: 0.28 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.005;
  root.add(shadow);

  // -------- Anim state --------
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
      const amp = 0.55 * w;

      // Hip swing (whole leg groups from hip)
      legL.rotation.x = c * amp;
      legR.rotation.x = c2 * amp;
      // Knee bend on the return stroke
      shinPivotL.rotation.x = Math.max(0, -c) * 0.7 * w;
      shinPivotR.rotation.x = Math.max(0, -c2) * 0.7 * w;

      // Arm swing opposite to legs
      armL.rotation.x = c2 * amp * 0.9;
      armR.rotation.x = c * amp * 0.9;
      // Elbow bend
      foreArmPivotL.rotation.x = Math.max(0, c) * 0.55 * w;
      foreArmPivotR.rotation.x = Math.max(0, c2) * 0.55 * w;

      // Body bob + subtle chest twist
      root.position.y = Math.abs(Math.sin(t * 2)) * 0.03 * w;
      torso.rotation.y = c * 0.05 * w;
      // Head counter-twist (feels alive)
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
        foreArmPivotR.rotation.x = THREE.MathUtils.lerp(
          foreArmPivotR.rotation.x,
          -0.4,
          g
        );
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
