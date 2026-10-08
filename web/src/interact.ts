import * as THREE from 'three';
import type { World, V3 } from './world';
import type { Player, Box2 } from './controls';
import { Music } from './audio';
import { store } from './store';
import { giftSheet, keepsakeBook, lettersSheet, openBook, photoSheet, pinnedLetterBook } from './ui';

/** Blender (x, y, z) -> three (x, z, -y). */
const fromBlender = (v: V3) => new THREE.Vector3(v[0], v[2], -v[1]);

interface Tween { obj: Record<string, number>; key: string; from: number; to: number; t: number; dur: number; done?: () => void }

export class Home {
  private tweens: Tween[] = [];
  private open = new Map<THREE.Object3D, boolean>();
  private lampOn = new Map<string, number>();
  private lampLights = new Map<string, THREE.PointLight>();
  private music = new Music();
  private platter: THREE.Object3D | null = null;
  private tv: { mesh: THREE.Mesh; canvas: HTMLCanvasElement; tex: THREE.CanvasTexture; on: number; t: number } | null = null;
  private water: THREE.Mesh | null = null;
  private photoImgs: HTMLImageElement[] = [];
  private heart: THREE.Mesh | null = null;
  private curtainsClosed = new Map<string, boolean>();
  lightsMaster = 1;
  onLightsChanged: () => void = () => {};

  constructor(private world: World, private player: Player, private scene: THREE.Scene) {
    this.platter = world.byName.get('turntable_platter') ?? null;
    this.heart = (world.byName.get('gift_heart') as THREE.Mesh) ?? null;
    this.setupLamps();
    this.setupTv();
    this.setupPhotos();
    player.dynamicColliders = () => this.doorColliders();
  }

  /** Root object carrying the interact metadata for a hit mesh. */
  rootOf(o: THREE.Object3D): THREE.Object3D | null {
    let p: THREE.Object3D | null = o;
    while (p) {
      if (p.userData?.interact) return p;
      p = p.parent;
    }
    return null;
  }

  label(root: THREE.Object3D): string {
    const kind = root.userData.interact as string;
    const base = root.userData.label as string;
    const verb: Record<string, string> = {
      door: this.open.get(root) ? '關上' : '打開', lamp: this.lampOn.get(root.userData.light) ? '關燈' : '開燈',
      curtains: this.curtainsClosed.get(root.userData.target) ? '拉開' : '拉上', tv: this.tv?.on ? '關掉' : '打開',
      music: this.music.playing ? '停止' : '播放', faucet: this.water?.visible ? '關水' : '開水', sit: '', letters: '翻閱',
      photo: '看看', gift: this.open.get(root) ? '再看一次' : '拆開', keepsake: '翻閱', letter: '讀信',
    };
    return `<b>${verb[kind] ?? ''}</b>${base}`;
  }

  activate(root: THREE.Object3D) {
    const d = root.userData;
    switch (d.interact as string) {
      case 'door': {
        const isOpen = !this.open.get(root);
        this.open.set(root, isOpen);
        this.tween(root.rotation as unknown as Record<string, number>, 'y', isOpen ? THREE.MathUtils.degToRad(d.angle) : 0, 0.9);
        break;
      }
      case 'gift': {
        const isOpen = !this.open.get(root);
        if (!isOpen) { giftSheet(() => {}); break; }
        this.open.set(root, true);
        this.tween(root.rotation as unknown as Record<string, number>, 'x', THREE.MathUtils.degToRad(d.angle), 1.2);
        if (this.heart) {
          const m = this.heart.material as THREE.MeshStandardMaterial;
          m.emissive.setRGB(1, 0.2, 0.3);
          this.tween(m as unknown as Record<string, number>, 'emissiveIntensity', 2.5, 1.5);
          this.tween(this.heart.position as unknown as Record<string, number>, 'y', this.heart.position.y + 0.12, 1.6);
        }
        setTimeout(() => giftSheet(() => {}), 1100);
        break;
      }
      case 'lamp': this.toggleLamp(d.light as string); break;
      case 'curtains': this.toggleCurtains(d.target as string); break;
      case 'tv': if (this.tv) this.tween(this.tv as unknown as Record<string, number>, 'on', this.tv.on > 0.5 ? 0 : 1, 0.6); break;
      case 'music': this.music.playing ? this.music.stop() : this.music.start(); break;
      case 'faucet': this.toggleFaucet(d.spout as V3); break;
      case 'letters': lettersSheet(); break;
      case 'keepsake': {
        const b = keepsakeBook(d.index as number);
        if (b) {
          // lift the keepsake a little while its book is open
          const y0 = root.position.y;
          this.tween(root.position as unknown as Record<string, number>, 'y', y0 + 0.04, 0.5);
          openBook(b, () => this.tween(root.position as unknown as Record<string, number>, 'y', y0, 0.5));
        }
        break;
      }
      case 'letter': {
        const b = pinnedLetterBook(d.index as number);
        if (b) openBook(b);
        break;
      }
      case 'photo': {
        const i = d.index as number;
        photoSheet(i, this.photoImgs[i]?.src ?? '', (url) => this.applyPhoto(i, url));
        break;
      }
      case 'sit': {
        const seat = this.world.byName.get(d.seat as string);
        if (seat) {
          const p = new THREE.Vector3();
          seat.getWorldPosition(p);
          this.player.sit(p, fromBlender(d.look_at as V3));
          document.getElementById('stand')!.hidden = false;
        }
        break;
      }
    }
  }

