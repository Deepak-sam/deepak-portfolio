# Deepak Thangaraj — Interactive Portfolio

An interactive, scroll-driven, 3D cinematic portfolio built with Next.js 14,
React Three Fiber, GSAP, and Lenis. As you scroll, a stylised 3D avatar walks
across an infrastructure landscape through seven scenes — from arrival to a
final handshake — telling a 19-year career story.

## Concept — "The Architect Walks the Estate"

Seven scenes, driven by a single scroll timeline:

1. **Arrival** — idle stance, camera pulls back over a voxel-grid landscape.
2. **The Present** — walks to a glowing hub; 2,000 endpoints orbit, ₹5 Cr budget.
3. **Capabilities Pavilion** — passes four monoliths (M365, Security, Endpoint, Automation).
4. **Timeline Bridge** — walks past year-pillars (2006 → 2026).
5. **Case Studies** — pauses; three spotlight cards dolly in.
6. **Credentials Grove** — badges float around him.
7. **Handshake** — turns to face the camera, extends a hand.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| 3D | React Three Fiber + drei + postprocessing |
| Scroll | Lenis (smooth) + custom velocity-driven walk blend |
| Animation | Framer Motion + GSAP-ready hooks |
| Styling | Tailwind CSS |
| Fonts | Inter + Fraunces (via `next/font`) |

## Character system

The scroll-driven walking figure has two modes:

- **Procedural** (default) — a hand-built low-poly rigged figure. Zero external
  assets. Always works. Its walk cycle, turn, and handshake are all controlled
  by scroll progress + velocity.
- **GLB** (optional) — if `/public/models/deepak.glb` and `animations.glb` are
  present, they're loaded and animated on top of the same scroll logic.
  See `public/models/README.md` for the Ready Player Me pipeline.

## Accessibility & fallbacks

- `prefers-reduced-motion` disables Lenis and the 3D canvas.
- No-WebGL browsers render the DOM sections normally (canvas is hidden).
- All resume content lives as semantic HTML — indexable + screen-reader friendly.
- A print-friendly `/resume` route mirrors the same content.

## Development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Deploy

```bash
npx vercel --prod
```

## License

Content © Deepak Thangaraj. Codebase MIT.
