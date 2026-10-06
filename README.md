# TRICORE — Autonomous Security Operations

This package contains a refined copy of the published TRICORE frontend and its authored rendering and interaction layer. The original client was available only as compiled JavaScript; its TypeScript/TSX source and source maps were not available. The runtime uses React, Three.js, and React Three Fiber.

The scene loads seven individually authored Blender planet models from `assets/models/`. Their geometry preserves intended oblateness, axial orientation and equatorial rings. A fixed solar key, restrained atmospheric limbs and analytic Saturn ring shadows provide depth. All agents remain present during the collaboration sequences, with slow revolution, axial rotation, curved trajectories and travelling signals. Motion pauses when the page is backgrounded and respects reduced-motion preferences.

The renderer size, capped pixel ratio and camera projection are synchronized whenever the scene container changes dimensions. Hover enlargement is uniform; physical flattening is baked into vertices. See [the implementation notes](blender/IMPLEMENTATION.md) for physical ratios, deliberately adjusted display scales and distances, the supported GLB schema and material reproduction.

Agent detail views use a fixed-height panel with an independently scrollable content area, keeping the action controls and surrounding layout in place while reading. The hero details begin hidden; hovering a planet reveals Explore, and clicking it opens the selected agent’s scanned-detail view. The Request Deployment Access action now opens the existing request form in a right-side drawer, preserving its original form and submission behavior.

Explore performs a continuous 1.8-second camera dolly and pan in the same scene. The surrounding planets, labels, shared guides, and collaboration links fade away during the journey. The settled view contains only the selected planet, fitted without changing its proportions into the space left of the information panel, including the full extent of Saturn's own rings. Closing the panel restores the shared constellation with the same smooth transition. Mobile uses a scrollable panel beside the planet.

Scene animation runs by default and follows the browser's `prefers-reduced-motion` preference automatically, including live preference changes. Previous saved scene-motion preferences are ignored. Scene-motion buttons and the M shortcut have been removed; agent collaboration play, pause, skip, and stop controls remain independent.

Original planet maps and the Saturn ring strip are from [Solar System Scope / INOVE](https://www.solarsystemscope.com/textures/) under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Original bytes are retained in `assets/planets/`; the Blender script authors derived color, normal and roughness maps, with all modifications documented in [SOURCES.md](blender/SOURCES.md). NASA fact sheets and spacecraft imagery inform geometry and color direction. The maps remain illustrative products, and relief is not a measured elevation reconstruction.

To regenerate editable `.blend` scenes and embedded-texture `.glb` files with Blender 4.5+:

```sh
blender --background --factory-startup --python blender/generate_planets.py -- --output assets/models
```

## Preview

With Python 3 installed, run this from the extracted package directory:

```sh
python3 preview_server.py --source
```

Open `http://127.0.0.1:4173/`. The server uses Python’s standard library and serves client-side routes with the app entry page. Use `--port 8000` to choose another port.

For local acceptance capture, enable `--qa-output ../qa` and open `/?qa=1`. The optional inspector records the canvas and viewport measurements through the seven-agent journey. `qa-mobile.html` embeds the app at 390 × 844. The archived acceptance report distinguishes completed desktop checks from remaining mobile, final-revision visual and performance checks; the presence of a harness does not establish those checks passed.

Live demos: [GitHub Pages](https://hcj00112233.github.io/tricore-mission-refined/) · [Sites](https://tricore-mission-refined.chunjian-hu.chatgpt.site).