  /** Where to stand to use an interactable. */
  approachPoint(root: THREE.Object3D, from: THREE.Vector3): THREE.Vector3 {
    const box = new THREE.Box3().setFromObject(root);
    const c = box.getCenter(new THREE.Vector3());
    const dir = new THREE.Vector3(from.x - c.x, 0, from.z - c.z);
    if (dir.lengthSq() < 1e-4) dir.set(1, 0, 0);
    dir.normalize();
    const reach = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) / 2 + 0.75;
    return new THREE.Vector3(c.x + dir.x * reach, 0, c.z + dir.z * reach);
  }

  // Lamps --------------------------------------------------------------------
  private setupLamps() {
    const groups = new Set<string>();
    for (const e of this.world.emitters) if (e.group) groups.add(e.group);
    for (const it of this.world.manifest.interactables) if (it.kind === 'lamp') groups.add(it.light as string);
    for (const g of groups) {
      this.lampOn.set(g, 1);
      // a small real-time light lets toggled lamps glow onto nearby surfaces
      const src = [...this.world.byName.values()].find((o) => o.userData.lamp_group === g);
      if (src) {
        const p = new THREE.Vector3();
        src.getWorldPosition(p);
        const l = new THREE.PointLight(0xffc98a, 0, 3.2, 2);
        l.position.copy(p).add(new THREE.Vector3(0, -0.12, 0));
        this.scene.add(l);
        this.lampLights.set(g, l);
      }
    }
  }

  toggleLamp(g: string) {
    const on = (this.lampOn.get(g) ?? 1) > 0.5 ? 0 : 1;
    this.lampOn.set(g, on);
    if (on && this.lightsMaster < 0.5) {
      // turning a lamp on in the dark also brings the home lights up
      this.lightsMaster = 1;
      this.onLightsChanged();
    }
  }

  setLightsMaster(on: boolean) {
    this.lightsMaster = on ? 1 : 0;
    for (const g of this.lampOn.keys()) this.lampOn.set(g, this.lightsMaster);
    this.onLightsChanged();
  }

  /** Called every frame with the animated global light level and night factor. */
  updateEmitters(lights: number, night: number) {
    const lit = lights * (0.25 + 0.75 * night);
    for (const e of this.world.emitters) {
      const lamp = e.group ? (this.lampOn.get(e.group) ?? 1) : 1;
      const target = e.strength * lit * lamp;
      e.material.emissiveIntensity += (target - e.material.emissiveIntensity) * 0.15;
    }
    for (const [g, l] of this.lampLights) {
      const target = (this.lampOn.get(g) ?? 1) * night * 1.6 * (lights > 0.05 ? 1 : 0.6);
      l.intensity += (target - l.intensity) * 0.15;
    }
  }

  // Curtains -------------------------------------------------------------------
  toggleCurtains(target: string, force?: boolean) {
    const closed = force ?? !this.curtainsClosed.get(target);
    this.curtainsClosed.set(target, closed);
    for (const [name, o] of this.world.byName) {
      if (name.startsWith(target) && o.userData.curtain) {
        this.tween(o.scale as unknown as Record<string, number>, 'x', closed ? 1 : o.userData.open_scale, 2.4);
      }
    }
  }
  allCurtains() {
    const close = !this.curtainsClosed.get('curtain_living');
    this.toggleCurtains('curtain_living', close);
    this.toggleCurtains('curtain_bed', close);
  }

  // TV -------------------------------------------------------------------------
  private setupTv() {
    const mesh = this.world.byName.get('tv_screen') as THREE.Mesh | undefined;
    if (!mesh) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 576;
    const tex = new THREE.CanvasTexture(canvas);
    tex.flipY = false;
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
    mat.emissive = new THREE.Color(1, 1, 1);
    mat.emissiveMap = tex;
    mat.emissiveIntensity = 0;
    mesh.material = mat;
    this.tv = { mesh, canvas, tex, on: 0, t: 0 };
  }

  private drawTv(dt: number) {
    const tv = this.tv!;
    const mat = tv.mesh.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = tv.on * 1.1;
    if (tv.on < 0.01) return;
    tv.t += dt;
    const ctx = tv.canvas.getContext('2d')!;
    const W = tv.canvas.width, H = tv.canvas.height;
    const imgs = this.photoImgs.filter((i) => i.complete && i.naturalWidth);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    if (imgs.length) {
      const slide = 7;
      const i = Math.floor(tv.t / slide) % imgs.length;
      const k = (tv.t % slide) / slide;
      const img = imgs[i];
      const s = Math.max(W / img.naturalWidth, H / img.naturalHeight) * (1.05 + 0.08 * k);
      const w = img.naturalWidth * s, h = img.naturalHeight * s;
      ctx.globalAlpha = Math.min(1, (tv.t % slide) / 1.2, (slide - (tv.t % slide)) / 1.2);
      ctx.drawImage(img, (W - w) / 2 - k * 30, (H - h) / 2, w, h);
      ctx.globalAlpha = 1;
    }
    const g = ctx.createLinearGradient(0, H * 0.6, 0, H);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.65)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,245,230,0.92)';
    ctx.font = 'italic 54px "Cormorant Garamond", Georgia, serif';
    ctx.fillText('Dear V', 56, H - 70);
    ctx.font = '22px "Noto Sans TC", sans-serif';
    const now = new Date();
    ctx.fillText(`${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}  ${now.toTimeString().slice(0, 5)}`, 58, H - 34);
    tv.tex.needsUpdate = true;
  }

  // Photos -----------------------------------------------------------------------
  private setupPhotos() {
    const saved = store.photos();
    for (const it of this.world.manifest.interactables) {
      if (it.kind !== 'photo') continue;
      const i = it.index as number;
      const mesh = this.world.byName.get(it.name) as THREE.Mesh | undefined;
      if (!mesh) continue;
      const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
      mesh.material = mat;
      const img = new Image();
      if (saved[i]) {
        img.src = saved[i];
        this.applyPhoto(i, saved[i]);
      } else if (mat.map?.image) {
        // draw the embedded placeholder into an <img> so the TV slideshow can use it
        const src = mat.map.image as ImageBitmap | HTMLImageElement;
        const c = document.createElement('canvas');
        c.width = (src as HTMLImageElement).width;
        c.height = (src as HTMLImageElement).height;
        c.getContext('2d')!.drawImage(src as CanvasImageSource, 0, 0);
        img.src = c.toDataURL('image/jpeg', 0.85);
      }
      this.photoImgs[i] = img;
    }
  }

  applyPhoto(i: number, url: string) {
    const it = this.world.manifest.interactables.find((x) => x.kind === 'photo' && x.index === i);
    const mesh = it && (this.world.byName.get(it.name) as THREE.Mesh | undefined);
    if (!mesh) return;
    const img = new Image();
    img.onload = () => {
      const tex = new THREE.Texture(img);
      tex.flipY = false;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.map = tex;
      mat.needsUpdate = true;
      this.photoImgs[i] = img;
    };
    img.src = url;
  }

  // Faucet ---------------------------------------------------------------------------
  private toggleFaucet(spout: V3) {
    if (!this.water) {
      const p = fromBlender(spout);
      const h = p.y - 0.94;
      const m = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.009, h, 10, 1, true),
        new THREE.MeshStandardMaterial({ color: 0xcfe8ff, roughness: 0.05, transparent: true, opacity: 0.55, emissive: 0x335566, emissiveIntensity: 0.4 }),
      );
      m.position.set(p.x, p.y - h / 2, p.z);
      m.visible = false;
      this.scene.add(m);
      this.water = m;
    }
    this.water.visible = !this.water.visible;
  }

  // Doors as dynamic colliders -------------------------------------------------------
  private doorColliders(): Box2[] {
    const out: Box2[] = [];
    const door = this.world.byName.get('bedroom_door');
    if (door && !this.open.get(door)) {
      const b = new THREE.Box3().setFromObject(door);
      out.push({ min: [b.min.x - 0.04, b.min.z], max: [b.max.x + 0.04, b.max.z] });
    }
    return out;
  }

  // Tweens ----------------------------------------------------------------------------
  tween(obj: Record<string, number>, key: string, to: number, dur: number, done?: () => void) {
    this.tweens = this.tweens.filter((t) => !(t.obj === obj && t.key === key));
    this.tweens.push({ obj, key, from: obj[key], to, t: 0, dur, done });
  }

  update(dt: number) {
    for (const tw of this.tweens) {
      tw.t = Math.min(1, tw.t + dt / tw.dur);
      const k = tw.t < 0.5 ? 4 * tw.t ** 3 : 1 - (-2 * tw.t + 2) ** 3 / 2;
      tw.obj[tw.key] = tw.from + (tw.to - tw.from) * k;
      if (tw.t >= 1) tw.done?.();
    }
    this.tweens = this.tweens.filter((t) => t.t < 1);
    if (this.platter && this.music.playing) this.platter.rotation.y -= dt * 3.5;
    if (this.tv) this.drawTv(dt);
    if (this.water?.visible) this.water.scale.x = 1 + Math.sin(performance.now() * 0.03) * 0.08;
    if (this.heart && this.heart.position) this.heart.rotation.y += dt * 1.2;
  }
}
