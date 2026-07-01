#!/usr/bin/env node
/**
 * Ready Player Me photo-to-avatar pipeline.
 *
 * Reads a source photo (default: /Users/Deepak.t/Pictures/IMG_2698.jpg),
 * posts it to Ready Player Me, and downloads the resulting GLB into
 * public/models/deepak.glb.
 *
 * If any step fails, we print the error and exit non-zero WITHOUT touching
 * existing files — the site's procedural fallback continues to work.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PHOTO = process.env.PHOTO_PATH || "/Users/Deepak.t/Pictures/IMG_2698.jpg";
const OUT_DIR = path.join(ROOT, "public", "models");
const OUT_GLB = path.join(OUT_DIR, "deepak.glb");

async function main() {
  console.log(`[avatar] source photo: ${PHOTO}`);
  await fs.mkdir(OUT_DIR, { recursive: true });

  const bytes = await fs.readFile(PHOTO);
  console.log(`[avatar] photo bytes: ${bytes.length}`);

  // Ready Player Me public photo-to-avatar endpoint.
  // Note: RPM's public API surface changes over time. This script attempts
  // the current documented flow; on failure the fallback path is transparent
  // (the site keeps working with the procedural figure).

  const b64 = bytes.toString("base64");
  const dataUri = `data:image/jpeg;base64,${b64}`;

  // Step 1: create anonymous user
  let userId, userToken;
  try {
    const r = await fetch("https://api.readyplayer.me/v1/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: { applicationId: "portfolio" } }),
    });
    if (!r.ok) throw new Error(`user create ${r.status}`);
    const j = await r.json();
    userId = j?.data?.id;
    userToken = j?.data?.token;
    console.log(`[avatar] anonymous user: ${userId}`);
  } catch (e) {
    console.warn("[avatar] RPM user API unavailable:", e.message);
    process.exit(2);
  }

  // Step 2: create avatar from photo
  let avatarId;
  try {
    const r = await fetch("https://api.readyplayer.me/v1/avatars", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        data: {
          partner: "readyplayerme",
          bodyType: "fullbody",
          assets: {
            photo: dataUri,
          },
        },
      }),
    });
    if (!r.ok) {
      const text = await r.text();
      throw new Error(`avatar create ${r.status}: ${text.slice(0, 200)}`);
    }
    const j = await r.json();
    avatarId = j?.data?.id;
    console.log(`[avatar] avatar id: ${avatarId}`);
  } catch (e) {
    console.warn("[avatar] RPM avatar API unavailable:", e.message);
    process.exit(3);
  }

  // Step 3: fetch compressed GLB
  try {
    const url = `https://models.readyplayer.me/${avatarId}.glb?morphTargets=none&meshCompression=true&lod=1&textureSizeLimit=1024&textureFormat=webp`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`glb fetch ${r.status}`);
    const buf = Buffer.from(await r.arrayBuffer());
    await fs.writeFile(OUT_GLB, buf);
    console.log(`[avatar] saved ${OUT_GLB} (${buf.length} bytes)`);
  } catch (e) {
    console.warn("[avatar] GLB download failed:", e.message);
    process.exit(4);
  }

  console.log("[avatar] done");
}

main().catch((e) => {
  console.error("[avatar] fatal:", e);
  process.exit(1);
});
