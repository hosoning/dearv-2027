import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Nav, type Box2 } from './controls';

/**
 * 李澤言 — a transparent figure in the manner of Reynier Llanes' paintings: the room shows
 * through him, bent a little by his form, with a few soft light strokes along his contours.
 * He keeps his own day (work, cooking, the sofa, his books, bed), dresses for it, and can be
 * with her whenever she wants: hold hands, hugs, kisses, sitting and lying together.
 */

export type Outfit = 'suit' | 'pajamas' | 'lounge' | 'casual';
type PoseName = 'stand' | 'sit' | 'lie' | 'sleep' | 'cook' | 'coffee' | 'eat' | 'read' | 'hug' | 'kiss' | 'pat' | 'hold'
  | 'carry' | 'change' | 'work' | 'window';
type V3 = [number, number, number];

const COVER: Record<Outfit, string[]> = {
  suit: ['torso', 'hips', 'upperarm', 'forearm', 'thigh', 'shin', 'foot'],
  pajamas: ['torso', 'hips', 'upperarm', 'forearm', 'thigh', 'shin', 'foot'],
  lounge: ['torso', 'hips', 'upperarm', 'forearm', 'thigh', 'shin', 'foot'],
  casual: ['torso', 'hips', 'upperarm', 'thigh', 'shin', 'foot'],
};
const OUTFIT_NAME: Record<Outfit, string> = { suit: '西裝', pajamas: '你送的睡衣', lounge: '家居服', casual: '休閒服' };

/** The flat was laid out mirrored and flipped at the end: layout (x, y) -> three (-4 - x, 0, -y). */
const MX = (x: number) => -4 - x;
const L = (x: number, y: number) => new THREE.Vector3(MX(x), 0, -y);

interface Spot { name: string; pos: THREE.Vector3; face: THREE.Vector3; pose: PoseName; seat?: number; label: string; hidden?: boolean; lieYaw?: number }

function spot(name: string, p: [number, number], f: [number, number], pose: PoseName, label: string, seat?: number,
  extra: Partial<Spot> = {}): Spot {
  return { name, pos: L(...p), face: L(...f), pose, label, seat, ...extra };
}

/** Where things happen (layout coordinates, see blender/home.py). */
const SPOTS: Record<string, Spot> = Object.fromEntries([
  spot('cook', [-1.86, -6.85], [-1.86, -8.5], 'cook', '在廚房做飯'),
  spot('fridge', [-4.7, -6.93], [-6.5, -6.93], 'stand', '在冰箱拿東西'),
  spot('coffee', [-4.7, -4.83], [-6.5, -4.83], 'coffee', '在沖咖啡'),
  spot('dine', [-0.05, -3.28], [-0.05, -6.0], 'eat', '在吃飯', 0.46),
  spot('sofa_tv', [-3.45, 3.6], [4.0, 3.6], 'sit', '在沙發上看電視', 0.43),
  spot('sofa_sea', [0.6, 1.1], [0.6, 8.0], 'read', '在沙發上看書', 0.43),
  spot('desk', [7.15, -4.6], [8.4, -4.6], 'work', '在書房工作', 0.48),
  spot('reading', [6.4, 4.6], [9.0, 7.0], 'read', '在閱讀角看書', 0.36),
  spot('window', [-0.5, 6.25], [-0.5, 20.0], 'window', '在落地窗前看海'),
  spot('closet', [-10.4, -1.2], [-10.4, 2.0], 'change', '在衣帽間換衣服'),
  spot('bath', [-10.6, 3.4], [-10.6, 6.0], 'stand', '在洗澡', undefined, { hidden: true }),
  spot('bed', [-14.25, -5.85], [-11.0, -5.85], 'sleep', '在睡覺', 0.62, { lieYaw: 0 }),
  spot('bed_read', [-14.3, -5.85], [-11.0, -5.85], 'read', '靠在床上看書', 0.62),
  spot('door', [2.5, -9.35], [2.5, -12.0], 'stand', '出門了', undefined, { hidden: true }),
].map((s) => [s.name, s]));

interface Plan { spot: string; outfit: Outfit; away?: string }

