# Character models

The Character component tries to load two optional files at runtime:

- `deepak.glb` — a rigged full-body avatar (any humanoid GLTF works)
- `animations.glb` — clips named `idle`, `walk`, and one of `handshake|greet|wave`

If either file is missing, the site falls back to a hand-built procedural
low-poly figure that fully supports the scroll-driven walk/turn/handshake
choreography. **The site is designed to be complete without these files.**

## To populate with a real photo-generated avatar

1. Obtain a Ready Player Me partner subdomain (free: readyplayer.me → developers).
2. Set `PHOTO_PATH` to your source photo.
3. Run `npm run prepare:avatar` — this posts your photo to RPM and writes `deepak.glb`.
4. Download the standard Mixamo pack (`idle.fbx`, `walking.fbx`, `standing_greeting.fbx`),
   convert to a single GLB with `fbx2gltf`, and place at `animations.glb`.

Both files should stay under ~3 MB combined. Use Draco / meshopt compression.
