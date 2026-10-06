# TRICORE — Autonomous Security Operations

This repository contains the deployable static runtime of a refined copy of the published TRICORE frontend, plus authored rendering and interaction assets. The original client was available only as a compiled JavaScript bundle; its TypeScript/TSX source and source maps were not available. The runtime uses React, Three.js, and React Three Fiber.

The scene uses planet scales increased by approximately 21–35%, stronger side lighting, subtle surface relief, and a larger selected-planet view. During scrolling, the scene follows a bounded camera drift with orbit and planet rotation, moving light, and drifting stardust. Motion pauses when the page is backgrounded and respects reduced-motion preferences.

The hero details begin hidden. Hovering a planet shows the Explore affordance and adds a cursor ring, a 3.4× spin response, a 4.5–6.5% scale increase, and a light response. Clicking Explore opens that planet's scanned-detail view. Compact Step controls sit 20px below the call to action.

The planetary and Saturn ring textures come from [Solar System Scope / INOVE](https://www.solarsystemscope.com/textures/) under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Their bytes are unchanged. Required attribution appears in the page footer; the asset details are in `assets/planets/manifest.json`.

## Preview

With Python 3 installed, run this from the repository root:

```sh
python3 preview_server.py --source
```

Open `http://127.0.0.1:4173/`. The server uses only Python's standard library and serves client-side routes with the app entry page. Use `--port 8000` to select another local port.

Live demo: [GitHub Pages](https://hcj00112233.github.io/tricore-mission-refined/) · [Sites mirror](https://tricore-mission-refined.chunjian-hu.chatgpt.site).