/** His day, from the real clock. Deterministic: the same minute always gives the same plan. */
function planFor(d: Date): Plan {
  const h = d.getHours() + d.getMinutes() / 60;
  const weekend = d.getDay() === 0 || d.getDay() === 6;
  const day = Math.floor(d.getTime() / 86400000);
  const pick = <T,>(a: T[], k: number) => a[Math.abs((day * 31 + k) % a.length)];
  if (!weekend) {
    if (h < 7) return { spot: 'bed', outfit: 'pajamas' };
    if (h < 7.4) return { spot: 'coffee', outfit: 'pajamas' };
    if (h < 7.75) return { spot: 'closet', outfit: 'suit' };
    if (h < 8) return { spot: 'window', outfit: 'suit' };
    if (h < 19) return { spot: 'door', outfit: 'suit', away: '他在上班，晚上七點回家' };
    if (h < 19.2) return { spot: 'sofa_tv', outfit: 'suit' };
    if (h < 19.4) return { spot: 'closet', outfit: 'lounge' };
  } else {
    if (h < 8.5) return { spot: 'bed', outfit: 'pajamas' };
    if (h < 9) return { spot: 'coffee', outfit: 'pajamas' };
    if (h < 9.25) return { spot: 'fridge', outfit: 'lounge' };
    if (h < 9.9) return { spot: 'cook', outfit: 'lounge' };
    if (h < 10.5) return { spot: 'dine', outfit: 'lounge' };
    if (h < 10.7) return { spot: 'closet', outfit: 'casual' };
    if (h < 18) {
      const slot = Math.floor((h - 10.7) / 1.2);
      return { spot: pick(['window', 'sofa_sea', 'reading', 'sofa_tv', 'desk', 'window'], slot), outfit: 'casual' };
    }
    if (h < 19.4) return { spot: h < 18.3 ? 'closet' : 'sofa_tv', outfit: 'lounge' };
  }
  if (h < 19.6) return { spot: 'fridge', outfit: 'lounge' };
  if (h < 20.2) return { spot: 'cook', outfit: 'lounge' };
  if (h < 20.8) return { spot: 'dine', outfit: 'lounge' };
  if (h < 22) return { spot: pick(['sofa_tv', 'reading', 'desk', 'sofa_sea'], Math.floor(h * 2)), outfit: 'lounge' };
  if (h < 22.4) return { spot: 'bath', outfit: 'pajamas' };
  if (h < 23) return { spot: 'bed_read', outfit: 'pajamas' };
  return { spot: 'bed', outfit: 'pajamas' };
}

// --- poses: offsets in degrees about his own axes at rest (x = his left, y = up, z = forward) ---
type Pose = Record<string, V3>;
const sym = (p: Pose): Pose => {
  const o: Pose = {};
  for (const [k, v] of Object.entries(p)) {
    o[k] = v;
    if (k.endsWith('.L')) { const r = k.slice(0, -2) + '.R'; if (!(r in p)) o[r] = [v[0], -v[1], -v[2]]; }
  }
  return o;
};

/** Smooth small-amplitude noise for idle life. */
const wob = (t: number, k: number) => Math.sin(t * 0.7 + k) * 0.6 + Math.sin(t * 1.9 + k * 2.3) * 0.4;

export interface CompanionAction { label: string; run: () => void }

