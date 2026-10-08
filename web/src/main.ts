import * as THREE from 'three';
import './style.css';
import { loadWorld, type V3 } from './world';
import { Environment } from './environment';
import { Player } from './controls';
import { Home } from './interact';
import { lettersSheet, setContent, sheetOpen, type Content } from './ui';
import { store } from './store';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = $('scene') as HTMLCanvasElement;
const isTouch = matchMedia('(pointer: coarse)').matches;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isTouch ? 1.5 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(isTouch ? 72 : 62, window.innerWidth / window.innerHeight, 0.05, 20000);

const fromBlender = (v: V3) => new THREE.Vector3(v[0], v[2], -v[1]);

const PLACES: Record<string, { pos: V3; look: V3 }> = {
  living: { pos: [2.1, 0.9, 1.6], look: [6.5, 3.4, 1.2] },
  window: { pos: [2.4, 4.25, 1.6], look: [1.0, 60, -6] },
  kitchen: { pos: [1.7, -1.0, 1.6], look: [1.7, -4.8, 1.1] },
  bedroom: { pos: [-2.6, 1.0, 1.6], look: [-8.5, 2.8, 0.9] },
  vitrine: { pos: [-3.7, 2.4, 1.55], look: [-1.3, 2.4, 1.0] },
  letters: { pos: [-3.35, 1.5, 1.6], look: [-3.35, -0.6, 1.45] },
  study: { pos: [-2.6, -2.6, 1.6], look: [-9.0, -2.6, 1.4] },
};

