# TRICORE seven-planet asset library

Seven individually authored Blender scenes and seven embedded-texture GLBs are in `assets/models/`. Each scene has a named axial rig, baked body geometry, editable materials, solar lighting and a review camera. Saturn has seven separate thin annuli with Cassini, Encke and Keeler gaps. Uranus has three faint equatorial ring bands. Venus has hidden solid ground, a fully opaque cloud deck and an independent atmospheric shell.

## Reproduce

Use Blender 4.5 or later (generated with 5.2.2 LTS). From the website directory:

```sh
blender --background --factory-startup --python blender/generate_planets.py -- --output assets/models
python3 preview_server.py --source --port 4183
```

The script uses Blender's bundled NumPy and requires no add-ons. The original, attributed maps in `assets/planets/` are its input. Exported GLBs have embedded PNG images; the external texture PNGs are provided for editing. Every FILE image in the saved Blender scenes is packed. Open any `.blend` and use its review camera; the output GLB intentionally has an upright axis so the website can align it to the shared orbital plane.

## Scientific and artistic decisions

The body polar/equatorial ratios are Mercury 1.000, Venus 1.000, Mars 0.994111, Jupiter 0.935126, Saturn 0.902038, Uranus 0.977073 and Neptune 0.982919. The tiny Mercury departure from sphericity is ignored. Flattening is baked into vertex positions. Axial tilt is 0.034°, 177.36°, 25.19°, 3.13°, 26.73°, 97.77° and 28.32°, respectively. Runtime orientation applies this obliquity in an upright Y-pole planetary reference frame. Rings remain in each body's equatorial plane. The schematic display trajectories do not encode a scientific ecliptic projection, so their apparent plane should not be used to measure obliquity.

Relative display diameters use uniform multipliers 0.68, 1.16, 0.84, 2.08, 1.78, 1.04 and 1.02. These are deliberately unlike actual planetary size ratios: Jupiter and Saturn carry the visual weight while the smaller bodies retain readable identities. Polar/equatorial ratios remain baked into the meshes; camera changes and hover use uniform scale only.

The user approved nested elliptical display orbits on 2026-10-10. They share center `(0, 0.35, -0.85)`, have semiaxes `(r, 0.72r)`, and a shallow common depth incline. Mercury, Venus, Mars, Jupiter, Saturn, Uranus and Neptune use radii 3.10, 3.35, 4.12, 2.15, 2.65, 3.55 and 4.38, with initial phases 155°, 276°, 227°, 211°, 18°, 98° and 58°. A shared display speed of 0.007 rad/s preserves phase separation over a roughly fifteen-minute revolution. This is an illustrative collaboration constellation, not Keplerian solar-system dynamics.

Individual axial display speeds are 0.015, 0.009, 0.045, 0.085, 0.078, 0.058 and 0.060 rad/s. Rotation follows each tilted pole; Venus at 177.36° and Uranus at 97.77° therefore rotate retrograde in the common reference frame. No extra sign reversal is applied. The reference tilt axis `(0.82, 0, 0.57)` gives Saturn's equatorial rings a readable opening while preserving their attachment to its own axial rig. Hover does not accelerate the spin.

Color maps come from the existing Solar System Scope / INOVE collection (CC BY 4.0). Mercury is desaturated; Venus uses low-contrast pale cream clouds. Uranus and Neptune are independently recolored to restrained cyan tones. These graded maps are illustrative color treatments, not calibrated photometry. Neptune's saturated enhanced Voyager blue is not presented as natural color. NASA spacecraft imagery and fact sheets are recorded separately in `SOURCES.md`; the supplemental NASA rasters are comparison references, not active materials.

The rocky planets use procedurally authored microrelief baked analytically into tangent normal maps and variable roughness maps. The albedo has not been falsely treated as measured elevation. Broad Mercury impact relief and a gradual Mars shield feature use actual vertices; they are illustrative features, not georeferenced DEM reconstructions. Mars' shield reaches approximately the 21 km-to-radius proportion. Fine detail does not exaggerate the silhouette.

## Three.js integration

