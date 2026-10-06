# TRICORE Blender planet library: sources and scientific basis

Research checked 2026-10-07. This page records the facts used by the Blender scene, the imagery staged with the website, additional NASA/JPL source maps retrieved for comparison, and the artistic-only film references. Planet textures are color/albedo references; they are not elevation data unless explicitly described as a DEM.

## Physical proportions and axial tilt

The site uses NASA NSSDC Planetary Fact Sheet diameter ratios to Earth as radius ratios (a diameter ratio is numerically the same as a radius ratio). For the authored oblate shapes, the polar/equatorial ratios come from each body's listed polar and equatorial radii. The obliquities below follow NSSDC's J2000 definition; Venus's 177.36° is retained because it rotates retrograde. These dimensions are reference inputs, while the website's display sizes may be stylized.

| Planet | Diameter/radius ratio to Earth | Equatorial radius (km) | Polar radius (km) | Obliquity to orbit (deg, J2000) |
| --- | ---: | ---: | ---: | ---: |
| Mercury | 0.383 | 2,440.5 | 2,438.3 | 0.034 |
| Venus | 0.949 | 6,051.8 | 6,051.8 | 177.36 |
| Mars | 0.532 | 3,396.2 | 3,376.2 | 25.19 |
| Jupiter | 11.21 | 71,492 | 66,854 | 3.13 |
| Saturn | 9.45 | 60,268 | 54,364 | 26.73 |
| Uranus | 4.01 | 25,559 | 24,973 | 97.77 |
| Neptune | 3.88 | 24,764 | 24,341 | 28.32 |

