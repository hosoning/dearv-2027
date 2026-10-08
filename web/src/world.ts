import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export type V3 = [number, number, number];

export interface Interactable {
  name: string;
  kind: string;
  label: string;
  [key: string]: unknown;
}

export interface Manifest {
  version: number;
  lightmaps: Record<string, { day: { file: string; scale: number }; night: { file: string; scale: number } }>;
  colliders: { min: [number, number]; max: [number, number] }[];
  interactables: Interactable[];
  emitters: Record<string, { color: V3; strength: number }>;
  spawn: { position: V3; lookAt: V3 };
  waterY: number;
  sunDirection: V3;
}

/** Shared by every lightmapped material: one update re-lights the whole home. */
export const lightUniforms = {
  uNight: { value: 0 },
  uLights: { value: 0 },
  uDayTint: { value: new THREE.Color(1, 1, 1) },
  uMoonTint: { value: new THREE.Color(0.05, 0.065, 0.11) },
  uLmGain: { value: 1 },
  uDayGain: { value: 2.2 },
};

const LIGHTMAP_CHUNK = /* glsl */ `
#if defined( RE_IndirectDiffuse )
  #ifdef USE_LIGHTMAP
    vec3 lmD = texture2D( lightMap, vLightMapUv ).rgb;
    vec3 lmN = texture2D( lightMapNight, vLightMapUv ).rgb;
    lmD = lmD * lmD * lmScale.x;
    lmN = lmN * lmN * lmScale.y;
    vec3 dayPart = lmD * uDayTint * uDayGain + lmN * uLights * 0.25;
    vec3 nightPart = mix( lmD * uMoonTint, lmN, uLights );
    irradiance += mix( dayPart, nightPart, uNight ) * lightMapIntensity * uLmGain * PI;
  #endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
  radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
  #ifdef USE_CLEARCOAT
    clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
  #endif
#endif
`;

// three substitutes light-count macros textually, so the sun / hemisphere blocks are
// disabled by rewriting their guards (point lights from table lamps still apply).
const BAKED_LIGHTS_BEGIN = THREE.ShaderChunk.lights_fragment_begin
  .replace('#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )', '#if 0')
  .replace('#if ( NUM_HEMI_LIGHTS > 0 )', '#if 0');

function patchLightmapped(mat: THREE.MeshStandardMaterial, night: THREE.Texture, scale: THREE.Vector2) {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, lightUniforms, {
      lightMapNight: { value: night },
      lmScale: { value: scale },
    });
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <lightmap_pars_fragment>',
        `#include <lightmap_pars_fragment>
uniform sampler2D lightMapNight; uniform vec2 lmScale;
uniform float uNight; uniform float uLights; uniform vec3 uDayTint; uniform vec3 uMoonTint; uniform float uLmGain;
uniform float uDayGain;`,
      )
      // Interior light is fully baked: the exterior sun / sky lights must not hit it twice.
      .replace('#include <lights_fragment_begin>', BAKED_LIGHTS_BEGIN)
      .replace('#include <lights_fragment_maps>', LIGHTMAP_CHUNK);
  };
  mat.customProgramCacheKey = () => 'dearv-lightmap';
}

export interface Emitter {
  material: THREE.MeshStandardMaterial;
  strength: number;
  group: string | null; // lamp group, or null for global (downlights, LED slots)
}

export interface World {
  interior: THREE.Group;
  city: THREE.Group;
  manifest: Manifest;
  emitters: Emitter[];
  curtainMats: THREE.MeshStandardMaterial[];
  glassMats: THREE.MeshStandardMaterial[];
  facadeMats: THREE.MeshStandardMaterial[];
  interactive: THREE.Object3D[];
  floors: THREE.Object3D[];
  byName: Map<string, THREE.Object3D>;
  waterNormals: THREE.Texture;
}

function ancestorWith(o: THREE.Object3D, key: string): THREE.Object3D | null {
  let p: THREE.Object3D | null = o;
  while (p) {
    if (p.userData && p.userData[key] !== undefined) return p;
    p = p.parent;
  }
  return null;
}