`assets/planet-assets.js` reads the exact GLB 2.0 schema emitted by the script using the existing application's Three.js classes. It validates supported accessor types, indexed triangle meshes, embedded images and node TRS, then bakes exported coordinate transforms once into the loaded geometry. It intentionally rejects compressed or otherwise unsupported extensions rather than silently misreading an asset. Re-export through the supplied script when editing assets.

The PBR albedo, tangent normal and roughness maps survive glTF export. `visual-refinement.js` explicitly recreates the web materials: a common fixed solar key, restrained fill, readable terminator, and separate translucent limb shells. Tangent normal maps apply only to Mercury and Mars. Venus and Uranus have fully opaque cloud bodies, zero highlight contribution, and restrained broad cloud structure. Their materials contain no transmission, refraction, environment reflections or surface displacement. Render blending allows transitional fades; cloud-body alpha is one in the settled view and it writes depth. The same local solar vector drives an analytic ring-to-globe shadow and an oblate ellipsoid globe-to-ring shadow. Significant ring gaps are excluded from geometry and shadow masks. Real depth testing handles front/back occlusion; rings do not write transparent depth.

Planets maintain slow shared revolution, axial rotation, curved trajectories and travelling signals. Hover only changes uniform scale (4.5% for Saturn, 6.5% for others) and daylight brightness. Explore moves the camera before the panel appears. Hero and Play Sequence keep all agents present, while agent-focus scrolling displays the selected globe in the left column. Right-side details and access form retain their original content and behavior. Mobile detail content has a bounded independent scrollbar.

## Loading and initial composition

`scene-initial-desktop.png` and `scene-initial-mobile.png` are transparent canvas captures of the actual, complete 3D scene at its initial pose, not replacement artwork. The capture mode `?capture=1` holds the scene clock and exports one PNG through the optional local QA server. Reference canvas aspects are 687/565 and 380/350. Responsive camera zoom preserves that perspective with uniform letterboxing, matching each poster's `object-fit: contain` treatment.

All seven GLBs and embedded textures must resolve before the scene mounts. Six rendered frames after the meshes mount allow viewport synchronization and camera placement before a 650 ms crossfade. The clock starts after 700 ms, so models do not move away from the poster during the handoff. Slow world-space orbits and communications then continue in live geometry. A load failure retains the poster and the existing agent controls; it does not expose an incomplete constellation.

## Viewport correction

The existing scene already used sphere meshes. Its CSS container changes dimensions between hero, tour, focus and sequence; its previous camera code changed aspect separately from React Three Fiber's delayed renderer resize. This was a potential interval of mismatched projection and canvas dimensions.

The new viewport synchronizer measures the actual fractional CSS rectangle and updates drawing-buffer size, capped pixel ratio and camera projection together. A ResizeObserver handles container resize; an ordered frame callback catches scroll-driven layout changes before rendering. The canvas has no CSS transforms and no nonuniform scale. Fractional widths are retained for the projection, avoiding a small residual error from integer `clientWidth`. Desktop DPR is capped at 1.5 and mobile at 1.25. Camera movement interpolates across selections without modifying any planet's shape.

## Acceptance capture

For optional local diagnostics, start the preview with `--qa-output ../qa` and open `/?qa=1`. The inspector's **Run acceptance recording** button exercises all seven hover/Explore states, scroll focus transitions, Watch the agents collaborate, Play Sequence, phase controls and the access drawer without submitting a form. It saves JSON measurements and a WebM canvas recording. A white spherical calibration mesh can be shown at the center of the camera. `qa-mobile.html` embeds the same app at 390 × 844 and starts this journey after all assets load.

Recordings capture the WebGL canvas, not the surrounding DOM UI. Canvas resize and browser/host stalls can affect recording cadence; use screenshot evidence for panel and control placement. The archived acceptance report lists actual checks, timings and verification limits. Do not interpret a desktop report as a real-device mobile or Safari verification.

The original application remains a compiled React/Three.js bundle without its TSX source maps. This work edits its separate authored visual layer and only updates the bundle's import cache key. The library's custom reader is scoped to these exports; replacing it with a general GLTFLoader requires the original source toolchain or a deliberate compatible loader integration.