Primary references: [NASA NSSDC Earth-ratio table](https://nssdc.gsfc.nasa.gov/planetary/factsheet/planet_table_ratio.html), [fact-sheet parameter notes](https://nssdc.gsfc.nasa.gov/planetary/factsheet/fact_notes.html), and the [individual planet fact sheets](https://nssdc.gsfc.nasa.gov/planetary/planetfact.html). The ratio table was last updated 2025-03-18. The notes define obliquity to orbit as the angle between the equator and orbital plane at J2000. Relevant individual entries: [Mercury](https://nssdc.gsfc.nasa.gov/planetary/factsheet/mercuryfact.html), [Venus](https://nssdc.gsfc.nasa.gov/planetary/factsheet/venusfact.html), [Mars](https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html), [Jupiter](https://nssdc.gsfc.nasa.gov/planetary/factsheet/jupiterfact.html), [Saturn](https://nssdc.gsfc.nasa.gov/planetary/factsheet/saturnfact.html), [Uranus](https://nssdc.gsfc.nasa.gov/planetary/factsheet/uranusfact.html), [Neptune](https://nssdc.gsfc.nasa.gov/planetary/factsheet/neptunefact.html).

## Saturn rings

NASA NSSDC's [Saturnian Rings Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/satringfact.html) gives the inner/outer edges in Saturn equatorial radii. The principal radial landmarks are: D 1.110–1.236, C 1.239–1.526, B 1.526–1.950, Cassini Division about 1.950–2.030, A 2.030–2.270, and F near 2.320–2.328. The A/B gap is roughly 4,800 km (NASA rounds it to 4,700 km). Encke and Keeler gaps lie inside ring A near 2.214 and 2.265 Saturn radii. The faint G and E rings extend much farther; NSSDC lists the E ring's outer edge at 7.964 Saturn radii. NASA's [Cassini FAQ](https://science.nasa.gov/mission/cassini/faq/) places the F-ring outer edge at about 140,270 km from Saturn's center. NASA's general [Saturn facts page](https://science.nasa.gov/saturn/facts/) describes the full faint ring system as reaching about 282,000 km from the planet; these figures describe different boundaries and levels of faint outer material.

The Blender model authors the D/C/B/A/F annuli with separate A-ring sub-bands and omits the G/E rings because they are diffuse and require a very large display extent. Its code comment says Cassini, Encke, and Keeler gaps are excluded, but its A bands leave the main Cassini gap; the thin Encke/Keeler features are approximated by narrow A-band separations. The model remains an illustrative rendering, not a complete measured ring system.

## Planet texture files currently staged

The website's active planetary maps and Saturn ring strip are from [Solar System Scope's texture collection](https://www.solarsystemscope.com/textures/) under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The project records the specific downloads, dimensions, hashes, and the provider's attribution requirement in [`work/site/assets/planets/manifest.json`](../assets/planets/manifest.json). Required credit: “Planet and space textures from Solar System Scope (https://www.solarsystemscope.com/textures/), licensed under CC BY 4.0.”

These are existing illustrative maps, not primary measurement products. Solar System Scope says its maps are equirectangular and based on NASA imagery/elevation data, with some unmapped areas filled using fictional terrain and colors adjusted/saturated. That limitation matters most for the outer planets and for any claim that a texture encodes mapped terrain. The Venus map represents clouds, not the radar-mapped solid surface. The Saturn ring PNG is a narrow alpha strip for radial shading, not a photograph.

### Additional retrieved NASA/JPL reference rasters

These are extra comparison assets and are not yet wired into the generator or substituted for the staged CC BY maps.

| Local file | Source and source credit | Retrieval and use notes |
| --- | --- | --- |
| `references/mercury_messenger_hypercolor_raw.png` | [NASA GSFC SVS Hypercolor Mosaic](https://svs.gsfc.nasa.gov/11197/), source file [Image1_rawpng.png](https://svs.gsfc.nasa.gov/vis/a010000/a011100/a011197/Image1_rawpng.png). Credit: NASA Goddard Space Flight Center; imagery/visualization courtesy NASA/JHU APL/Carnegie Institution of Washington. | Retrieved 2026-10-07; 6,132×3,066 RGBA PNG, about 21 MB. NASA describes the mosaic as a global map and says its enhanced-color filters reveal compositional differences, not Mercury's naked-eye appearance. Image itself is visibly grayscale in the supplied raster. It has a near-2:1 map layout, but the SVS page does not state the projection; polar margins and small mosaic gaps are visible. Verify UV orientation, seam, and coverage before production use. It is albedo imagery, not a DEM. |
| `references/mercury_messenger_map_2k.png` | 2,048×1,024 downsample of the NASA raster above. | Retrieved derivative; simple proportional downsample with macOS sips, no color grading or terrain processing. SHA-256: `8d3d1700678c402fb7bf30ebd77d1422293c85c6ca4fde5b4c398bb3ad3cc5ff`. This is a convenient candidate for comparison, not an integrated scene texture. |
| `references/mars_viking_jpl_1k.jpg` | [NASA/JPL Solar System Simulator Mars texture page](https://space.jpl.nasa.gov/tmaps/mars.html); direct raster [mar0kuu2.jpg](https://space.jpl.nasa.gov/tmaps/pix/mar0kuu2.jpg). Page lists Viking as the data source and Caltech/JPL/USGS as creator/owner. | Retrieved 2026-10-07; 1,440×720 JPEG (catalogued as 4 pixels/degree, about 150 KB). JPL says it is from Viking images processed at USGS. The global 2:1 layout makes it a useful low-resolution map comparison; the catalog does not specify projection, so confirm its alignment before use. Polar cap margins are visible. SHA-256: `0f9a3faf586ac857623660504e63dd3e2b8358203d8d0c32c27c5fe1585548c6`. |

A higher-resolution candidate, the [USGS Mars Viking Global Color Mosaic 925m](https://astrogeology.usgs.gov/search/map/mars_viking_global_color_mosaic_925m), is 23,059×11,530 Simple Cylindrical GeoTIFF (about 764 MB). No full-resolution file was downloaded; direct USGS product-page access returned HTTP 403 in this retrieval session. USGS's [Mars Viking Global Products](https://astrogeology.usgs.gov/search/map/mars-viking-global-products) also lists 232 m/pixel products. NASA Trek exposes Mars and Mercury global equirectangular tile services; use its [Mars Trek API docs](https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars) and [Mercury Trek API docs](https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mercury) if assembling a higher-resolution map later.

### Color and visual references for other planets

- **Mercury:** NASA's [MESSENGER Hypercolor page](https://svs.gsfc.nasa.gov/11197/) says its special filters emphasize chemical, mineralogical, and geological variation; use a monochrome or restrained material treatment for a naturalistic visible-color impression. The local raster above is treated as a measured image mosaic, not a height field.
- **Venus:** NASA/JPL's [Mariner 10 visible-light view](https://science.nasa.gov/photojournal/venus-from-mariner-10/) is a pale, creamy cloud-deck disk reference. It is not a map texture. For an opaque Venus globe, keep the cloud deck cream-colored and use soft low-contrast cloud variations; do not present Magellan radar colors as visible cloud color.
- **Mars:** The JPL Viking map above is a global albedo/color reference. The [USGS 925m global color mosaic](https://astrogeology.usgs.gov/search/map/mars_viking_global_color_mosaic_925m) is the better georeferenced Simple Cylindrical option if downloaded and converted later. Keep height/bump separate; color mosaics are not DEMs.
- **Jupiter:** NASA/JPL's [JunoCam “Jupiter Marble” image](https://science.nasa.gov/photojournal/jupiter-marble/) is a localized oblique image processed by a citizen scientist and released with CC BY attribution; the [Galileo Great Red Spot image](https://science.nasa.gov/photojournal/jupiters-great-red-spot/) is another disk view. Neither is a global equirectangular map; use as appearance cues for belts and the Great Red Spot, or author cloud bands procedurally.
- **Saturn:** NASA's [Cassini full sweep of the rings](https://science.nasa.gov/photojournal/a-full-sweep-of-saturns-rings/) and [view through the rings](https://science.nasa.gov/photojournal/looking-through-the-rings/) are observational appearance references, not radial textures or equirectangular planet maps.
- **Uranus:** The NSSDC [Voyager 2 Uranus gallery](https://nssdc.gsfc.nasa.gov/planetary/uranus/) and NASA Voyager images are disk references. Voyager-era visible images show a subdued cyan disk; the currently staged Solar System Scope map is an illustrative cloud map.
- **Neptune:** NASA NSSDC and [JPL's Voyager image archive](https://photojournal.jpl.nasa.gov/catalog/PIA02210) distinguish the eye-like natural-color presentation from contrast-enhanced/filter-composite views that expose cloud structure. Prefer the natural-color view for color identity; treat enhanced blue/false-color renderings as scientific visualization, not true color. These are disk images, not global equirectangular textures.

## Interstellar: artistic direction only

These references can guide scale, contrast, camera framing, and motion; they do not establish planetary science or the physical accuracy of the TRICORE models.

- [ASC's van Hoytema/Dan Sasaki discussion](https://theasc.com/news/dunkirk-discussion-at-asc-clubhouse-with-van-hoytema-and-sasaki/) says the camera approach on *Dunkirk* extended their *Interstellar* collaboration and describes less-prescribed, reactive/documentary camera work and subjective movement. Apply that as an optional camera-language reference, not a literal requirement for planet turns.
- [DNEG's account of Interstellar's gravitational renderer](https://www.dneg.com/news/gravitational-lensing-by-spinning-black-holes) and the open technical paper [James et al. (2015)](https://doi.org/10.1088/0264-9381/32/6/065001) explain that the black-hole visuals were produced with DNGR and ray-bundle propagation in curved spacetime. This is specifically a black-hole lensing reference, not a general-lighting recipe for planets. Use the film only for composition, light falloff, and reveal pacing; the model's solar lighting should remain independently grounded in direct illumination.