export async function loadWorld(base: string, onProgress: (f: number) => void): Promise<World> {
  const manifest: Manifest = await (await fetch(`${base}scene.json`)).json();
  const manager = new THREE.LoadingManager();
  const progress = new Map<string, number>();
  const weights: Record<string, number> = { apartment: 0.55, city: 0.15, maps: 0.3 };
  const report = () => {
    let t = 0;
    for (const [k, v] of progress) t += (weights[k] ?? 0) * v;
    onProgress(Math.min(1, t));
  };
  const loader = new GLTFLoader(manager);
  const texLoader = new THREE.TextureLoader(manager);
  const v = `?v=${manifest.version}`;

  const loadGltf = (key: string, url: string) =>
    new Promise<THREE.Group>((resolve, reject) =>
      loader.load(
        url + v,
        (g) => { progress.set(key, 1); report(); resolve(g.scene); },
        (e) => { if (e.total) { progress.set(key, e.loaded / e.total); report(); } },
        reject,
      ),
    );
  const loadTex = (url: string) =>
    new Promise<THREE.Texture>((resolve, reject) => texLoader.load(url + v, resolve, undefined, reject));

  const lmEntries = Object.entries(manifest.lightmaps);
  let mapsDone = 0;
  const mapTotal = lmEntries.length * 2 + 2;
  const tick = <T,>(p: Promise<T>) => p.then((r) => { mapsDone++; progress.set('maps', mapsDone / mapTotal); report(); return r; });

  const [interior, city, lightmaps, facadeNight, waterNormals] = await Promise.all([
    loadGltf('apartment', `${base}apartment.glb`),
    loadGltf('city', `${base}city.glb`),
    Promise.all(
      lmEntries.map(async ([group, e]) => {
        const [day, night] = await Promise.all([tick(loadTex(base + e.day.file)), tick(loadTex(base + e.night.file))]);
        for (const t of [day, night]) {
          t.flipY = false;
          t.channel = 1;
          t.colorSpace = THREE.NoColorSpace;
          t.generateMipmaps = true;
          t.minFilter = THREE.LinearMipmapLinearFilter;
          t.anisotropy = 4;
        }
        return [group, { day, night, scale: new THREE.Vector2(e.day.scale, e.night.scale) }] as const;
      }),
    ),
    tick(loadTex(`${base}textures/facade_night.webp`)),
    tick(loadTex(`${base}textures/waternormals.webp`)),
  ]);
  const lmByGroup = new Map(lightmaps);

  facadeNight.flipY = false;
  facadeNight.colorSpace = THREE.SRGBColorSpace;
  waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

  const emitters: Emitter[] = [];
  const curtainMats: THREE.MeshStandardMaterial[] = [];
  const glassMats: THREE.MeshStandardMaterial[] = [];
  const interactive: THREE.Object3D[] = [];
  const floors: THREE.Object3D[] = [];
  const matCache = new Map<string, THREE.MeshStandardMaterial>();

  interior.updateMatrixWorld(true);
  const meshes: THREE.Mesh[] = [];
  interior.traverse((o) => { if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh); });

  for (const mesh of meshes) {
    const src = mesh.material as THREE.MeshStandardMaterial;
    const group = (ancestorWith(mesh, 'lm')?.userData.lm as string) ?? null;
    const lampGroup = (mesh.userData.lamp_group as string) ?? null;
    const isCurtain = !!mesh.userData.curtain;
    const isGlass = !!mesh.userData.glass;
    const key = `${src.name}|${group}|${lampGroup}|${isCurtain}`;
    let mat = matCache.get(key);
    if (!mat) {
      mat = src.clone();
      const lm = group ? lmByGroup.get(group) : undefined;
      if (lm && mesh.geometry.getAttribute('uv1')) {
        mat.lightMap = lm.day;
        mat.lightMapIntensity = 1;
        patchLightmapped(mat, lm.night, lm.scale);
      }
      const em = manifest.emitters[src.name];
      if (em) {
        mat.emissive = new THREE.Color(...em.color);
        mat.emissiveIntensity = 0;
        emitters.push({ material: mat, strength: Math.min(em.strength * 0.35, 7), group: lampGroup });
      }
      if (isCurtain) {
        mat.transparent = src.name.startsWith('sheer');
        mat.opacity = mat.transparent ? 0.72 : 1;
        mat.side = THREE.DoubleSide;
        mat.emissive = mat.map ? new THREE.Color(1, 1, 1) : mat.color.clone();
        mat.emissiveMap = mat.map;
        mat.depthWrite = !mat.transparent;
        curtainMats.push(mat);
      }
      if (isGlass) {
        const g = new THREE.MeshStandardMaterial({
          name: src.name, color: 0xdfeef2, roughness: 0.04, metalness: 0.0,
          transparent: true, opacity: 0.1, depthWrite: false,
        });
        mat = g;
        glassMats.push(g);
      }
      matCache.set(key, mat);
    }
    mesh.material = mat;
    if (isGlass) mesh.renderOrder = 2;
    mesh.matrixAutoUpdate = true;
  }

  // Interactive meshes & floors
  for (const mesh of meshes) {
    if (ancestorWith(mesh, 'interact')) interactive.push(mesh);
    if (mesh.name.startsWith('floor_') || mesh.name.startsWith('rug_') || mesh.name === 'entry_mat') floors.push(mesh);
  }

  // Merge static geometry per material to cut draw calls (interactables, curtains,
  // lamps and anything parented under a moving node stay separate).
  const buckets = new Map<THREE.Material, THREE.Mesh[]>();
  for (const mesh of meshes) {
    if (ancestorWith(mesh, 'interact') || mesh.userData.curtain || mesh.userData.glass || mesh.userData.lamp_group ||
        mesh.userData.spin || mesh.userData.gift_heart || floors.includes(mesh)) continue;
    const arr = buckets.get(mesh.material as THREE.Material) ?? [];
    arr.push(mesh);
    buckets.set(mesh.material as THREE.Material, arr);
  }
  const merged = new THREE.Group();
  merged.name = 'merged-static';
  for (const [mat, list] of buckets) {
    if (list.length < 2) continue;
    const geos: THREE.BufferGeometry[] = [];
    const attrs = Object.keys(list[0].geometry.attributes).sort().join();
    const keep: THREE.Mesh[] = [];
    for (const m of list) {
      if (Object.keys(m.geometry.attributes).sort().join() !== attrs) { keep.push(m); continue; }
      const g = m.geometry.clone();
      g.applyMatrix4(m.matrixWorld);
      geos.push(g.index ? g : g);
    }
    if (geos.length < 2) continue;
    const mg = mergeGeometries(geos, false);
    if (!mg) continue;
    const mm = new THREE.Mesh(mg, mat);
    mm.name = `merged:${mat.name}`;
    merged.add(mm);
    for (const m of list) if (!keep.includes(m)) m.removeFromParent();
  }
  interior.add(merged);

  // City: lit by the exterior sun/sky, night windows from the emissive facade map.
  const facadeMats: THREE.MeshStandardMaterial[] = [];
  const cityMats = new Map<THREE.Material, THREE.Mesh[]>();
  city.updateMatrixWorld(true);
  city.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const arr = cityMats.get(m.material as THREE.Material) ?? [];
    arr.push(m);
    cityMats.set(m.material as THREE.Material, arr);
  });
  const cityMerged = new THREE.Group();
  for (const [mat0, list] of cityMats) {
    const mat = mat0 as THREE.MeshStandardMaterial;
    // the reflection probe is captured inside the flat; it must not light the city
    mat.envMapIntensity = 0;
    // glTF drops the colour factor on textured Blender materials: re-apply facade tints
    const tints: Record<string, number> = { facade_tower_b: 0xc9d0da, facade_tower_c: 0xf0dcc0, facade_tower_d: 0x6f7f8c };
    if (tints[mat.name]) mat.color.setHex(tints[mat.name]);
    if (/facade|near_tower/.test(mat.name)) {
      mat.emissive = new THREE.Color(1, 0.92, 0.8);
      mat.emissiveMap = facadeNight;
      mat.emissiveIntensity = 0;
      facadeMats.push(mat);
    }
    const geos = list.map((m) => m.geometry.clone().applyMatrix4(m.matrixWorld));
    const mg = mergeGeometries(geos, false);
    if (mg) cityMerged.add(new THREE.Mesh(mg, mat));
  }
  const cityRoot = new THREE.Group();
  cityRoot.add(cityMerged);

  const byName = new Map<string, THREE.Object3D>();
  interior.traverse((o) => byName.set(o.name, o));

  return {
    interior, city: cityRoot, manifest, emitters, curtainMats, glassMats, facadeMats,
    interactive, floors, byName, waterNormals,
  };
}
