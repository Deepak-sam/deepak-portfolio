"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useScrollProgress, sceneProgress } from "@/lib/useScrollProgress";

/**
 * Character controller.
 *
 * Runs on a procedural low-poly rigged figure by default (always works, no assets).
 * If /models/deepak.glb exists at runtime, it will load and use that instead —
 * with our procedural walk animation driven by scroll velocity applied on top.
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

  // Attempt to load a real GLB avatar if present. Silent fallback otherwise.
  useEffect(() => {
    let cancelled = false;
    const loader = new GLTFLoader();
    loader.load(
      "/models/deepak.glb",
      (gltf) => {
        if (cancelled) return;
        gltf.scene.traverse((o: any) => {
          if (o.isMesh) {
            o.castShadow = false;
            o.receiveShadow = false;
            if (o.material) {
              o.material.envMapIntensity = 0.6;
            }
          }
        });
        // Normalise scale
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const size = new THREE.Vector3();
        box.getSize(size);
        const targetHeight = 1.75;
        const scale = size.y > 0 ? targetHeight / size.y : 1;
        gltf.scene.scale.setScalar(scale);
        // Ground it
        const bboxScaled = new THREE.Box3().setFromObject(gltf.scene);
        gltf.scene.position.y -= bboxScaled.min.y;
        setGltfScene(gltf.scene);

        // Load animations
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
            if (walk) walk.setEffectiveWeight(0);
            if (idle) idle.setEffectiveWeight(1);
            setRpmAnims({ mixer, idle, walk, handshake: shake });
          },
          undefined,
          () => {
            /* animations.glb missing — proceed without */
          }
        );
      },
      undefined,
      () => {
        /* deepak.glb missing — procedural fallback continues */
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // Procedural articulated figure (fallback / augmentation)
  const rig = useMemo(() => buildProceduralRig(), []);

  // Animate every frame
  useFrame((_, dt) => {
    if (!group.current) return;
    // Character world position derived from scroll progress.
    // Path is a curved lane that snakes through the 7 scene stops.
    const p = progress;
    const pos = pathPosition(p);
    const tangent = pathTangent(p);
    group.current.position.lerp(pos, 0.12);

    // Face along tangent, except during handshake scene where we face camera
    const inHandshake = p >= 0.9;
    if (inHandshake) {
      const t = sceneProgress(p, "handshake");
      // Blend from tangent → face camera (which sits at world +Z-ish)
      const facing = new THREE.Vector3().lerpVectors(
        tangent,
        new THREE.Vector3(0, 0, 1),
        Math.min(1, (t - 0.4) / 0.5)
      );
      const targetYaw = Math.atan2(facing.x, facing.z);
      group.current.rotation.y = dampAngle(group.current.rotation.y, targetYaw, dt, 6);
    } else {
      const targetYaw = Math.atan2(tangent.x, tangent.z);
      group.current.rotation.y = dampAngle(group.current.rotation.y, targetYaw, dt, 8);
    }

    // Walk vs idle blend, driven by scroll velocity magnitude
    const speed = Math.min(1, Math.abs(velocity) * 4); // velocity is progress/sec; scale up
    const walkWeight = smoothstep(0.05, 0.5, speed);
    rig.setWalkWeight(walkWeight, dt);
    rig.tick(dt, walkWeight);

    // Handshake animation on late progress
    if (inHandshake) {
      const t = sceneProgress(p, "handshake");
      rig.setHandshake(t);
    } else {
      rig.setHandshake(0);
    }

    // If RPM anims present, mirror the blend
    if (rpmAnims) {
      rpmAnims.mixer.update(dt);
      if (rpmAnims.walk && rpmAnims.idle) {
        rpmAnims.walk.setEffectiveWeight(walkWeight);
        rpmAnims.idle.setEffectiveWeight(1 - walkWeight);
      }
      if (rpmAnims.handshake && inHandshake) {
        const t = sceneProgress(p, "handshake");
        if (t > 0.5 && !rpmAnims.handshake.isRunning()) {
          rpmAnims.handshake.reset().setLoop(THREE.LoopOnce, 1).play();
        }
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
// A spline through 7 keypoints in world space. Character z ~ ground-plane.
const PATH_POINTS: THREE.Vector3[] = [
  new THREE.Vector3(0, 0, 0),      // scene 1 arrival
  new THREE.Vector3(0, 0, -4),     // scene 2 present
  new THREE.Vector3(2.5, 0, -8),   // scene 3 capabilities
  new THREE.Vector3(6, 0, -10),    // scene 4 timeline bridge start
  new THREE.Vector3(10, 0, -8),    // scene 5 case studies
  new THREE.Vector3(12, 0, -4),    // scene 6 credentials grove
  new THREE.Vector3(12, 0, 0),     // scene 7 handshake
];
const CURVE = new THREE.CatmullRomCurve3(PATH_POINTS, false, "catmullrom", 0.4);

function pathPosition(p: number) {
  return CURVE.getPointAt(Math.min(1, Math.max(0, p)));
}
function pathTangent(p: number) {
  return CURVE.getTangentAt(Math.min(0.999, Math.max(0.001, p))).normalize();
}

// ---------- Procedural low-poly figure ----------
function buildProceduralRig() {
  const root = new THREE.Group();

  const skin = new THREE.MeshStandardMaterial({
    color: "#c58c6a",
    roughness: 0.7,
    metalness: 0.05,
  });
  const suit = new THREE.MeshStandardMaterial({
    color: "#111726",
    roughness: 0.55,
    metalness: 0.15,
    emissive: "#0a1220",
    emissiveIntensity: 0.4,
  });
  const shirt = new THREE.MeshStandardMaterial({
    color: "#e5f7fb",
    roughness: 0.6,
    emissive: "#22d3ee",
    emissiveIntensity: 0.08,
  });
  const hair = new THREE.MeshStandardMaterial({
    color: "#1a1410",
    roughness: 0.5,
  });
  const glassRim = new THREE.MeshStandardMaterial({
    color: "#111",
    metalness: 0.9,
    roughness: 0.2,
  });

  // Head
  const headGroup = new THREE.Group();
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 20), skin);
  headGroup.add(head);
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.145, 24, 20, 0, Math.PI * 2, 0, Math.PI / 2.1),
    hair
  );
  hairCap.position.y = 0.01;
  headGroup.add(hairCap);
  // Glasses
  const gl1 = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.006, 8, 20), glassRim);
  gl1.position.set(-0.055, -0.005, 0.115);
  gl1.rotation.y = 0;
  const gl2 = gl1.clone();
  gl2.position.x = 0.055;
  const bridge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.004, 0.004, 0.05, 8),
    glassRim
  );
  bridge.rotation.z = Math.PI / 2;
  bridge.position.set(0, -0.005, 0.115);
  headGroup.add(gl1, gl2, bridge);
  headGroup.position.y = 1.68;
  root.add(headGroup);

  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.08, 12), skin);
  neck.position.y = 1.55;
  root.add(neck);

  // Torso (jacket)
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 0.28), suit);
  torso.position.y = 1.18;
  root.add(torso);

  // Shirt V
  const shirtV = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.55, 0.02), shirt);
  shirtV.position.set(0, 1.2, 0.15);
  root.add(shirtV);

  // Hips
  const hips = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.14, 0.26), suit);
  hips.position.y = 0.83;
  root.add(hips);

  // Legs — pivot groups for swing
  const legL = new THREE.Group();
  legL.position.set(-0.11, 0.83, 0);
  const legLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.82, 0.2), suit);
  legLMesh.position.y = -0.41;
  const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.3), suit);
  shoeL.position.set(0, -0.85, 0.05);
  legL.add(legLMesh, shoeL);
  root.add(legL);

  const legR = new THREE.Group();
  legR.position.set(0.11, 0.83, 0);
  const legRMesh = legLMesh.clone();
  const shoeR = shoeL.clone();
  legR.add(legRMesh, shoeR);
  root.add(legR);

  // Arms
  const armL = new THREE.Group();
  armL.position.set(-0.28, 1.42, 0);
  const armLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.62, 0.15), suit);
  armLMesh.position.y = -0.32;
  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), skin);
  handL.position.y = -0.66;
  armL.add(armLMesh, handL);
  root.add(armL);

  const armR = new THREE.Group();
  armR.position.set(0.28, 1.42, 0);
  const armRMesh = armLMesh.clone();
  const handR = handL.clone();
  armR.add(armRMesh, handR);
  root.add(armR);

  // Animation state
  let t = 0;
  let walkWeight = 0;
  let handshake = 0;

  return {
    root,
    setWalkWeight(w: number, _dt: number) {
      walkWeight = w;
    },
    setHandshake(h: number) {
      handshake = h;
    },
    tick(dt: number, w: number) {
      t += dt * (2.2 + w * 4.2); // faster cadence at higher walk weight
      // Idle sway
      const idleSway = Math.sin(t * 0.6) * 0.02 * (1 - w);
      headGroup.rotation.z = idleSway;
      // Walk cycle
      const cycle = Math.sin(t);
      const cycle2 = Math.sin(t + Math.PI);
      const amp = 0.55 * w;
      legL.rotation.x = cycle * amp;
      legR.rotation.x = cycle2 * amp;
      armL.rotation.x = cycle2 * amp * 0.9;
      armR.rotation.x = cycle * amp * 0.9;
      // Vertical bob
      root.position.y = Math.abs(Math.sin(t * 2)) * 0.03 * w;

      // Handshake — override right arm
      if (handshake > 0.5) {
        const h = smoothstep(0.5, 1, handshake);
        armR.rotation.x = THREE.MathUtils.lerp(armR.rotation.x, -1.15, h);
        armR.rotation.z = THREE.MathUtils.lerp(armR.rotation.z, -0.25, h);
        // small offer bob
        armR.rotation.x += Math.sin(t * 3) * 0.05 * h;
      }
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
