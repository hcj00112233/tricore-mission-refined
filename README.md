# TRICORE — Autonomous Security Operations

This package contains a refined copy of the published TRICORE frontend and its authored rendering and interaction layer. The original client was available only as compiled JavaScript; its TypeScript/TSX source and source maps were not available. The runtime uses React, Three.js, and React Three Fiber.

The scene moves through a seven-planet phase sequence with all agents visible and phase lines connecting the constellation. Planets revolve on their orbital paths as a fitted camera follows the sequence. Planet scales are approximately 21–35% larger, with stronger side lighting and subtle surface relief. Motion pauses when the page is backgrounded and respects reduced-motion preferences.

Agent detail views use a fixed-height panel with an independently scrollable content area, keeping the action controls and surrounding layout in place while reading. The hero details begin hidden; hovering a planet reveals Explore, and clicking it opens the selected agent’s scanned-detail view. The Request Deployment Access action now opens the existing request form in a right-side drawer, preserving its original form and submission behavior.

Explore performs a continuous 1.8-second camera dolly and pan in the same scene. The surrounding planets, labels, shared guides, and collaboration links fade away during the journey. The settled view contains only the selected planet, fitted without changing its proportions into the space left of the information panel, including the full extent of Saturn's own rings. Closing the panel restores the shared constellation with the same smooth transition. Mobile uses a scrollable panel beside the planet.

Scene animation runs by default and follows the browser's `prefers-reduced-motion` preference automatically, including live preference changes. Previous saved scene-motion preferences are ignored. Scene-motion buttons and the M shortcut have been removed; agent collaboration play, pause, skip, and stop controls remain independent.

Planet and Saturn ring textures are from [Solar System Scope / INOVE](https://www.solarsystemscope.com/textures/) under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The texture bytes are unchanged, and the page footer contains the required attribution. Asset details are in `assets/planets/manifest.json`.

## Preview

With Python 3 installed, run this from the extracted package directory:

```sh
python3 preview_server.py --source
```

Open `http://127.0.0.1:4173/`. The server uses Python’s standard library and serves client-side routes with the app entry page. Use `--port 8000` to choose another port.

Live demos: [GitHub Pages](https://hcj00112233.github.io/tricore-mission-refined/) · [Sites](https://tricore-mission-refined.chunjian-hu.chatgpt.site).
