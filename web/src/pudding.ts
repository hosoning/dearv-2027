import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Nav, type Box2 } from './controls';

/**
 * 布丁 — male seal-colorpoint Ragdoll, three and a half. Semi-transparent long fur (shell
 * layers over the skinned body), blue eyes. He keeps a cat's day: naps on the sofa, the bed
 * and the rug, sits at the window, wanders, follows her about; pet him and he purrs.
 */

const MX = (x: number) => -4 - x;
const L = (x: number, y: number) => new THREE.Vector3(MX(x), 0, -y);

type Pose = 'stand' | 'sit' | 'loaf' | 'curl' | 'groom';
interface CatSpot { name: string; pos: THREE.Vector3; y: number; pose: Pose; yaw: number; label: string }
const cs = (name: string, p: [number, number], y: number, pose: Pose, yawDeg: number, label: string): CatSpot =>
  ({ name, pos: L(...p), y, pose, yaw: THREE.MathUtils.degToRad(yawDeg), label });

/** Favourite places (layout coordinates, see blender/home.py). */
const SPOTS: CatSpot[] = [
  cs('sofa', [-2.0, 1.15], 0.43, 'curl', 30, '在沙發上睡覺'),
  cs('sofa_arm', [-3.5, 4.8], 0.43, 'loaf', 100, '窩在沙發角落'),
  cs('window', [1.2, 6.35], 0, 'sit', 180, '坐在落地窗前看海'),
  cs('rug', [-1.6, 4.4], 0.016, 'curl', -40, '在地毯上打盹'),
  cs('bed', [-13.25, -6.75], 0.8, 'curl', 70, '在床尾睡覺'),
  cs('study_rug', [7.0, 3.2], 0.014, 'loaf', 200, '在書房地毯上'),
  cs('kitchen', [-2.2, -5.4], 0, 'sit', 10, '在廚房等吃的'),
  cs('closet', [-11.5, 0.9], 0, 'groom', 120, '在衣帽間舔毛'),
  cs('daybed', [8.9, 6.25], 0.44, 'curl', 160, '在窗邊躺椅上曬太陽'),
];

const FUR_LAYERS = 12;
const FUR_LEN = 0.042;

export class Pudding {
  root = new THREE.Group();
  private model = new THREE.Group();
  private bones = new Map<string, THREE.Bone>();
  private restLocal = new Map<THREE.Bone, THREE.Quaternion>();
  private restRoot = new Map<THREE.Bone, THREE.Quaternion>();
  private cur = new Map<string, THREE.Vector3>();
  private nav: Nav;
  private path: THREE.Vector3[] = [];
  private walking = false;
  private phase = 0;
  private yaw = 0;
  private spot: CatSpot | null = null;
  private target: CatSpot | null = null;
  private pose: Pose = 'loaf';
  private nextMove = 0;
  private t = 0;
  private petUntil = 0;
  private followUntil = 0;
  private lookAt = new THREE.Vector3();
  private audio: { ctx: AudioContext; purr: GainNode } | null = null;
  status = '';

  static async load(url: string, scene: THREE.Scene, colliders: Box2[], bounds: Box2) {
    const gltf = await new GLTFLoader().loadAsync(url);
    return new Pudding(gltf.scene, scene, colliders, bounds);
  }

  constructor(src: THREE.Object3D, scene: THREE.Scene, colliders: Box2[], bounds: Box2) {
    this.nav = new Nav(colliders, bounds);
    this.model.add(src);
    this.root.add(this.model);
    scene.add(this.root);
    const skinned: THREE.SkinnedMesh[] = [];
    src.traverse((o) => {
      if ((o as THREE.Bone).isBone) this.bones.set(o.name, o as THREE.Bone);
      if ((o as THREE.SkinnedMesh).isSkinnedMesh) skinned.push(o as THREE.SkinnedMesh);
    });
    src.updateMatrixWorld(true);
    for (const b of this.bones.values()) {
      this.restLocal.set(b, b.quaternion.clone());
      this.restRoot.set(b, b.getWorldQuaternion(new THREE.Quaternion()));
    }
    // glTF splits the body into one mesh per material: fur body and eyes
    for (const m of skinned) {
      const mat = m.material as THREE.MeshStandardMaterial;
      if (/eye/.test(mat.name)) {
        m.material = new THREE.MeshStandardMaterial({ color: 0x5aa0ff, emissive: 0x2a5cb8, emissiveIntensity: 0.6,
          roughness: 0.1, transparent: true, opacity: 0.85 });
        m.renderOrder = 2;
      } else this.makeFur(m);
    }
    const day = Math.floor(Date.now() / 86400000);
    this.placeAt(SPOTS[day % SPOTS.length]);
    this.nextMove = 40 + (day % 7) * 10;
  }