async function boot() {
  const base = `${import.meta.env.BASE_URL}assets/`;
  const bar = $('bar');
  const contentBase = import.meta.env.BASE_URL;
  const [world, content] = await Promise.all([
    loadWorld(base, (f) => { bar.style.width = `${(f * 100).toFixed(1)}%`; }),
    fetch(`${contentBase}content/memories.json?v=${Date.now()}`).then((r) => r.json() as Promise<Content>)
      .catch(() => ({ keepsakes: [], letters: [] })),
  ]);
  setContent(content, contentBase);
  scene.add(world.interior, world.city);

  const env = new Environment(scene, world);
  const player = new Player(camera, canvas, world.manifest.colliders, $('joy'), (x, y) => tap(x, y));
  const home = new Home(world, player, scene);
  // scene.json spawn is already in three.js coordinates
  player.spawn(new THREE.Vector3(...world.manifest.spawn.position), new THREE.Vector3(...world.manifest.spawn.lookAt));

  // Time of day: restore, else follow the real clock
  const saved = store.state();
  const hour = new Date().getHours();
  const clockT = hour >= 7 && hour < 17 ? 0 : hour >= 17 && hour < 19 ? 0.5 : 1;
  const time = { t: saved.t ?? clockT, lights: saved.lights ?? (clockT > 0.4 ? 1 : 0) };
  const goal = { ...time };
  home.lightsMaster = goal.lights;
  home.setLightsMaster(goal.lights > 0.5);
  home.onLightsChanged = () => {
    goal.lights = home.lightsMaster;
    refreshDock();
    persist();
  };
  const persist = () => store.setState({ t: goal.t, lights: goal.lights });

  // Reflections: capture the actual (lightmapped) apartment into a PMREM env map.
  const pmrem = new THREE.PMREMGenerator(renderer);
  let envRT: THREE.WebGLRenderTarget | null = null;
  let envDirty = 2;
  const captureEnv = () => {
    scene.environment = null;
    env.water.visible = false;
    env.sky.position.set(2.5, 1.5, -1.5);
    const rt = pmrem.fromScene(scene, 0.02, 0.1, 12000, { size: 128, position: new THREE.Vector3(2.5, 1.5, -1.5) });
    env.water.visible = true;
    scene.environment = rt.texture;
    envRT?.dispose();
    envRT = rt;
  };

  // Dock --------------------------------------------------------------------
  const timeLabels = ['白天', '黃昏', '夜晚'];
  const timeIcons = ['☀︎', '◒', '☾'];
  const refreshDock = () => {
    const idx = goal.t < 0.25 ? 0 : goal.t < 0.75 ? 1 : 2;
    $('btn-time').innerHTML = `${timeIcons[idx]}<span>${timeLabels[idx]}</span>`;
    $('btn-lights').classList.toggle('on', goal.lights > 0.5);
  };
  refreshDock();
  document.querySelector('.dock')!.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest('button');
    if (!b) return;
    switch (b.dataset.act) {
      case 'time': {
        goal.t = goal.t < 0.25 ? 0.5 : goal.t < 0.75 ? 1 : 0;
        if (goal.t >= 0.5 && goal.lights < 0.5) home.setLightsMaster(true);
        break;
      }
      case 'lights': home.setLightsMaster(goal.lights < 0.5); break;
      case 'curtains': home.allCurtains(); break;
      case 'letters': lettersSheet(); break;
      case 'views': $('places').hidden = !$('places').hidden; break;
    }
    refreshDock();
    persist();
  });
  $('places').addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest('button');
    const p = b && PLACES[b.dataset.go!];
    if (!p) return;
    $('places').hidden = true;
    const target = fromBlender(p.pos);
    const look = fromBlender(p.look);
    player.walkTo(target, () => player.faceTowards(look));
  });
  $('stand').addEventListener('click', () => { player.stand(); $('stand').hidden = true; });

  // Picking ------------------------------------------------------------------------
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pickables = [...world.interactive, ...world.floors];
  const solid: THREE.Object3D[] = [];
  world.interior.traverse((o) => { if ((o as THREE.Mesh).isMesh && !o.userData.glass && !o.userData.curtain) solid.push(o); });
  const pick = (x: number, y: number) => {
    ndc.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    ray.far = 30;
    const hit = ray.intersectObjects(solid, false)[0];
    if (!hit) return null;
    const root = pickables.includes(hit.object) ? home.rootOf(hit.object) : null;
    return { hit, root, floor: !root && world.floors.includes(hit.object) };
  };

  const tip = $('tip');
  let hoverRoot: THREE.Object3D | null = null;
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const r = pick(e.clientX, e.clientY);
    hoverRoot = r?.root ?? null;
    canvas.style.cursor = hoverRoot ? 'pointer' : r?.floor ? 'crosshair' : 'grab';
    if (hoverRoot) {
      tip.innerHTML = home.label(hoverRoot);
      tip.style.left = `${e.clientX}px`;
      tip.style.top = `${e.clientY}px`;
      tip.hidden = false;
    } else tip.hidden = true;
  });
  canvas.addEventListener('pointerleave', () => { tip.hidden = true; });

  function tap(x: number, y: number) {
    if (sheetOpen()) return;
    const r = pick(x, y);
    if (!r) return;
    if (r.root) {
      const root = r.root;
      const dist = r.hit.distance;
      if (dist < 3.0 || player.isSeated) home.activate(root);
      else player.walkTo(home.approachPoint(root, camera.position), () => {
        const c = new THREE.Box3().setFromObject(root).getCenter(new THREE.Vector3());
        player.faceTowards(c);
        home.activate(root);
      });
      if (root.userData.interact !== 'sit') $('stand').hidden = !player.isSeated;
      fadeHint();
    } else if (r.floor) {
      player.walkTo(r.hit.point);
      fadeHint();
    }
  }
  let hintFaded = false;
  const fadeHint = () => {
    if (hintFaded) return;
    hintFaded = true;
    setTimeout(() => $('hint').classList.add('fade'), 2500);
  };
  if (isTouch) $('hint').textContent = '左邊拖動走路 · 右邊拖動看四周 · 點擊物件互動';

  // Loop --------------------------------------------------------------------------------
  let last = performance.now();
  let elapsed = 0;
  let lastEnvKey = '';
  env.apply(time);
  renderer.compile(scene, camera);

  const frame = () => {
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    elapsed += dt;
    // ease time / lights toward their goals
    const kt = Math.min(1, dt * 0.7);
    time.t += (goal.t - time.t) * kt + Math.sign(goal.t - time.t) * Math.min(Math.abs(goal.t - time.t), dt * 0.05);
    time.lights += (goal.lights - time.lights) * Math.min(1, dt * 3);
    env.apply(time);
    const night = THREE.MathUtils.smoothstep(time.t, 0.5, 1.0);
    renderer.toneMappingExposure = THREE.MathUtils.lerp(1.0, 1.12, Math.min(1, time.t * 1.2));
    home.updateEmitters(time.lights, night);

    player.update(dt);
    if (!player.isSeated) $('stand').hidden = true;
    home.update(dt);
    env.update(dt, elapsed);
    env.sky.position.copy(camera.position);

    const envKey = `${goal.t}|${goal.lights}`;
    if (envKey !== lastEnvKey && Math.abs(goal.t - time.t) < 0.01 && Math.abs(goal.lights - time.lights) < 0.02) {
      lastEnvKey = envKey;
      envDirty = 1;
    }
    if (envDirty > 0) { captureEnv(); envDirty = 0; }

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  };

  bar.style.width = '100%';
  const enter = $('enter') as HTMLButtonElement;
  enter.hidden = false;
  requestAnimationFrame(frame);
  enter.addEventListener('click', () => {
    $('loader').classList.add('gone');
    $('hud').hidden = false;
    setTimeout(() => $('loader').remove(), 1000);
  });
  // allow automation / deep links: ?enter=1&t=night&at=window
  const qs = new URLSearchParams(location.search);
  if (qs.get('enter')) enter.click();
  const qt = qs.get('t');
  if (qt) { goal.t = time.t = qt === 'night' ? 1 : qt === 'dusk' ? 0.5 : 0; goal.lights = time.lights = goal.t > 0.4 ? 1 : 0; home.setLightsMaster(goal.lights > 0.5); refreshDock(); }
  if (qs.get('debug')) {
    // automation hook: activate interactables by name, move the camera
    (window as unknown as Record<string, unknown>).__dearv = {
      names: () => world.manifest.interactables.map((i) => i.name),
      activate: (name: string) => {
        const o = world.byName.get(name);
        const r = o && home.rootOf(o);
        if (r) home.activate(r);
        return !!r;
      },
      place: (k: string) => { if (PLACES[k]) player.spawn(fromBlender(PLACES[k].pos), fromBlender(PLACES[k].look)); },
      look: (pos: V3, look: V3) => player.spawn(fromBlender(pos), fromBlender(look)),
      setTime: (t: number, lights: number) => { goal.t = time.t = t; goal.lights = time.lights = lights; home.setLightsMaster(lights > 0.5); },
      info: () => renderer.info.render,
      world,
      scene,
      camera,
    };
  }
  const at = qs.get('at');
  if (at && PLACES[at]) { player.spawn(fromBlender(PLACES[at].pos), fromBlender(PLACES[at].look)); }
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

boot().catch((err) => {
  console.error(err);
  document.querySelector('.loader-sub')!.textContent = `載入失敗，請重新整理（${String(err?.message ?? err).slice(0, 80)}）`;
});