export class LiZeyan {
  root = new THREE.Group();
  private model = new THREE.Group();
  private bones = new Map<string, THREE.Bone>();
  private restLocal = new Map<THREE.Bone, THREE.Quaternion>();
  private restRoot = new Map<THREE.Bone, THREE.Quaternion>();
  private cur = new Map<string, THREE.Vector3>();   // current pose offsets (radians)
  private parts: { mesh: THREE.Object3D; layer: string }[] = [];
  private mats: THREE.MeshPhysicalMaterial[] = [];
  private armDown = 40;
  private hipH = 0.95;
  private nav: Nav;
  private path: THREE.Vector3[] = [];
  private walking = false;
  private phase = 0;
  private yaw = 0;
  private settle = 0;          // 0..1 how far into the spot pose
  private pose: PoseName = 'stand';
  private spotNow: Spot | null = null;
  private target: Spot | null = null;
  private outfit: Outfit = 'lounge';
  private pendingOutfit: Outfit | null = null;
  private t = 0;
  private shadow: THREE.Mesh;
  /** set by interactions: overrides the daily plan until cleared */
  private mode: { kind: 'follow' | 'hold' | 'hug' | 'kiss' | 'pat' | 'sitwith' | 'liewith' | 'carry'; until: number; spot?: Spot } | null = null;
  status = '';
  away = '';
  onStatus: (s: string) => void = () => {};
  /** spot events for the household (fridge door, burners, plates) */
  onSpot: (spot: string, phase: 'arrive' | 'stay' | 'leave', seconds: number) => void = () => {};
  private spotTime = 0;
  private lastSpot = '';
  /** debug: force the clock (hours) */
  clockOverride: number | null = null;

  static async load(url: string, scene: THREE.Scene, colliders: Box2[], bounds: Box2) {
    const gltf = await new GLTFLoader().loadAsync(url);
    return new LiZeyan(gltf.scene, scene, colliders, bounds);
  }