  /** Base body (soft, half see-through) plus shells that grow the long Ragdoll coat. */
  private makeFur(mesh: THREE.SkinnedMesh) {
    mesh.frustumCulled = false;
    const src = mesh.material as THREE.MeshStandardMaterial | THREE.MeshStandardMaterial[];
    const mats = Array.isArray(src) ? src : [src];
    const eye = mats.findIndex((m) => /eye/.test(m.name));
    const furBase = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, transparent: true, opacity: 0.22,
      depthWrite: false, color: 0xe6d6c0 });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x5aa0ff, emissive: 0x2a5cb8, emissiveIntensity: 0.6,
      roughness: 0.1, transparent: true, opacity: 0.85 });
    mesh.material = Array.isArray(src) ? mats.map((_, i) => (i === eye ? eyeMat : furBase)) : furBase;
    mesh.renderOrder = 3;
    for (let i = 1; i <= FUR_LAYERS; i++) {
      const k = i / FUR_LAYERS;
      const shell = new THREE.SkinnedMesh(mesh.geometry, this.shellMaterial(k));
      shell.bind(mesh.skeleton, mesh.bindMatrix);
      shell.frustumCulled = false;
      shell.renderOrder = 3 + i;
      mesh.parent!.add(shell);
      shell.position.copy(mesh.position);
      shell.quaternion.copy(mesh.quaternion);
      shell.scale.copy(mesh.scale);
    }
  }

  private shellMaterial(k: number) {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, transparent: true, depthWrite: false, opacity: 1 });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uK = { value: k };
      sh.uniforms.uLen = { value: FUR_LEN };
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uK;\nuniform float uLen;\nvarying vec3 vFurPos;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          vFurPos = position;
          float fluff = 1.0 + 0.6 * smoothstep(0.1, 0.0, abs(position.y - 0.3)) ;
          transformed += objectNormal * uK * uLen * fluff;
          transformed.y -= uK * uK * uLen * 0.6;`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uK;\nvarying vec3 vFurPos;\nfloat furHash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }')
        .replace('#include <dithering_fragment>', `#include <dithering_fragment>
          float strand = furHash(floor(vFurPos * 320.0));
          if (strand < 0.25 + uK * 0.7) discard;
          gl_FragColor.a *= (1.0 - uK) * 0.2;
          gl_FragColor.rgb *= vec3(0.9, 0.84, 0.76) * (0.8 + 0.3 * uK);`);
    };
    m.customProgramCacheKey = () => `fur${k.toFixed(2)}`;
    return m;
  }

  placeAt(s: CatSpot) {
    this.spot = s;
    this.target = s;
    this.root.position.set(s.pos.x, s.y, s.pos.z);
    this.yaw = s.yaw;
    this.pose = s.pose;
    this.walking = false;
    this.status = s.label;
  }

  private goTo(s: CatSpot) {
    this.target = s;
    this.spot = null;
    const from = new THREE.Vector3(this.root.position.x, 0, this.root.position.z);
    this.path = this.nav.find(from, s.pos) ?? [];
    this.path.push(s.pos.clone());
    this.walking = true;
  }

  // ---- interactions ---------------------------------------------------------------------------
  actions(cam: THREE.Vector3): { label: string; run: () => void }[] {
    const d = Math.hypot(cam.x - this.root.position.x, cam.z - this.root.position.z);
    if (d > 1.8) return [];
    return [
      { label: '<b>摸摸</b>布丁', run: () => this.pet() },
      { label: this.followUntil > this.t ? '<b>讓布丁</b>自己玩' : '<b>叫布丁</b>跟著你', run: () => {
        this.followUntil = this.followUntil > this.t ? 0 : this.t + 90;
        if (this.followUntil) this.meow();
      } },
    ];
  }

  pet() {
    this.petUntil = this.t + 7;
    this.purr(true);
  }

  private ensureAudio() {
    if (this.audio) return this.audio;
    try {
      const ctx = new AudioContext();
      // purr: low rumble (filtered noise) amplitude-modulated at ~25 Hz
      const len = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (0.6 + 0.4 * Math.sin((i / ctx.sampleRate) * 2 * Math.PI * 25));
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 180;
      const purr = ctx.createGain();
      purr.gain.value = 0;
      src.connect(lp).connect(purr).connect(ctx.destination);
      src.start();
      this.audio = { ctx, purr };
    } catch { /* audio is optional */ }
    return this.audio;
  }

  private purr(on: boolean) {
    const a = this.ensureAudio();
    if (!a) return;
    a.purr.gain.setTargetAtTime(on ? 0.22 : 0, a.ctx.currentTime, 0.4);
  }

  private meow() {
    const a = this.ensureAudio();
    if (!a) return;
    const { ctx } = a;
    const o = ctx.createOscillator();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    o.type = 'sawtooth';
    const t0 = ctx.currentTime;
    o.frequency.setValueAtTime(520, t0);
    o.frequency.linearRampToValueAtTime(780, t0 + 0.15);
    o.frequency.linearRampToValueAtTime(430, t0 + 0.55);
    f.type = 'bandpass';
    f.frequency.value = 1100;
    f.Q.value = 2.5;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.08, t0 + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6);
    o.connect(f).connect(g).connect(ctx.destination);
    o.start();
    o.stop(t0 + 0.65);
  }

  // ---- per frame ------------------------------------------------------------------------------
  update(dt: number, camPos: THREE.Vector3, lzPos: THREE.Vector3 | null, lzSleeping: boolean) {
    this.t += dt;
    const her = new THREE.Vector3(camPos.x, 0, camPos.z);
    if (this.petUntil && this.t > this.petUntil) { this.petUntil = 0; this.purr(false); }
    // follow her: trot to a spot at her feet
    if (this.followUntil > this.t) {
      const d = her.distanceTo(new THREE.Vector3(this.root.position.x, 0, this.root.position.z));
      if (d > 1.1 && (!this.walking || this.target?.name !== 'her' || this.t % 1 < dt)) {
        const fwd = her.clone().sub(this.root.position).setY(0).normalize();
        this.goTo({ name: 'her', pos: her.clone().addScaledVector(fwd, -0.7), y: 0, pose: 'sit', yaw: 0, label: '跟著你' });
      }
    } else if (!this.walking && this.t > this.nextMove) {
      // wander: at night prefer the bed when he sleeps; otherwise any favourite place
      const h = new Date().getHours();
      let s: CatSpot;
      if ((h >= 23 || h < 7) && lzSleeping) s = SPOTS.find((x) => x.name === 'bed')!;
      else {
        const options = SPOTS.filter((x) => x !== this.spot);
        s = options[Math.floor(Math.random() * options.length)];
      }
      this.goTo(s);
      this.nextMove = this.t + 90 + Math.random() * 240;
    }
    if (this.walking) this.walk(dt);
    else if (this.spot) {
      this.root.position.y += (this.spot.y - this.root.position.y) * Math.min(1, dt * 4);
      let diff = this.spot.yaw - this.yaw;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      if (this.spot.name !== 'her') this.yaw += diff * Math.min(1, dt * 2);
      else this.faceTowards(her, dt);
      this.pose = this.petUntil ? (this.spot.pose === 'curl' ? 'curl' : 'loaf') : this.spot.pose;
      this.status = this.petUntil ? '被摸得呼嚕呼嚕' : this.spot.label;
    }
    this.lookAt.copy(her);
    this.applyPose(dt, her);
  }

  private faceTowards(p: THREE.Vector3, dt: number) {
    const d = p.clone().sub(this.root.position);
    let diff = Math.atan2(d.x, d.z) - this.yaw;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    this.yaw += diff * Math.min(1, dt * 5);
  }

  private walk(dt: number) {
    const next = this.path[0];
    if (!next) {
      this.walking = false;
      this.spot = this.target;
      return;
    }
    // hop up onto / down from furniture at the end of the walk
    const target = this.path.length === 1 && this.target ? this.target.y : 0;
    const p = this.root.position;
    const d = new THREE.Vector3(next.x - p.x, 0, next.z - p.z);
    const len = d.length();
    if (len < 0.1) { this.path.shift(); return; }
    this.faceTowards(next, dt);
    const speed = this.followUntil > this.t ? 1.1 : 0.6;
    const step = Math.min(len, speed * dt);
    p.addScaledVector(d.normalize(), step);
    p.y += ((len < 0.5 ? target : 0) - p.y) * Math.min(1, dt * 6);
    this.phase += step * 5.5;
    this.status = this.followUntil > this.t ? '跟著你' : '走來走去';
  }

  private applyPose(dt: number, her: THREE.Vector3) {
    const t = this.t;
    const tailSway = Math.sin(t * (this.walking ? 3 : 0.9)) * (this.pose === 'curl' ? 6 : 14);
    const o: Record<string, [number, number, number]> = {
      tail1: [-10, tailSway, 0], tail2: [-8, tailSway * 1.2, 0], tail3: [-6, tailSway * 1.4, 0], tail4: [-4, tailSway * 1.6, 0],
      chest: [Math.sin(t * 2.1) * 1.5, 0, 0],
    };
    let y = 0;
    let pitch = 0;
    // head turns towards her when she is close
    const rel = her.clone().sub(this.root.position);
    const near = rel.length() < 3;
    let yawToHer = Math.atan2(rel.x, rel.z) - this.yaw;
    yawToHer = Math.atan2(Math.sin(yawToHer), Math.cos(yawToHer));
    const look = near ? THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(yawToHer), -60, 60) : Math.sin(t * 0.3) * 15;
    if (this.walking) {
      const ph = this.phase * Math.PI;
      const s = Math.sin(ph);
      Object.assign(o, {
        'upperarm.L': [26 * s, 0, 0], 'upperarm.R': [-26 * s, 0, 0], 'forearm.L': [-Math.max(0, -s) * 40, 0, 0],
        'forearm.R': [-Math.max(0, s) * 40, 0, 0], 'thigh.L': [-26 * s, 0, 0], 'thigh.R': [26 * s, 0, 0],
        'shin.L': [Math.max(0, s) * 40, 0, 0], 'shin.R': [Math.max(0, -s) * 40, 0, 0], head: [0, 0, 0],
        tail1: [-25, Math.sin(t * 3) * 12, 0], tail2: [-10, Math.sin(t * 3 - 0.5) * 14, 0],
      });
      y = Math.abs(Math.cos(ph)) * 0.008;
    } else if (this.pose === 'sit') {
      pitch = -32;
      Object.assign(o, { 'upperarm.L': [32, 0, 0], 'upperarm.R': [32, 0, 0], 'thigh.L': [-60, 0, 0], 'thigh.R': [-60, 0, 0],
        'shin.L': [110, 0, 0], 'shin.R': [110, 0, 0], neck: [20, 0, 0], head: [12, look, 0],
        tail1: [40, 30, 0], tail2: [20, 30, 0], tail3: [0, 25, 0] });
      y = -0.02;
    } else if (this.pose === 'loaf' || this.pose === 'groom') {
      Object.assign(o, { 'upperarm.L': [-70, 0, 0], 'upperarm.R': [-70, 0, 0], 'forearm.L': [140, 0, 0], 'forearm.R': [140, 0, 0],
        'thigh.L': [-80, 0, 0], 'thigh.R': [-80, 0, 0], 'shin.L': [150, 0, 0], 'shin.R': [150, 0, 0], head: [6, look, 0],
        tail1: [30, 50, 0], tail2: [10, 40, 0], tail3: [0, 35, 0] });
      if (this.pose === 'groom') Object.assign(o, { neck: [40 + Math.sin(t * 5) * 10, 20, 0], head: [30, 40, 0] });
      y = -0.15;
    } else if (this.pose === 'curl') {
      Object.assign(o, { 'upperarm.L': [-70, 0, 0], 'upperarm.R': [-70, 0, 0], 'forearm.L': [140, 0, 0], 'forearm.R': [140, 0, 0],
        'thigh.L': [-80, 0, 0], 'thigh.R': [-80, 0, 0], 'shin.L': [150, 0, 0], 'shin.R': [150, 0, 0],
        spine: [0, 22, 0], chest: [Math.sin(t * 1.4) * 2, 24, 0], neck: [20, 30, 0], head: [30, 35, 0],
        tail1: [20, 55, 0], tail2: [10, 45, 0], tail3: [0, 45, 0], tail4: [0, 40, 0] });
      y = -0.16;
    }
    if (!this.walking && this.pose !== 'curl' && this.petUntil) o.head = [20, look, 10 * Math.sin(t * 2)];
    const k = Math.min(1, dt * (this.walking ? 10 : 3));
    const deg = Math.PI / 180;
    const q = new THREE.Quaternion(), e = new THREE.Euler();
    const names = new Set([...this.cur.keys(), ...Object.keys(o)]);
    for (const n of names) {
      const tv = o[n] ?? [0, 0, 0];
      let v = this.cur.get(n);
      if (!v) { v = new THREE.Vector3(); this.cur.set(n, v); }
      v.lerp(new THREE.Vector3(tv[0] * deg, tv[1] * deg, tv[2] * deg), k);
      const b = this.bones.get(n.replace(/[[\].:/]/g, ''));
      if (!b) continue;
      const R = this.restRoot.get(b)!;
      q.setFromEuler(e.set(v.x, v.y, v.z, 'YXZ'));
      b.quaternion.copy(this.restLocal.get(b)!).multiply(R.clone().invert().multiply(q).multiply(R));
    }
    this.model.position.y += (y - this.model.position.y) * k;
    this.model.rotation.x += (pitch * deg - this.model.rotation.x) * k;
    this.root.rotation.set(0, this.yaw, 0);
  }
}
