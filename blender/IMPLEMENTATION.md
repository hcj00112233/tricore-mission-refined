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

Relative display diameters use uniform multipliers 0.58, 0.97, 0.76, 1.52, 1.36, 0.86 and 0.84. These are deliberately unlike actual planetary size ratios. All agents share an illustrative elliptical orbit with semiaxes 2.90 and 2.22 scene units, plus a planar depth incline. Angular offsets preserve a readable seven-agent constellation. Display orbital motion is 0.028 rad/s; individual axial speeds are 0.028–0.065 rad/s. Neither these distances nor these speeds is a solar-system simulation.

Color maps come from the existing Solar System Scope / INOVE collection (CC BY 4.0). Mercury is desaturated; Venus uses low-contrast pale cream clouds. Uranus and Neptune are independently recolored to restrained cyan tones. These graded maps are illustrative color treatments, not calibrated photometry. Neptune's saturated enhanced Voyager blue is not presented as natural color. NASA spacecraft imagery and fact sheets are recorded separately in `SOURCES.md`; the supplemental NASA rasters are comparison references, not active materials.

The rocky planets use procedurally authored microrelief baked analytically into tangent normal maps and variable roughness maps. The albedo has not been falsely treated as measured elevation. Broad Mercury impact relief and a gradual Mars shield feature use actual vertices; they are illustrative features, not georeferenced DEM reconstructions. Mars' shield reaches approximately the 21 km-to-radius proportion. Fine detail does not exaggerate the silhouette.

## Three.js integration

`assets/planet-assets.js` reads the exact GLB 2.0 schema emitted by the script using the existing application's Three.js classes. It validates supported accessor types, indexed triangle meshes, embedded images and node TRS, then bakes exported coordinate transforms once into the loaded geometry. It intentionally rejects compressed or otherwise unsupported extensions rather than silently misreading an asset. Re-export through the supplied script when editing assets.

The PBR albedo, tangent normal and roughness maps survive glTF export. `visual-refinement.js` explicitly recreates the web materials: a common fixed solar key, restrained fill, readable terminator, mild highlight changes on hover, and separate translucent limb shells. The same local solar vector drives an analytic ring-to-globe shadow and an oblate ellipsoid globe-to-ring shadow. Significant ring gaps are excluded from geometry and shadow masks. Real depth testing handles front/back occlusion; rings do not write transparent depth.

Planets maintain slow shared revolution, axial rotation, curved trajectories and travelling signals. Hover only changes uniform scale (4.5% for Saturn, 6.5% for others), rotation speed and daylight highlights. Explore moves the camera before the panel appears. Hero and Play Sequence keep all agents present, while agent-focus scrolling displays the selected globe in the left column. Right-side details and access form retain their original content and behavior. Mobile detail content has a bounded independent scrollbar.

## Viewport correction

The existing scene already used sphere meshes. Its CSS container changes dimensions between hero, tour, focus and sequence; its previous camera code changed aspect separately from React Three Fiber's delayed renderer resize. This was a potential interval of mismatched projection and canvas dimensions.

The new viewport synchronizer measures the actual fractional CSS rectangle and updates drawing-buffer size, capped pixel ratio and camera projection together. A ResizeObserver handles container resize; an ordered frame callback catches scroll-driven layout changes before rendering. The canvas has no CSS transforms and no nonuniform scale. Fractional widths are retained for the projection, avoiding a small residual error from integer `clientWidth`. Desktop DPR is capped at 1.5 and mobile at 1.25. Camera movement interpolates across selections without modifying any planet's shape.

## Acceptance capture

For optional local diagnostics, start the preview with `--qa-output ../qa` and open `/?qa=1`. The inspector's **Run acceptance recording** button exercises all seven hover/Explore states, scroll focus transitions, Watch the agents collaborate, Play Sequence, phase controls and the access drawer without submitting a form. It saves JSON measurements and a WebM canvas recording. A white spherical calibration mesh can be shown at the center of the camera. `qa-mobile.html` embeds the same app at 390 × 844 and starts this journey after all assets load.

Recordings capture the WebGL canvas, not the surrounding DOM UI. Canvas resize and browser/host stalls can affect recording cadence; use screenshot evidence for panel and control placement. The archived acceptance report lists actual checks, timings and verification limits. Do not interpret a desktop report as a real-device mobile or Safari verification.

The original application remains a compiled React/Three.js bundle without its TSX source maps. This work edits its separate authored visual layer and only updates the bundle's import cache key. The library's custom reader is scoped to these exports; replacing it with a general GLTFLoader requires the original source toolchain or a deliberate compatible loader integration.
