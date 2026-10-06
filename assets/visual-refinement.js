/* TRICORE visual layer. Existing application state and event handlers are retained.
 * Planet maps: Solar System Scope / INOVE, CC BY 4.0. See planets/manifest.json.
 */
export function createVisualRefinement(api) {
  const { React: R, jsx: j, useFrame, useThree, Canvas, Line, Vector3, Quaternion,
    TextureLoader, BufferGeometry, Float32BufferAttribute, SRGBColorSpace,
    DoubleSide, state, cameraState, agentMeshes, agents, assetPath, fallbackTextures, TicketForm } = api;
  const bodies = {
    mercury: { file: '2k_mercury.jpg', position: [-2.35, 1.55, -.6], scale: .58, period: 1420, tilt: .02 },
    forge: { file: '2k_venus_atmosphere.jpg', position: [-.38,-.95,.4], scale: .97, period: 1800, tilt: .05 },
    recon: { file: '2k_mars.jpg', position: [-2.62,-.7,.1], scale: .76, period: 2100, tilt: .44 },
    warden: { file: '2k_jupiter.jpg', position: [-1.35,.22,.85], scale: 1.52, period: 2500, tilt: .06 },
    saturn: { file: '2k_saturn.jpg', position: [.85,1.2,.7], scale: 1.36, period: 3100, tilt: .46 },
    uranus: { file: '2k_uranus.jpg', position: [0,2.4,-1.3], scale: .86, period: 3700, tilt: 1.7 },
    neptune: { file: '2k_neptune.jpg', position: [2.24,2.38,-1.8], scale: .84, period: 4300, tilt: .49 }
  };
  const sun = new Vector3(-.65, .42, .9).normalize();
  const sceneClock = { time: 0 };
  const interaction = { labelHover: null, exploredAgent: null };
  const phaseFor = id => Object.keys(bodies).indexOf(id) * .87;
  const orbitPhase = { mercury: 165, warden: 216, recon: 267, forge: 318, saturn: 9, neptune: 60, uranus: 111 };
  const choreography = { last: null, from: 'mercury', to: 'recon' };
  const presentation = { kind: 'hero', agent: null, mobile: false };
  const sequenceAgents = [['recon','mercury'],['uranus','recon','mercury'],['neptune','uranus','mercury'],['warden','saturn','mercury'],['forge','saturn','mercury'],['saturn',...Object.keys(bodies).filter(id=>id!=='saturn')]];
  const constellationVisible = () => presentation.kind === 'hero' || presentation.kind === 'sequence';
  function updatePresentation(root, onChange) {
    if (!root) return;
    const mobile = window.innerWidth <= 768;
    const height = window.innerHeight;
    const section = document.getElementById('agent-focus');
    const rect = section?.getBoundingClientRect();
    const data = state.getState();
    let kind = 'hidden', agent = null, mobileTop = null;
    if (rect && rect.top < height * .4 && rect.bottom > height * .45) {
      const blocks = Array.from(section.querySelectorAll('.focus-block'));
      if (blocks.length) {
        const block = blocks.reduce((best, node, index) => {
          const bounds = node.getBoundingClientRect();
          const score = Math.abs(bounds.top + Math.min(bounds.height, mobile ? 340 : height) * .5 - height * .48);
          return !best || score < best.score ? { node, index, score, bounds } : best;
        }, null);
        kind = 'focus';
        agent = agents[block.index]?.id || agents[0].id;
        if (mobile) mobileTop = window.scrollY + block.bounds.top + 44;
      } else if (rect.top <= 96) {
        kind = 'focus';
        agent = cameraState.stageFocus || data.focusAgent || agents[0].id;
      }
    }
    const sequence = document.querySelector('[aria-label="Incident choreography"]');
    const sequenceRect = sequence?.getBoundingClientRect();
    if (kind !== 'focus' && sequenceRect && sequenceRect.top < height * .4 && sequenceRect.bottom > height * .55) {
      kind = 'sequence';
      agent = sequenceAgents[Math.max(0, Math.min(5, data.phase))][0];
      if (mobile) {
        const block = Array.from(sequence.querySelectorAll('.choreo-block')).find(node => { const bounds = node.getBoundingClientRect(); return bounds.top < height * .5 && bounds.bottom > height * .35; });
        if (block) mobileTop = window.scrollY + block.getBoundingClientRect().top + block.offsetHeight - 318;
      }
    }
    const hero = document.querySelector('[aria-label="Live incident — command center"]');
    const heroBounds = hero?.getBoundingClientRect();
    if (kind === 'hidden' && heroBounds?.bottom > height * .35) kind = 'hero';
    const heroRail = hero?.querySelector('.hero-rail');
    // Keep the instrument opaque. A fading panel allowed the planets behind it
    // to show through while the fixed scene stayed on screen during scrolling.
    if (heroRail) {
      if (kind !== 'hero' || data.tourActive || !data.focusAgent) interaction.exploredAgent = null;
      const selectedName = agents.find(item => item.id === interaction.exploredAgent)?.codename;
      const loadedName = heroRail.querySelector('h2')?.textContent.trim();
      const open = kind === 'hero' && !data.tourActive && !!selectedName && loadedName === selectedName && data.focusAgent === interaction.exploredAgent;
      heroRail.dataset.detailOpen = String(open);
      heroRail.style.setProperty('--tri-rail-opacity', open ? '1' : '0');
      heroRail.style.setProperty('--tri-panel-height', `${heroRail.offsetHeight}px`);
      heroRail.style.visibility = open ? 'visible' : 'hidden';
      heroRail.style.pointerEvents = open ? '' : 'none';
    }
    if (hero) {
      const tour = hero.querySelector('[code-path="src/components/home/HeroSection.tsx:580:11"]');
      const actions = hero.querySelector('[code-path="src/components/home/HeroSection.tsx:360:11"]');
      const actionsBounds = actions?.getBoundingClientRect();
      const actionBottom = actionsBounds ? actionsBounds.bottom - heroBounds.top : 520;
      const tourTop = Math.round(actionBottom + 24);
      const tourHeight = tour?.offsetHeight || 0;
      // The tour belongs below the CTA row, rather than floating over it.
      const set = (node, property, value) => { if (node.style.getPropertyValue(property) !== value) node.style.setProperty(property, value); };
      set(hero, '--tri-tour-top', `${tourTop}px`);
      set(hero, '--tri-tour-left', `${Math.round(heroBounds.width * .59)}px`);
      set(hero, '--tri-tour-min-height', tour ? `${Math.ceil(tourTop + tourHeight + 140)}px` : '0px');
      set(root, '--tri-tour-scene-height', `${Math.max(360, tourTop - 112)}px`);
      root.dataset.touring = String(!!tour);
      root.dataset.exploring = String(heroRail?.dataset.detailOpen === 'true');
      const mobileSceneTop = mobile ? Math.ceil(Math.max(530, actionBottom + 64, tour ? tourTop + tourHeight + 30 : 0)) : 530;
      set(root, '--tri-mobile-scene-top', `${mobileSceneTop}px`);
      set(hero, '--tri-mobile-extra', `${Math.max(0, mobileSceneTop - 530)}px`);
      hero.dataset.touring = String(!!tour);
    }
    const key = `${kind}:${agent}:${mobile}`;
    presentation.kind = kind; presentation.agent = agent; presentation.mobile = mobile;
    root.dataset.sceneMode = kind;
    root.dataset.activeAgent = agent || '';
    if (mobileTop !== null) root.style.top = `${mobileTop}px`;
    else root.style.removeProperty('top');
    if (root.dataset.presentationKey !== key) {
      root.dataset.presentationKey = key;
      onChange({ kind, agent, mobile });
    }
  }
  function Presentation({ root, onChange }) {
    useFrame(() => updatePresentation(root.current, onChange));
    return null;
  }
  function Universe() {
    useFrame((_, delta) => {
      const data = state.getState();
      if (data.tourActive && data.focusAgent !== choreography.last) {
        choreography.from = choreography.last || 'mercury';
        choreography.to = data.focusAgent || 'mercury';
        if (choreography.from === choreography.to) choreography.to = 'recon';
        choreography.last = data.focusAgent;
      } else if (!data.tourActive) choreography.last = null;
      if (data.motion !== 'full' || presentation.kind === 'hidden') return;
      sceneClock.time += Math.min(delta, .05);
      const t = sceneClock.time;
      sun.set(-.65 + Math.sin(t * .065) * .07, .42 + Math.sin(t * .09) * .055,
        .9 + Math.sin(t * .045) * .07).normalize();
    });
    return null;
  }
  const center = new Vector3(0, .35, -.85);
  // Shared, gently tilted orbit. Fixed phase spacing keeps the constellation
  // connected and avoids planet intersections through a complete revolution.
  const positionAt = (id, angle, out = new Vector3()) => {
    const a = angle + (orbitPhase[id] || 0) * Math.PI / 180;
    return out.set(center.x + Math.cos(a) * 2.9, center.y + Math.sin(a) * 2.22,
      center.z + Math.sin(a) * .58 + Math.cos(a) * .16);
  };
  const textures = new Map();
  let loading;
  function loadTextures() {
    if (!loading) {
      const loader = new TextureLoader();
      loading = Promise.all([...Object.values(bodies).map(body => body.file), '2k_saturn_ring_alpha.png'].map(file =>
        new Promise(resolve => loader.load(assetPath('assets/planets/' + file), texture => {
          texture.colorSpace = SRGBColorSpace;
          texture.anisotropy = 4;
          textures.set(file, texture);
          resolve();
        }, undefined, () => resolve()))));
    }
    return loading;
  }
  const vertex = `
    varying vec2 vUv;
    varying vec3 vNormalWorld;
    varying vec3 vPositionWorld;
    varying vec3 vLocal;
    void main() {
      vUv = uv;
      vLocal = position;
      vec4 world = modelMatrix * vec4(position, 1.0);
      vPositionWorld = world.xyz;
      vNormalWorld = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * viewMatrix * world;
    }
  `;
  const planetFragment = `
    uniform sampler2D uMap;
    uniform sampler2D uRingMap;
    uniform vec3 uSun;
    uniform vec3 uSunLocal;
    uniform vec3 uAtmosphere;
    uniform float uRelief;
    uniform float uSheen;
    uniform float uHover;
    uniform bool uHasRings;
    varying vec2 vUv;
    varying vec3 vNormalWorld;
    varying vec3 vPositionWorld;
    varying vec3 vLocal;
    void main() {
      vec3 normal = normalize(vNormalWorld);
      vec3 albedo = texture2D(uMap, vUv).rgb;
      // Linear-light calibration, before the restrained photographic finish.
      float luminance = dot(albedo, vec3(.2126, .7152, .0722));
      albedo = mix(vec3(luminance), albedo, .9);
      // Restrained texture-derived surface relief on the two rocky worlds.
      vec3 dx = dFdx(vPositionWorld), dy = dFdy(vPositionWorld);
      vec3 rx = cross(dy, normal), ry = cross(normal, dx);
      float determinant = dot(dx, rx);
      float relief = luminance * uRelief;
      vec3 gradient = sign(determinant) * (dFdx(relief) * rx + dFdy(relief) * ry);
      normal = normalize(abs(determinant) * normal - gradient);
      float ndl = dot(normal, uSun);
      float daylight = max(ndl, 0.0) * smoothstep(-.025, .04, ndl);
      float shadow = 1.0;
      if (uHasRings && abs(uSunLocal.y) > .001) {
        float t = -vLocal.y / uSunLocal.y;
        vec3 hit = vLocal + uSunLocal * t;
        float radial = length(hit.xz);
        if (t > 0.0 && radial > .62 && radial < 1.15) {
          float alpha = texture2D(uRingMap, vec2((radial - .62) / .53, .5)).a;
          shadow = 1.0 - alpha * .78;
        }
      }
      vec3 color = albedo * (.115 + .035 * (normal.y * .5 + .5) + daylight * 1.05 * shadow + uHover * .20);
      vec3 view = normalize(cameraPosition - vPositionWorld);
      float softReflection = pow(max(dot(normal, normalize(uSun + view)), 0.0), 24.0);
      color += vec3(.92, .96, 1.0) * softReflection * uSheen * (1.0 + uHover * .7) * daylight * shadow;
      color += albedo * daylight * shadow * uHover * .075;
      float edge = pow(1.0 - max(dot(normal, view), 0.0), 5.0);
      color += uAtmosphere * edge * smoothstep(-.05, .25, ndl);
      color += vec3(.035,.045,.05) * pow(edge,.6) * smoothstep(-.05,.25,ndl) * uHover;
      gl_FragColor = vec4(color, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `;
  const ringFragment = `
    uniform sampler2D uMap;
    uniform vec3 uSun;
    uniform vec3 uPlanetCenter;
    uniform float uPlanetRadius;
    varying vec3 vNormalWorld;
    varying vec3 vPositionWorld;
    varying vec3 vLocal;
    void main() {
      float radius = length(vLocal.xy);
      float radial = clamp((radius - .62) / .53, 0.0, 1.0);
      vec4 band = texture2D(uMap, vec2(radial, .5));
      float edge = smoothstep(0.0, .005, radial) * (1.0 - smoothstep(.995, 1.0, radial));
      float alpha = band.a * edge;
      if (alpha < .008) discard;
      // Ray-sphere intersection: Saturn casts its shadow onto the ring plane.
      vec3 oc = vPositionWorld - uPlanetCenter;
      float along = dot(oc, uSun);
      float perpendicular = length(oc - uSun * along);
      float shadow = along < 0.0 ? smoothstep(uPlanetRadius * .94, uPlanetRadius * 1.05, perpendicular) : 1.0;
      float incidence = abs(dot(normalize(vNormalWorld), uSun));
      vec3 tint = mix(vec3(.48, .43, .36), vec3(.86, .82, .73), radial);
      float density = dot(band.rgb, vec3(.2126, .7152, .0722));
      vec3 color = tint * (.55 + density * .72) * (.18 + incidence * 1.48 * shadow);
      gl_FragColor = vec4(color, alpha * .91);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `;
  function Planet({ id, mode = 'scene' }) {
    const body = bodies[id];
    const root = R.useRef();
    const sphere = R.useRef();
    const ring = R.useRef();
    const spin = R.useRef(0);
    const response = R.useRef(0);
    const inclination = R.useRef();
    const work = R.useMemo(() => ({ quaternion: new Quaternion(), scale: new Vector3(), localSun: sun.clone(), center: new Vector3() }), []);
    const material = R.useMemo(() => ({
      uMap: { value: textures.get(body.file) || fallbackTextures[id]() },
      uRingMap: { value: textures.get('2k_saturn_ring_alpha.png') || fallbackTextures.saturn() },
      uSun: { value: sun.clone() }, uSunLocal: { value: sun.clone() },
      uAtmosphere: { value: new Vector3(...({ mercury: [0,0,0], recon: [.03,.012,.004], forge: [.03,.025,.014], warden: [.015,.017,.023], saturn: [.016,.017,.02], uranus: [.02,.043,.05], neptune: [.013,.023,.048] }[id])) },
      uRelief: { value: id === 'mercury' ? .012 : id === 'recon' ? .008 : 0 },
      uSheen: { value: id === 'mercury' || id === 'recon' ? .006 : .022 },
      uHover: { value: 0 },
      uHasRings: { value: id === 'saturn' }
    }), [id]);
    const ringUniforms = R.useMemo(() => ({
      uMap: { value: textures.get('2k_saturn_ring_alpha.png') || fallbackTextures.saturn() },
      uSun: { value: material.uSun.value }, uPlanetCenter: { value: new Vector3() }, uPlanetRadius: { value: .5 }
    }), []);
    R.useEffect(() => { loadTextures().then(() => {
      if (textures.has(body.file)) material.uMap.value = textures.get(body.file);
      if (textures.has('2k_saturn_ring_alpha.png')) {
        material.uRingMap.value = textures.get('2k_saturn_ring_alpha.png');
        ringUniforms.uMap.value = textures.get('2k_saturn_ring_alpha.png');
      }
    }); }, [id]);
    useFrame((_, delta) => {
      if (!root.current) return;
      const data = state.getState();
      const hoverTarget = data.hoverAgent === id ? 1 : 0;
      response.current += (hoverTarget - response.current) * (data.motion === 'reduced' ? 1 : 1 - Math.exp(-Math.min(delta,.05) / (hoverTarget ? .18 : .38)));
      material.uHover.value = response.current;
      material.uSun.value.copy(sun);
      material.uSun.value.y += response.current * .11;
      material.uSun.value.z += response.current * .6;
      material.uSun.value.normalize();
      if (data.motion === 'full' && presentation.kind !== 'hidden') {
        spin.current += Math.min(delta, .05) * (id === 'mercury' ? .14 : id === 'forge' ? .095 : .12) * (1 + response.current * 2.4);
        root.current.rotation.y = spin.current;
        if (inclination.current) inclination.current.rotation.z = body.tilt + .018 * (Math.sin(sceneClock.time * .12 + phaseFor(id)) - Math.sin(phaseFor(id)));
      }
      root.current.getWorldQuaternion(work.quaternion);
      material.uSunLocal.value.copy(material.uSun.value).applyQuaternion(work.quaternion.invert());
      root.current.getWorldPosition(ringUniforms.uPlanetCenter.value);
      root.current.getWorldScale(work.scale);
      ringUniforms.uPlanetRadius.value = .5 * work.scale.x;
    });
    return j('group', { ref: inclination, rotation: [0, 0, body.tilt], children: j('group', { ref: root, children: [
      j('mesh', { ref: sphere, children: [
        j('sphereGeometry', { args: [.5, 96, 64] }),
        j('shaderMaterial', { uniforms: material, vertexShader: vertex, fragmentShader: planetFragment, depthWrite: true, depthTest: true, transparent: false })
      ] }),
      id === 'saturn' ? j('mesh', { ref: ring, rotation: [-Math.PI / 2, 0, 0], children: [
        j('ringGeometry', { args: [.62, 1.15, 256, 64] }),
        j('shaderMaterial', { uniforms: ringUniforms, vertexShader: vertex, fragmentShader: ringFragment, side: DoubleSide, transparent: true, depthTest: true, depthWrite: false, toneMapped: true })
      ] }) : null
    ] }) });
  }
  function OrbitAgent({ id, children }) {
    const planet = R.useRef();
    const halo = R.useRef();
    const response = R.useRef(0);
    R.useEffect(() => {
      const object = planet.current;
      if (!object) return;
      object.userData.agentId = id;
      agentMeshes.push(object);
      return () => { const i = agentMeshes.indexOf(object); if (i >= 0) agentMeshes.splice(i, 1); };
    }, [id]);
    useFrame((_, delta) => {
      if (!planet.current) return;
      const data = state.getState();
      const hoverTarget = data.hoverAgent === id ? 1 : 0;
      response.current += (hoverTarget - response.current) * (data.motion === 'reduced' ? 1 : 1 - Math.exp(-Math.min(delta,.05) / (hoverTarget ? .18 : .38)));
      planet.current.scale.setScalar(bodies[id].scale * (1 + response.current * (id === 'saturn' ? .045 : .065)));
      positionAt(id, sceneClock.time * .028, planet.current.position);
      const focus = presentation.kind === 'focus' || presentation.kind === 'sequence' ? presentation.agent : data.focusAgent;
      planet.current.visible = constellationVisible() || presentation.kind === 'focus' && focus === id;
      if (halo.current) {
        halo.current.visible = constellationVisible() && (data.hoverAgent === id || data.tourActive && focus === id || presentation.kind === 'sequence' && sequenceAgents[data.phase]?.includes(id));
        halo.current.material.opacity = data.hoverAgent === id ? .7 : .45;
      }
    });
    return j(R.Fragment, { children: [
      j('group', { ref: planet, position: bodies[id].position, scale: bodies[id].scale, children: [children,
        j('mesh', { ref: halo, visible: false, children: [j('ringGeometry', { args: [id === 'saturn' ? 1.22 : .61, id === 'saturn' ? 1.227 : .617, 128] }),
          j('meshBasicMaterial', { color: '#8ed9bb', transparent: true, depthWrite: false, side: DoubleSide, opacity: .45 })] })] })
    ] });
  }
  const pairs = [['mercury', 'recon'], ['recon', 'uranus'], ['uranus', 'neptune'], ['neptune', 'warden'], ['warden', 'saturn'], ['saturn', 'forge'], ['forge', 'mercury']];
  function OrbitalGuide() {
    const group = R.useRef();
    const points = R.useMemo(() => Array.from({ length: 257 }, (_, i) => positionAt('mercury', i / 256 * Math.PI * 2)), []);
    useFrame(() => { if (group.current) group.current.visible = constellationVisible(); });
    return j('group', { ref: group, children: [
      j(Line, { points, lineWidth: 1, color: '#729c93', opacity: .28, transparent: true, depthWrite: false, toneMapped: false }),
      j('mesh', { position: center, children: [j('sphereGeometry', { args: [.045, 16, 12] }), j('meshBasicMaterial', { color: '#9de2c6', transparent: true, opacity: .7 })] }),
      j('mesh', { position: center, children: [j('ringGeometry', { args: [.14, .145, 80] }), j('meshBasicMaterial', { color: '#75b99d', transparent: true, side: DoubleSide, opacity: .45, depthWrite: false })] })
    ] });
  }
  function CommunicationEdge({ fromId, toId, index }) {
    const line = R.useRef();
    const particles = R.useRef([]);
    const curve = R.useMemo(() => ({ a: new Vector3(), b: new Vector3(), mid: new Vector3(), p: new Vector3(), direction: new Vector3(), points: new Float32Array(49 * 3) }), []);
    const initial = R.useMemo(() => Array.from({ length: 49 }, () => new Vector3()), []);
    useFrame(() => {
      const data = state.getState();
      const visible = constellationVisible();
      if (line.current) line.current.visible = visible;
      if (!visible || !line.current) { particles.current.forEach(node => { if (node) node.visible = false; }); return; }
      const from = agentMeshes.find(mesh => mesh.userData.agentId === fromId);
      const to = agentMeshes.find(mesh => mesh.userData.agentId === toId);
      if (!from || !to) return;
      const active = presentation.kind === 'sequence'
        ? data.phase === 5 || sequenceAgents[data.phase]?.includes(fromId) && sequenceAgents[data.phase]?.includes(toId)
        : data.tourActive
        ? data.phase === 5 || choreography.from === fromId && choreography.to === toId
        : index === Math.min(6, Math.max(0, data.phase + 1));
      if (line.current.material) line.current.material.opacity = active ? .6 : .16;
      from.getWorldPosition(curve.a); to.getWorldPosition(curve.b);
      curve.direction.copy(curve.b).sub(curve.a).normalize();
      curve.a.addScaledVector(curve.direction, bodies[fromId].scale * .55);
      curve.b.addScaledVector(curve.direction, -bodies[toId].scale * .55);
      curve.mid.copy(curve.a).lerp(curve.b, .5).lerp(center, .18);
      curve.mid.z += .12;
      const point = t => curve.p.copy(curve.a).multiplyScalar((1-t)*(1-t)).addScaledVector(curve.mid, 2*t*(1-t)).addScaledVector(curve.b, t*t);
      for (let i = 0; i < 49; i++) point(i / 48).toArray(curve.points, i * 3);
      line.current.geometry.setPositions(curve.points);
      particles.current.forEach((node, i) => {
        if (!node) return;
        node.visible = data.motion === 'full';
        const progress = (sceneClock.time * (active ? .38 : .13) + index * .17 + i * .055) % 1;
        node.position.copy(point(progress));
        node.material.opacity = (active ? .9 : .32) * (1-i*.2) * Math.sin(progress*Math.PI);
      });
    });
    return j('group', { children: [
      j(Line, { ref: line, points: initial, color: '#83c5ab', lineWidth: 1.05, opacity: .16, transparent: true, depthWrite: false, depthTest: true, toneMapped: false }),
      ...[0,1,2].map(i => j('mesh', { ref: node => { particles.current[i] = node; }, visible: false, children: [
        j('sphereGeometry', { args: [.033-i*.005, 10, 8] }), j('meshBasicMaterial', { color: '#b2f0d8', transparent: true, depthWrite: false, opacity: .8 })
      ] }, i))
    ] });
  }
  function Communications() {
    return j(R.Fragment, { children: pairs.map(([fromId, toId], index) => j(CommunicationEdge, { fromId, toId, index }, fromId)) });
  }
  function Stars() {
    const material = R.useMemo(() => ({ uTime: { value: 0 } }), []);
    const geometry = R.useMemo(() => {
      const points = new Float32Array(640 * 3);
      const sizes = new Float32Array(640), phases = new Float32Array(640);
      let seed = 97;
      const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let i = 0; i < 640; i++) {
        points[i*3] = (random() - .5) * 30; points[i*3+1] = (random() - .35) * 20; points[i*3+2] = -4 - random() * 18;
        sizes[i] = random(); phases[i] = random() * Math.PI * 2;
      }
      const result = new BufferGeometry();
      result.setAttribute('position', new Float32BufferAttribute(points, 3));
      result.setAttribute('aSize', new Float32BufferAttribute(sizes, 1));
      result.setAttribute('aPhase', new Float32BufferAttribute(phases, 1));
      return result;
    }, []);
    useFrame(() => { material.uTime.value = sceneClock.time; });
    R.useEffect(() => () => geometry.dispose(), [geometry]);
    return j('points', { geometry, children: j('shaderMaterial', {
      uniforms: material, transparent: true, depthWrite: false,
      vertexShader: `uniform float uTime; attribute float aSize; attribute float aPhase; varying float vAlpha; varying float vWarm;
        void main(){
          vec3 p=position;
          p.x+=sin(uTime*.08+position.y*.17)*.3;
          p.y+=cos(uTime*.06+position.x*.13)*.12;
          vec4 mv=modelViewMatrix*vec4(p,1.0);
          gl_Position=projectionMatrix*mv;
          gl_PointSize=clamp((1.1+aSize*1.2)*22.0/-mv.z,1.0,2.8);
          vAlpha=(.2+aSize*.42)*(.78+.22*sin(uTime*.6+aPhase)); vWarm=aSize;
        }`,
      fragmentShader: `varying float vAlpha; varying float vWarm;
        void main(){float radius=length(gl_PointCoord-.5); float alpha=(1.0-smoothstep(.12,.5,radius))*vAlpha;
          gl_FragColor=vec4(mix(vec3(.65,.77,.9),vec3(.9,.82,.67),step(.91,vWarm)),alpha);}
        `
    }) });
  }
  function SpaceDust() {
    const uniforms = R.useMemo(() => ({ uTime: { value: 0 } }), []);
    useFrame(() => { uniforms.uTime.value = sceneClock.time; });
    return j('mesh', { position: [0,0,-23], renderOrder: -2, children: [
      j('planeGeometry', { args: [44,28] }),
      j('shaderMaterial', { uniforms, vertexShader: vertex, transparent: true, depthWrite: false,
        fragmentShader: `uniform float uTime; varying vec2 vUv;
          float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
          float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
            return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
          void main(){vec2 p=vUv*5.0+vec2(uTime*.012,-uTime*.005);
            float density=noise(p)*.65+noise(p*2.1)*.35;
            float filament=exp(-pow((vUv.y-.48-sin(vUv.x*5.0+uTime*.013)*.075)*6.0,2.0));
            float edge=smoothstep(0.0,.2,vUv.x)*(1.0-smoothstep(.8,1.0,vUv.x));
            vec3 tint=mix(vec3(.035,.06,.075),vec3(.09,.072,.045),density);
            gl_FragColor=vec4(tint,density*filament*edge*.36);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`
      })
    ] });
  }
  function Camera({ labels, root, cursor }) {
    const { camera, gl, raycaster, pointer, size } = useThree();
    const look = R.useRef(new Vector3(0, .65, -.4));
    const hover = R.useRef(null);
    const down = R.useRef(null);
    const inside = R.useRef(false);
    const drag = R.useRef({ azimuth: 0, elevation: 0 });
    const target = R.useMemo(() => new Vector3(), []);
    const goalLook = R.useMemo(() => new Vector3(), []);
    const offset = R.useMemo(() => new Vector3(), []);
    const yAxis = R.useMemo(() => new Vector3(0, 1, 0), []);
    const xAxis = R.useMemo(() => new Vector3(1, 0, 0), []);
    const world = R.useMemo(() => new Vector3(), []);
    const lastView = R.useRef('');
    const reveal = R.useRef(1);
    R.useEffect(() => {
      const canvas = gl.domElement;
      const start = event => { down.current = { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY }; };
      const move = event => {
        inside.current = event.pointerType !== 'touch';
        const d = down.current;
        if (!d) return;
        drag.current.azimuth = Math.max(-.45, Math.min(.45, drag.current.azimuth - (event.clientX-d.x)*.002));
        if (event.pointerType !== 'touch') drag.current.elevation = Math.max(-.2, Math.min(.2, drag.current.elevation - (event.clientY-d.y)*.0015));
        d.x = event.clientX; d.y = event.clientY;
      };
      const end = event => {
        down.current = null;
      };
      const cancel = () => { down.current = null; inside.current = false; };
      canvas.addEventListener('pointerdown', start);
      canvas.addEventListener('pointermove', move);
      canvas.addEventListener('pointerup', end);
      canvas.addEventListener('pointercancel', cancel);
      canvas.addEventListener('pointerleave', cancel);
      return () => { canvas.removeEventListener('pointerdown', start); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerup', end); canvas.removeEventListener('pointercancel', cancel); canvas.removeEventListener('pointerleave', cancel); };
    }, [gl]);
    useFrame((_, delta) => {
      const data = state.getState();
      const focus = presentation.kind === 'focus' || presentation.kind === 'sequence' ? presentation.agent : data.focusAgent;
      const object = agentMeshes.find(mesh => mesh.userData.agentId === focus);
      const isMobile = presentation.mobile;
      const smooth = data.motion === 'reduced' ? 1 : 1 - Math.exp(-Math.min(delta, .05) / (data.tourActive ? .72 : .58));
      const moduleFocus = presentation.kind === 'focus';
      const exploring = presentation.kind === 'hero' && !!focus && !data.tourActive && interaction.exploredAgent === focus;
      const actualAspect = (root.current?.clientWidth || size.width) / (root.current?.clientHeight || size.height);
      if (Math.abs(camera.aspect - actualAspect) > .001) { camera.aspect = actualAspect; camera.updateProjectionMatrix(); }
      if (object) {
        object.getWorldPosition(world);
        if (moduleFocus) {
          const distance = bodies[focus].scale * (focus === 'saturn' ? 4.7 : 2.65);
          target.copy(world).add(new Vector3(0, distance * .08, distance));
          goalLook.copy(world);
        } else if (exploring) {
          const distance = isMobile ? 8.6 : focus === 'saturn' ? 9.4 : 7.8;
          target.copy(world).add(new Vector3(0, .65, distance));
          goalLook.copy(world).add(new Vector3(isMobile ? 0 : 1.35, 0, 0));
        } else {
          // Dolly and pan through the shared system, rather than replacing
          // the scene with isolated planets at each tour step.
          goalLook.copy(center).lerp(world, .18);
          target.copy(goalLook).add(new Vector3(0, .55, isMobile ? 10.5 : 9.0));
        }
      } else {
        goalLook.copy(center);
        target.copy(center).add(new Vector3(0, .6, isMobile ? 11.5 : 10.5));
      }
      // Fit the entire constellation during orbit and phase travel, including
      // Saturn's rings. Panning must never crop a collaborating planet.
      if (constellationVisible() && !exploring) {
        const tangent = Math.tan(camera.fov * Math.PI / 360);
        let distance = target.z - goalLook.z;
        for (const mesh of agentMeshes) {
          const planetId = mesh.userData.agentId;
          mesh.getWorldPosition(world);
          const radius = bodies[planetId].scale * (planetId === 'saturn' ? 1.12 : .56);
          const horizontal = (Math.abs(world.x-goalLook.x)+radius+.3)/(tangent*actualAspect);
          const vertical = (Math.abs(world.y-goalLook.y)+radius+.45)/tangent;
          distance = Math.max(distance, horizontal+world.z-goalLook.z, vertical+world.z-goalLook.z);
        }
        target.copy(goalLook).add(new Vector3(0, .12, distance));
      }
      const t = sceneClock.time;
      offset.copy(target).sub(goalLook)
        .applyAxisAngle(yAxis, drag.current.azimuth + Math.sin(t * .09) * .018)
        .applyAxisAngle(xAxis, drag.current.elevation + Math.sin(t * .07) * .009);
      target.copy(goalLook).add(offset);
      const viewKey = presentation.kind;
      if (viewKey !== lastView.current) {
        // Scene and module have different viewports: never fly the camera
        // between them while the next panel is already entering the screen.
        camera.position.copy(target); look.current.copy(goalLook);
        reveal.current = data.motion === 'reduced' ? 1 : 0;
        lastView.current = viewKey;
      } else if (presentation.kind === 'focus') {
        camera.position.copy(target); look.current.copy(goalLook);
      } else {
        camera.position.lerp(target, smooth); look.current.lerp(goalLook, smooth);
      }
      reveal.current = Math.min(1, reveal.current + Math.min(delta,.05) / .22);
      root.current?.style.setProperty('--tri-camera-opacity', String(reveal.current));
      camera.lookAt(look.current);
      raycaster.setFromCamera(pointer, camera);
      const hits = inside.current ? raycaster.intersectObjects(agentMeshes.filter(mesh => mesh.visible), true) : [];
      let id = interaction.labelHover;
      if (hits.length) { let mesh = hits[0].object; while (mesh && !mesh.userData.agentId) mesh = mesh.parent; id = mesh?.userData.agentId || null; }
      if (id !== hover.current) { hover.current = id; data.setHoverAgent(id); }
      gl.domElement.style.cursor = id && inside.current ? 'none' : down.current ? 'grabbing' : 'grab';
      if (cursor.current) {
        cursor.current.style.opacity = id && inside.current ? '1' : '0';
        cursor.current.style.transform = `translate3d(${(pointer.x*.5+.5)*size.width}px,${(-pointer.y*.5+.5)*size.height}px,0)`;
      }
      const placed = [];
      const width = root.current?.clientWidth || size.width, height = root.current?.clientHeight || size.height;
      const projected = agents.map(agent => {
        const mesh = agentMeshes.find(item => item.userData.agentId === agent.id);
        const position = new Vector3();
        if (mesh) mesh.getWorldPosition(position);
        const ndc = position.clone().project(camera);
        const edge = position.clone().add(new Vector3(bodies[agent.id].scale * .56, 0, 0)).project(camera);
        const radius = Math.abs(edge.x - ndc.x) * width * .5;
        return { id: agent.id, x: (ndc.x*.5+.5)*width, y: (-ndc.y*.5+.5)*height, radius, rx: radius * (agent.id === 'saturn' ? 2.2 : 1), visible: !!mesh?.visible };
      });
      const core = center.clone().project(camera);
      const coreX = (core.x*.5+.5)*width, coreY = (-core.y*.5+.5)*height;
      for (const agent of agents) {
        const element = labels.current[agent.id];
        const mesh = agentMeshes.find(item => item.userData.agentId === agent.id);
        if (!element || !mesh) continue;
        mesh.getWorldPosition(world).project(camera);
        const visible = constellationVisible() && Math.abs(world.x) < .96 && Math.abs(world.y) < .96 && (!exploring || focus === agent.id);
        element.style.opacity = visible ? (data.tourActive && focus && focus !== agent.id ? '.65' : '1') : '0';
        element.style.pointerEvents = visible ? 'auto' : 'none';
        const planet = projected.find(item => item.id === agent.id);
        const lw = isMobile ? 86 : 110, lh = id === agent.id ? 58 : 34, gap = isMobile ? 5 : 9;
        const sides = [
          [planet.x-planet.rx-lw-gap, planet.y-18], [planet.x+planet.rx+gap, planet.y-18],
          [planet.x-lw*.5, planet.y-planet.radius-lh-gap], [planet.x-lw*.5, planet.y+planet.radius+gap]
        ];
        const dx = planet.x-coreX, dy = planet.y-coreY;
        const preferred = Math.abs(dx) > Math.abs(dy)*1.25 ? (dx < 0 ? 0 : 1) : (dy < 0 ? 2 : 3);
        let best = null;
        sides.forEach(([sx,sy], candidate) => {
          const x = Math.max(6, Math.min(width-lw-6,sx));
          const y = Math.max(6, Math.min(height-lh-28,sy));
          let score = candidate === preferred ? 0 : 5;
          for (const p of projected) if (p.visible) {
            const nx = Math.max(x, Math.min(p.x,x+lw))-p.x;
            const ny = Math.max(y, Math.min(p.y,y+lh))-p.y;
            if (nx*nx/(p.rx*p.rx)+ny*ny/(p.radius*p.radius) < 1.14) score += p.id === agent.id ? 2000 : 800;
          }
          for (const p of placed) if (x < p.x+lw && x+lw > p.x && y < p.y+p.h && y+lh > p.y) score += 400;
          if (!best || score < best.score) best = {x,y,h:lh,score};
        });
        const {x,y} = best;
        if (visible) placed.push(best);
        element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        element.dataset.selected = focus === agent.id ? 'true' : 'false';
        element.dataset.hovered = id === agent.id ? 'true' : 'false';
      }
    });
    return null;
  }
  function Reveal({ onReady }) {
    const frames = R.useRef(0);
    useFrame(() => { if (++frames.current === 3) onReady(); });
    return null;
  }
  function Stage() {
    const motion = state(data => data.motion);
    const [ready, setReady] = R.useState(false);
    const [visible, setVisible] = R.useState(false);
    const [failed, setFailed] = R.useState(false);
    const [hidden, setHidden] = R.useState(document.hidden);
    const [layout, setLayout] = R.useState({ kind: 'hero', agent: null, mobile: false });
    const root = R.useRef();
    const labels = R.useRef({});
    const cursor = R.useRef();
    R.useEffect(() => { loadTextures().then(() => setReady(true)); }, []);
    R.useEffect(() => {
      const update = () => setHidden(document.hidden);
      document.addEventListener('visibilitychange', update);
      return () => document.removeEventListener('visibilitychange', update);
    }, []);
    R.useEffect(() => {
      let frame;
      const update = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => updatePresentation(root.current, setLayout)); };
      update();
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
    }, []);
    R.useEffect(() => {
      const canvas = document.createElement('canvas');
      try { if (!(canvas.getContext('webgl2') || canvas.getContext('webgl'))) setFailed(true); } catch { setFailed(true); }
    }, []);
    const labelNames = { mercury: 'ROUTING', forge: 'REPAIR & PATCH', recon: 'RECONNAISSANCE', warden: 'CONTAINMENT', saturn: 'GOVERNANCE', uranus: 'ANOMALY DETECTION', neptune: 'THREAT FORENSICS' };
    return j('div', { ref: root, id: 'command-stage', className: 'tricore-stage', 'data-scene-mode': layout.kind, 'data-active-agent': layout.agent || '', children: [
      j('img', { className: 'tri-static-scene', src: assetPath('assets/scene-fallback.jpg'), alt: '', 'aria-hidden': true, style: { opacity: visible && !failed ? 0 : 1 } }),
      layout.agent ? j('div', { className: `tri-focus-fallback ${layout.agent === 'saturn' ? 'tri-fallback-saturn' : ''}`, 'aria-hidden': true, style: { visibility: visible && !failed ? 'hidden' : 'visible' }, children: j('div', { className: 'tri-fallback-sphere', style: { backgroundImage: `radial-gradient(circle at 28% 24%,transparent 24%,rgba(0,0,0,.78) 92%),url("${assetPath('assets/planets/' + bodies[layout.agent].file)}")` } }) }) : null,
      ready && !failed ? j(Canvas, { frameloop: hidden ? 'never' : 'always', dpr: [1, 1.5], camera: { fov: 38, near: .1, far: 45, position: [0, 2.2, 8.65] }, gl: { antialias: true, alpha: true, powerPreference: 'high-performance' }, style: { touchAction: 'pan-y' }, children: [
        j(Presentation, { root, onChange: setLayout }), j(Universe, {}), j(SpaceDust, {}), j(Stars, {}), j(OrbitalGuide, {}), ...agents.map(agent => j(OrbitAgent, { id: agent.id, children: j(Planet, { id: agent.id }) }, agent.id)),
        j(Communications, {}), j(Camera, { labels, root, cursor }), j(Reveal, { onReady: () => setVisible(true) })
      ] }) : null,
      j('button', { className: 'tri-motion-control', type: 'button', onClick: () => state.getState().toggleMotion(),
        'aria-label': motion === 'full' ? 'Pause scene motion' : 'Play scene motion', 'aria-pressed': motion === 'full',
        children: motion === 'full' ? 'Ⅱ PAUSE MOTION' : '▶ PLAY MOTION' }),
      j('div', { ref: cursor, className: 'tri-cursor', 'aria-hidden': true, children: j('span', { className: 'tri-cursor-ring' }) }),
      j('div', { className: 'tri-planet-labels', style: { visibility: visible && !failed ? 'visible' : 'hidden' }, children: agents.map(agent => j('div', {
        ref: node => { labels.current[agent.id] = node; }, className: 'tri-planet-label', role: 'group', tabIndex: 0,
        'aria-label': `${agent.codename} ${labelNames[agent.id]}`, onPointerDown: event => event.stopPropagation(), onPointerUp: event => event.stopPropagation(),
        onPointerEnter: () => { interaction.labelHover = agent.id; }, onPointerLeave: () => { interaction.labelHover = null; },
        onFocus: () => { interaction.labelHover = agent.id; }, onBlur: event => { if (!event.currentTarget.contains(event.relatedTarget)) interaction.labelHover = null; },
        style: { opacity: 0, left: 0, top: 0 },
        children: [j('span', { className: 'tri-planet-name', children: agent.codename }), j('span', { className: 'tri-planet-role', children: labelNames[agent.id] }),
          j('button', { className: 'tri-explore', type: 'button', disabled: layout.kind !== 'hero', 'aria-label': `Explore ${agent.codename}`, onClick: event => {
            event.stopPropagation(); if (presentation.kind !== 'hero') return; interaction.exploredAgent = agent.id; state.getState().setFocus(agent.id);
          }, children: 'EXPLORE ↗' })]
      }, agent.id)) }),
      j('div', { className: 'tri-scene-caption', 'aria-hidden': true, style: { visibility: visible && !failed ? 'visible' : 'hidden' }, children: [j('span', { children: 'SOL / 07 CORES' }), j('span', { children: 'MISSION CONTROL · LIVE' })] })
    ] });
  }
  function AccessDrawer() {
    const [open, setOpen] = R.useState(false);
    const dialog = R.useRef();
    const opener = R.useRef();
    R.useEffect(() => {
      const request = event => {
        const link = event.target.closest?.('a[href]');
        if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const url = new URL(link.href, location.href);
        if (url.origin !== location.origin || !/\/access\/?$/.test(url.pathname)) return;
        event.preventDefault(); event.stopPropagation();
        opener.current = link;
        setOpen(true);
      };
      document.addEventListener('click', request, true);
      return () => document.removeEventListener('click', request, true);
    }, []);
    R.useEffect(() => {
      const node = dialog.current;
      if (!open || !node) return;
      const overflow = document.body.style.overflow;
      const lenis = window.__lenis;
      lenis?.stop();
      document.body.style.overflow = 'hidden';
      node.showModal();
      return () => {
        node.close();
        document.body.style.overflow = overflow;
        lenis?.start();
        opener.current?.focus({ preventScroll: true });
      };
    }, [open]);
    return j('dialog', { ref: dialog, className: 'tri-access-drawer', 'aria-labelledby': 'tri-access-title',
      onCancel: event => { event.preventDefault(); setOpen(false); },
      onClick: event => { if (event.target === dialog.current) { const b = dialog.current.getBoundingClientRect(); if (event.clientX < b.left || event.clientX > b.right || event.clientY < b.top || event.clientY > b.bottom) setOpen(false); } },
      children: open ? [
        j('header', { className: 'tri-access-header', children: [
          j('div', { children: [j('span', { className: 'label-text', children: 'DEPLOYMENT REQUEST' }), j('h2', { id: 'tri-access-title', children: 'Request access' })] }),
          j('button', { type: 'button', className: 'tri-access-close', 'aria-label': 'Close deployment request', onClick: () => setOpen(false), children: 'ESC ×' })
        ] }),
        j('div', { className: 'tri-access-content', 'data-lenis-prevent': true, children: j(TicketForm, {}) })
      ] : null
    });
  }
  return { Planet, OrbitAgent, Stage, bodies, AccessDrawer };
}