  constructor(src: THREE.Object3D, scene: THREE.Scene, colliders: Box2[], bounds: Box2) {
    this.nav = new Nav(colliders, bounds);
    this.model.add(src);
    this.root.add(this.model);
    scene.add(this.root);
    src.traverse((o) => {
      if ((o as THREE.Bone).isBone) this.bones.set(o.name, o as THREE.Bone);
      const m = o as THREE.SkinnedMesh;
      if (m.isMesh) {
        m.frustumCulled = false;
        const layer = (m.userData.layer as string) ?? (m.parent?.userData.layer as string) ?? '';
        const mat = this.material(m.material as THREE.MeshStandardMaterial, layer);
        m.material = mat;
        this.parts.push({ mesh: m, layer });
      }
    });
    src.updateMatrixWorld(true);
    const inv = new THREE.Quaternion();
    this.root.getWorldQuaternion(inv).invert();
    for (const b of this.bones.values()) {
      this.restLocal.set(b, b.quaternion.clone());
      this.restRoot.set(b, inv.clone().multiply(b.getWorldQuaternion(new THREE.Quaternion())));
    }
    // how far the rest pose holds the arms out, and the hip height
    const ua = this.bone('upperarm01.L'), la = this.bone('lowerarm01.L'), ul = this.bone('upperleg01.L');
    if (ua && la) {
      const a = ua.getWorldPosition(new THREE.Vector3()), b = la.getWorldPosition(new THREE.Vector3());
      const d = b.sub(a).normalize();
      this.armDown = THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(-d.y, -1, 1))) - 7;
    }
    if (ul) this.hipH = ul.getWorldPosition(new THREE.Vector3()).y;
    // a soft contact shadow
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(32, 32, 2, 32, 32, 31);
    grad.addColorStop(0, 'rgba(0,0,0,0.32)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.renderOrder = 1;
    scene.add(this.shadow);
    this.setOutfit('lounge');
    // start wherever the plan says he is right now
    const p = planFor(this.now());
    this.setOutfit(p.outfit);
    const s = SPOTS[p.spot];
    this.placeAt(s);
  }

  private bone(n: string) { return this.bones.get(n.replace(/[[\].:/]/g, '')); }

  /** Llanes look: pure refraction of the room, a faint tint for cloth, soft light strokes on the contours. */
  private material(src: THREE.MeshStandardMaterial, layer: string) {
    const skin = layer.startsWith('body') || layer === 'hair';
    const tint = new THREE.Color(src.color ?? 0xffffff);
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(1, 1, 1).lerp(tint, skin ? 0.04 : 0.1),
      metalness: 0, roughness: skin ? 0.18 : 0.32, transmission: 1, thickness: skin ? 0.25 : 0.4,
      ior: skin ? 1.06 : 1.14, specularIntensity: 0.06, envMapIntensity: 0.0, transparent: false,
    });
    const uniforms = { uRim: { value: skin ? 0.16 : 0.22 }, uRimColor: { value: new THREE.Color(1.0, 0.93, 0.82) }, uTime: { value: 0 } };
    m.userData.uniforms = uniforms;
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, uniforms);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vLzPos;')
        .replace('#include <skinning_vertex>', '#include <skinning_vertex>\nvLzPos = transformed;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
          varying vec3 vLzPos;
          uniform float uRim;
          uniform vec3 uRimColor;
          uniform float uTime;
          float lzHash( vec2 p ) { return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453 ); }
          float lzNoise( vec2 p ) {
            vec2 i = floor( p ), f = fract( p );
            f = f * f * ( 3.0 - 2.0 * f );
            return mix( mix( lzHash( i ), lzHash( i + vec2( 1, 0 ) ), f.x ), mix( lzHash( i + vec2( 0, 1 ) ), lzHash( i + vec2( 1, 1 ) ), f.x ), f.y );
          }`)
        .replace('#include <dithering_fragment>', `
          // brushy light strokes along the silhouette (oil-paint highlights rather than glass glints)
          float ndv = clamp( dot( normalize( normal ), normalize( vViewPosition ) ), 0.0, 1.0 );
          float rim = pow( 1.0 - ndv, 3.0 );
          // long, sparse brush streaks running down the form (stretched noise), not stripes
          vec2 sp = vec2( ( vLzPos.x + vLzPos.z ) * 38.0, vLzPos.y * 5.0 );
          float streak = smoothstep( 0.55, 0.85, lzNoise( sp ) ) * ( 0.6 + 0.4 * lzNoise( sp * 3.1 + 7.0 ) );
          gl_FragColor.rgb += uRimColor * rim * ( 0.25 + streak ) * uRim;
          #include <dithering_fragment>`);
    };
    m.customProgramCacheKey = () => `lz-${skin ? 's' : 'c'}`;
    this.mats.push(m);
    return m;
  }

  setOutfit(o: Outfit) {
    this.outfit = o;
    const cover = new Set(COVER[o]);
    for (const p of this.parts) {
      const L = p.layer;
      if (L.startsWith('body_')) p.mesh.visible = !cover.has(L.slice(5));
      else if (L === 'hair') p.mesh.visible = true;
      else p.mesh.visible = L.split('|').includes(o);
    }
  }

  get outfitName() { return OUTFIT_NAME[this.outfit]; }
  get isSleeping() { return !this.walking && this.pose === 'sleep'; }

  now() {
    const d = new Date();
    if (this.clockOverride != null) d.setHours(Math.floor(this.clockOverride), Math.round((this.clockOverride % 1) * 60), 0);
    return d;
  }

  private placeAt(s: Spot) {
    this.spotNow = s;
    this.target = s;
    this.root.position.copy(s.pos);
    this.faceTo(s.face, 1);
    this.pose = s.pose;
    this.settle = 1;
    this.walking = false;
    this.path = [];
    this.root.visible = !s.hidden;
    this.status = s.label;
  }

  private faceTo(p: THREE.Vector3, k: number) {
    const d = p.clone().sub(this.root.position);
    const want = Math.atan2(d.x, d.z);
    let diff = want - this.yaw;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    this.yaw += diff * k;
  }

  private goTo(s: Spot) {
    if (this.target === s && (this.walking || this.spotNow === s)) return;
    this.target = s;
    this.spotNow = null;
    const from = this.root.position.clone();
    this.root.visible = true;
    // stand up first if seated / lying, then walk
    this.path = this.nav.find(from, s.pos) ?? [s.pos.clone()];
    this.path.push(s.pos.clone());
    this.walking = true;
    this.pose = 'stand';
  }

  // ---- interactions with her ----------------------------------------------------------------
  /** Actions offered when she is near him (shown as buttons). */
  actions(cam: THREE.Vector3, seated: boolean): CompanionAction[] {
    if (!this.root.visible) return [];
    const d = Math.hypot(cam.x - this.root.position.x, cam.z - this.root.position.z);
    const out: CompanionAction[] = [];
    if (d > 2.4) return out;
    const m = this.mode?.kind;
    if (m === 'hold' || m === 'follow') out.push({ label: '<b>放開</b>他的手', run: () => { this.mode = null; } });
    else out.push({ label: '<b>牽手</b>', run: () => { this.mode = { kind: 'hold', until: Infinity }; } });
    if (!seated) {
      out.push({ label: '<b>抱抱</b>', run: () => { this.mode = { kind: 'hug', until: this.t + 9 }; } });
      out.push({ label: '<b>親親</b>', run: () => { this.mode = { kind: 'kiss', until: this.t + 6 }; } });
      out.push({ label: '<b>摸摸頭</b>', run: () => { this.mode = { kind: 'pat', until: this.t + 5 }; } });
    }
    return out;
  }

  /** She sat down / lay down somewhere: he comes to be with her if he is home. */
  joinHer(kind: 'sit' | 'lie' | 'sleep', seat: THREE.Vector3, look: THREE.Vector3) {
    if (this.away) return;
    const fwd = look.clone().sub(seat).setY(0).normalize();
    const side = new THREE.Vector3(fwd.z, 0, -fwd.x);      // to her left
    const pos = seat.clone().addScaledVector(side, kind === 'sit' ? 0.72 : 0.85).setY(0);
    const s: Spot = { name: 'with_her', pos, face: pos.clone().add(fwd.multiplyScalar(5)), pose: kind === 'sit' ? 'sit' : 'sleep',
      label: kind === 'sit' ? '坐在你旁邊' : '躺在你身邊', seat: kind === 'sit' ? Math.max(0.36, seat.y - 0.75) : 0.62 };
    this.mode = { kind: kind === 'sit' ? 'sitwith' : 'liewith', until: Infinity, spot: s };
  }

  herStood() { if (this.mode && (this.mode.kind === 'sitwith' || this.mode.kind === 'liewith')) this.mode = null; }

  // ---- per frame ------------------------------------------------------------------------------
  update(dt: number, cam: THREE.Camera, camPos: THREE.Vector3, night: number) {
    this.t += dt;
    for (const m of this.mats) {
      const u = m.userData.uniforms as { uRim: { value: number }; uTime: { value: number } };
      u.uTime.value = this.t;
    }
    if (this.mode && this.t > this.mode.until) this.mode = null;

    // what should he be doing?
    const plan = planFor(this.now());
    this.away = '';
    let goal: Spot = SPOTS[plan.spot];
    const m = this.mode;
    if (m && (m.kind === 'sitwith' || m.kind === 'liewith') && m.spot) goal = m.spot;
    if (plan.away && !m) this.away = plan.away;
    // companion modes that follow her around
    const herPos = new THREE.Vector3(camPos.x, 0, camPos.z);
    const camFwd = new THREE.Vector3();
    cam.getWorldDirection(camFwd).setY(0).normalize();
    if (m && ['hold', 'follow', 'hug', 'kiss', 'pat'].includes(m.kind)) {
      let want: THREE.Vector3;
      if (m.kind === 'hold' || m.kind === 'follow') {
        const right = new THREE.Vector3(-camFwd.z, 0, camFwd.x);
        want = herPos.clone().addScaledVector(right, 0.55).addScaledVector(camFwd, 0.05);
      } else {
        want = herPos.clone().addScaledVector(camFwd, m.kind === 'kiss' ? 0.32 : m.kind === 'hug' ? 0.36 : 0.5);
      }
      const pose = (m.kind === 'follow' ? 'stand' : m.kind) as PoseName;
      goal = { name: 'her', pos: want, face: m.kind === 'hold' ? want.clone().add(camFwd) : herPos, pose, label: '在你身邊' };
      // close in directly (no path planning when she is right here)
      const d = want.distanceTo(this.root.position);
      if (d > 2.5) { if (!this.walking || this.target?.name !== 'her') this.goTo(goal); }
      else {
        this.walking = d > 0.12;
        this.path = [];
        this.target = goal;
        this.spotNow = d <= 0.12 ? goal : null;
        if (this.walking) this.stepTowards(want, dt, Math.min(1.4, d * 2.2));
        this.faceTo(this.walking && m.kind !== 'hug' && m.kind !== 'kiss' ? want : goal.face, Math.min(1, dt * 4));
        this.pose = this.walking ? 'stand' : pose;
        this.settle = this.walking ? 0 : Math.min(1, this.settle + dt * 1.5);
      }
      this.status = m.kind === 'hold' ? '牽著你的手' : m.kind === 'hug' ? '抱著你' : m.kind === 'kiss' ? '親了你一下' : m.kind === 'pat' ? '摸摸你的頭' : '跟著你';
    } else {
      // outfit changes happen in the closet (or out of sight in the bath)
      if (plan.outfit !== this.outfit) {
        const where = plan.spot === 'bath' ? SPOTS.bath : plan.spot === 'door' && !this.root.visible ? null : SPOTS.closet;
        if (where && goal !== where && !(m && m.spot)) { goal = where; this.pendingOutfit = plan.outfit; }
        else if (!where) this.setOutfit(plan.outfit);
      }
      if (this.spotNow !== goal) this.goTo(goal);
      if (this.walking) this.followPath(dt);
      else if (this.spotNow) {
        this.settle = Math.min(1, this.settle + dt * 1.2);
        this.faceTo(this.spotNow.face, Math.min(1, dt * 3));
        if (this.pendingOutfit && this.settle > 0.95 && (this.spotNow === SPOTS.closet || this.spotNow === SPOTS.bath)) {
          this.setOutfit(this.pendingOutfit);
          this.pendingOutfit = null;
        }
        this.status = this.spotNow.label;
        this.root.visible = !this.spotNow.hidden;
      }
    }
    if (this.away) this.status = this.away;
    // tell the household where he is (arrive / every frame while there / leave)
    const here = !this.walking && this.spotNow ? this.spotNow.name : '';
    if (here !== this.lastSpot) {
      if (this.lastSpot) this.onSpot(this.lastSpot, 'leave', this.spotTime);
      this.spotTime = 0;
      if (here) this.onSpot(here, 'arrive', 0);
      this.lastSpot = here;
    } else if (here) {
      this.spotTime += dt;
      this.onSpot(here, 'stay', this.spotTime);
    }
    this.applyPose(dt);
    this.shadow.position.set(this.root.position.x, 0.004, this.root.position.z);
    this.shadow.visible = this.root.visible && this.pose !== 'lie' && this.pose !== 'sleep';
    (this.shadow.material as THREE.MeshBasicMaterial).opacity = 0.8 - 0.4 * night;
    this.onStatus(this.status);
  }

  private stepTowards(p: THREE.Vector3, dt: number, speed: number) {
    const d = p.clone().sub(this.root.position).setY(0);
    const len = d.length();
    const step = Math.min(len, speed * dt);
    if (len > 1e-4) this.root.position.addScaledVector(d.normalize(), step);
    this.phase += step * 2.6;
  }

  private followPath(dt: number) {
    this.settle = Math.max(0, this.settle - dt * 3);
    this.root.position.y = 0;
    const next = this.path[0];
    if (!next) { this.arrive(); return; }
    const d = next.clone().sub(this.root.position).setY(0);
    if (d.length() < 0.15) { this.path.shift(); if (!this.path.length) this.arrive(); return; }
    this.faceTo(next, Math.min(1, dt * 5));
    this.stepTowards(next, dt, 1.15);
    this.root.visible = true;
  }

  private arrive() {
    this.walking = false;
    this.spotNow = this.target;
    this.settle = 0;
    if (this.spotNow) {
      this.root.position.x = this.spotNow.pos.x;
      this.root.position.z = this.spotNow.pos.z;
      this.pose = this.spotNow.pose;
    }
  }

  // ---- skeleton -------------------------------------------------------------------------------
  private poseTargets(): Pose {
    const t = this.t;
    const a = this.armDown;
    const breathe = Math.sin(t * 1.5) * 1.2;
    const base: Pose = sym({
      'upperarm01.L': [3 + wob(t, 1), 0, -a], 'lowerarm01.L': [-12, 0, 0], 'spine03': [breathe, 0, 0],
      'spine01': [breathe * 0.5, wob(t, 4) * 2, 0], 'head': [wob(t, 2) * 2, wob(t, 3) * 5, 0],
      'finger2-1.L': [-12, 0, 0], 'finger3-1.L': [-14, 0, 0], 'finger4-1.L': [-16, 0, 0], 'finger5-1.L': [-18, 0, 0],
    });
    const sitLegs: Pose = sym({ 'upperleg01.L': [-86, 0, 2], 'lowerleg01.L': [84, 0, 0], 'foot.L': [4, 0, 0] });
    const P: Record<PoseName, Pose> = {
      stand: base,
      window: { ...base, ...sym({ 'upperarm01.L': [8, 0, -a + 4], 'lowerarm01.L': [-20, 0, 0] }), head: [-4, wob(t, 3) * 8, 0] },
      change: { ...base, ...sym({ 'upperarm01.L': [-40 + wob(t, 5) * 15, 0, -a + 10], 'lowerarm01.L': [-70, 0, 0] }), head: [18, 0, 0] },
      sit: { ...base, ...sitLegs, ...sym({ 'upperarm01.L': [-28, 0, -a + 8], 'lowerarm01.L': [-48, 0, 0] }), spine03: [-6 + breathe, 0, 0] },
      read: { ...base, ...sitLegs, ...sym({ 'upperarm01.L': [-30, 8, -a + 14], 'lowerarm01.L': [-100, -20, 0] }), head: [24, 0, 0], spine02: [6, 0, 0] },
      work: { ...base, ...sitLegs, ...sym({ 'upperarm01.L': [-38, 0, -a + 12], 'lowerarm01.L': [-62, -12, 0] }), head: [10, wob(t, 7) * 6, 0], spine02: [8, 0, 0] },
      eat: (() => {
        const k = Math.max(0, Math.sin(t * 1.2)) ** 3;     // fork to mouth now and then
        return { ...base, ...sitLegs, ...sym({ 'upperarm01.L': [-30, 0, -a + 10], 'lowerarm01.L': [-70, 0, 0] }),
          'upperarm01.R': [-30 - 25 * k, 0, a - 18], 'lowerarm01.R': [-70 - 55 * k, 0, 0], head: [12 - 10 * k, 0, 0], spine02: [8, 0, 0] };
      })(),
      cook: (() => {
        const s = t * 2.4;
        return { ...base, ...sym({ 'upperarm01.L': [-30, 0, -a + 10], 'lowerarm01.L': [-78, 0, 0] }),
          'upperarm01.R': [-34 + Math.sin(s) * 8, Math.cos(s) * 8, a - 14], 'lowerarm01.R': [-80 + Math.cos(s) * 6, 0, 0],
          head: [22, wob(t, 2) * 6, 0], spine02: [8, 0, 0] };
      })(),
      coffee: (() => {
        const k = Math.max(0, Math.sin(t * 0.6)) ** 6;
        return { ...base, 'upperarm01.R': [-22 - 12 * k, 0, a - 14], 'lowerarm01.R': [-105 - 30 * k, 0, 0], head: [6 - 12 * k, 0, 0] };
      })(),
      hug: { ...base, ...sym({ 'upperarm01.L': [-70, -25, -a + 30], 'lowerarm01.L': [-35, -55, 0], 'wrist.L': [0, -20, 0] }),
        head: [12, -18, 0], spine02: [6, 0, 0] },
      kiss: { ...base, ...sym({ 'upperarm01.L': [-62, -22, -a + 30], 'lowerarm01.L': [-40, -50, 0] }), head: [18, 0, 8], spine02: [10, 0, 0], neck01: [10, 0, 0] },
      pat: { ...base, 'upperarm01.R': [-125, 0, a - 30], 'lowerarm01.R': [-35 + Math.sin(t * 6) * 8, 0, 0], head: [16, 0, 0] },
      hold: { ...base, 'upperarm01.R': [-8, 0, a - 18], 'lowerarm01.R': [-22, 0, 0], head: [6, -12 + wob(t, 2) * 6, 0] },
      carry: { ...base, ...sym({ 'upperarm01.L': [-55, -10, -a + 10], 'lowerarm01.L': [-70, -30, 0] }), spine02: [-6, 0, 0], head: [14, 0, 0] },
      lie: { ...base, ...sym({ 'upperarm01.L': [0, 0, -a + 4], 'lowerarm01.L': [-8, 0, 0] }), head: [-6, 0, 0] },
      sleep: { ...base, ...sym({ 'upperleg01.L': [-35, 0, 0], 'lowerleg01.L': [55, 0, 0], 'upperarm01.L': [-55, 0, -a + 15], 'lowerarm01.L': [-60, 0, 0] }), head: [10, 0, 0] },
    };
    if (this.walking) {
      const ph = this.phase * Math.PI;
      const s = Math.sin(ph), c = Math.cos(ph);
      return { ...base, ...{
        'upperleg01.L': [-24 * s, 0, 0], 'upperleg01.R': [24 * s, 0, 0],
        'lowerleg01.L': [Math.max(0, 50 * -c) + 6, 0, 0], 'lowerleg01.R': [Math.max(0, 50 * c) + 6, 0, 0],
        'foot.L': [8 * s, 0, 0], 'foot.R': [-8 * s, 0, 0],
        'upperarm01.L': [16 * s, 0, -a], 'upperarm01.R': [-16 * s, 0, a],
        'lowerarm01.L': [-18 - 8 * Math.max(0, s), 0, 0], 'lowerarm01.R': [-18 - 8 * Math.max(0, -s), 0, 0],
        spine01: [2, -6 * s, 0], spine05: [0, 5 * s, 0],
      } };
    }
    return P[this.pose];
  }

  private applyPose(dt: number) {
    const target = this.poseTargets();
    const k = Math.min(1, dt * (this.walking ? 10 : 4));
    const deg = Math.PI / 180;
    const names = new Set([...this.cur.keys(), ...Object.keys(target)]);
    const q = new THREE.Quaternion(), e = new THREE.Euler();
    for (const n of names) {
      const tv = target[n] ?? [0, 0, 0];
      let v = this.cur.get(n);
      if (!v) { v = new THREE.Vector3(); this.cur.set(n, v); }
      v.lerp(new THREE.Vector3(tv[0] * deg, tv[1] * deg, tv[2] * deg), k);
      const b = this.bone(n);
      if (!b) continue;
      const R = this.restRoot.get(b)!;
      q.setFromEuler(e.set(v.x, v.y, v.z, 'YXZ'));
      // local = rest * (R^-1 * delta * R): the delta is about his own (root) axes
      b.quaternion.copy(this.restLocal.get(b)!).multiply(R.clone().invert().multiply(q).multiply(R));
    }
    // body placement: sitting lowers the hips onto the seat; lying turns him over
    const s = this.spotNow && !this.walking ? this.settle : 0;
    const seated = ['sit', 'read', 'eat', 'work'].includes(this.pose) && this.spotNow?.seat != null;
    const lying = this.pose === 'sleep' || this.pose === 'lie';
    let y = 0;
    if (seated) y = (this.spotNow!.seat! + 0.06 - this.hipH) * s;
    if (lying && this.spotNow?.seat != null) {
      y = (this.spotNow.seat + 0.14) * s;
    }
    if (this.walking) y = Math.abs(Math.sin(this.phase * Math.PI)) * 0.025 - 0.012;
    this.root.position.y += (y - this.root.position.y) * Math.min(1, dt * 6);
    this.root.rotation.set(0, this.yaw, 0, 'YXZ');
    if (lying) {
      // he lies along the facing direction: pivot so the hips stay over the spot
      this.model.position.set(0, 0, 0);
      this.model.rotation.set(-Math.PI / 2 * s, 0, 0);
      if (this.pose === 'sleep') this.model.rotateOnAxis(new THREE.Vector3(0, 1, 0), -Math.PI / 2 * s);
      this.model.position.set(0, 0, this.hipH * s);
    } else {
      this.model.position.set(0, 0, 0);
    }
  }

  /** Hide him while the environment probe is captured. */
  setVisibleForCapture(v: boolean) { this.root.visible = v && !(this.spotNow?.hidden) && !this.away; }
}
