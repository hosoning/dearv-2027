import * as THREE from 'three';
import type { World } from './world';
import type { Player, Box2 } from './controls';
import { Music, MusicBox } from './audio';
import { store } from './store';
import { getContent, giftSheet, keepsakeCaption, lettersSheet, openBook, photoSheet, pinnedLetterBook, travelSheet } from './ui';
import type { Inspector } from './inspect';
import { Desktop, travelView } from './desktop';


interface Tween { obj: Record<string, number>; key: string; from: number; to: number; t: number; dur: number; done?: () => void }

export class Home {
  private tweens: Tween[] = [];
  private open = new Map<THREE.Object3D, boolean>();
  private lampOn = new Map<string, number>();
  private lampLights = new Map<string, THREE.PointLight>();
  private music = new Music();
  private musicBox = new MusicBox();
  private streams = new Map<string, THREE.Mesh>();
  private bath: { water: THREE.Mesh; full: boolean; y0: number } | null = null;
  private pc: { canvas: HTMLCanvasElement; tex: THREE.CanvasTexture; t: number } | null = null;
  desktop: Desktop;
  private platter: THREE.Object3D | null = null;
  private tv: { mesh: THREE.Mesh; canvas: HTMLCanvasElement; tex: THREE.CanvasTexture; on: number; t: number } | null = null;
  private photoImgs: HTMLImageElement[] = [];
  private heart: THREE.Mesh | null = null;
  private curtainsClosed = new Map<string, boolean>();
  lightsMaster = 1;
  onLightsChanged: () => void = () => {};
  onSleep: () => void = () => {};
  onToast: (msg: string) => void = () => {};
  private autoOpened = new Set<THREE.Object3D>();
  private autoDoors: { root: THREE.Object3D; center: THREE.Vector3 }[] = [];
  private spots: { root: THREE.Object3D; box: THREE.Box3; center: THREE.Vector3 }[] = [];
  private burners: THREE.Mesh[] = [];
  private burnerOn = false;
  private shower: THREE.Group | null = null;
  private steam: { mesh: THREE.Mesh; t: number; origin: THREE.Vector3 }[] = [];

  constructor(private world: World, private player: Player, private scene: THREE.Scene, private inspector: Inspector) {
    this.platter = world.byName.get('turntable_platter') ?? null;
    this.heart = (world.byName.get('gift_heart') as THREE.Mesh) ?? null;
    this.setupLamps();
    this.setupTv();
    this.setupPhotos();
    this.setupBath();
    this.setupComputer();
    this.setupTravelPins();
    this.desktop = new Desktop(getContent, {
      photos: () => this.photoImgs.map((i) => i.src).filter(Boolean),
      music: { playing: () => this.music.playing, toggle: () => (this.music.playing ? this.music.stop() : this.music.start()) },
    });
    player.dynamicColliders = () => this.doorColliders();
    this.setupSpots();
    this.setupBurners();
  }

  /** Every interactable with its (closed-state) bounds, for the proximity buttons and auto doors. */
  private setupSpots() {
    const seen = new Set<THREE.Object3D>();
    for (const it of this.world.manifest.interactables) {
      const o = this.world.byName.get(it.name);
      if (!o || seen.has(o)) continue;
      seen.add(o);
      o.updateWorldMatrix(true, true);
      const box = new THREE.Box3().setFromObject(o);
      if (box.isEmpty()) {
        // a bare hinge / root: use its children or its own position
        const p = o.getWorldPosition(new THREE.Vector3());
        box.setFromCenterAndSize(p, new THREE.Vector3(0.3, 0.3, 0.3));
      }
      const center = box.getCenter(new THREE.Vector3());
      this.spots.push({ root: o, box, center });
      if (o.userData.interact === 'door' && o.userData.auto) this.autoDoors.push({ root: o, center });
    }
  }

  /** Interactables near the player, nearest first (for the on-screen buttons). */
  nearby(pos: THREE.Vector3, dir: THREE.Vector3, solid: THREE.Object3D[], max = 4): THREE.Object3D[] {
    const out: { root: THREE.Object3D; d: number }[] = [];
    const ray = new THREE.Raycaster();
    const eye = new THREE.Vector3(pos.x, 1.5, pos.z);
    for (const s of this.spots) {
      const k = s.root.userData.interact as string;
      if (k === 'photo' && out.length > 6) continue;
      // horizontal distance to the bounds
      const cx = THREE.MathUtils.clamp(pos.x, s.box.min.x, s.box.max.x);
      const cz = THREE.MathUtils.clamp(pos.z, s.box.min.z, s.box.max.z);
      const d = Math.hypot(pos.x - cx, pos.z - cz);
      if (d > 1.35) continue;
      const to = new THREE.Vector3(s.center.x - pos.x, 0, s.center.z - pos.z);
      const len = to.length();
      const facing = len > 1e-3 ? to.normalize().dot(dir) : 1;
      if (len > 0.5 && facing < 0.3 && d > 0.35) continue;
      // something solid in between (a wall)? aim at the closest point, slightly above the floor
      const target = new THREE.Vector3(cx, THREE.MathUtils.clamp(1.0, s.box.min.y, s.box.max.y), cz);
      const v = target.clone().sub(eye);
      const dist = v.length();
      if (dist > 0.3) {
        ray.set(eye, v.normalize());
        ray.far = dist - 0.05;
        const hit = ray.intersectObjects(solid, false)[0];
        if (hit && this.rootOf(hit.object) !== s.root) {
          // allow hits on the object's own parts and on things the object sits inside of
          const hb = new THREE.Box3().setFromObject(hit.object);
          if (!hb.containsPoint(target)) continue;
        }
      }
      // what you are facing comes first, then what is closest
      out.push({ root: s.root, d: d + 1.2 * (1 - facing) - (k === 'door' && s.root.userData.auto ? 0.4 : 0) });
    }
    out.sort((a, b) => a.d - b.d);
    return out.slice(0, max).map((o) => o.root);
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
      door: this.open.get(root) ? '關上' : '打開', drawer: this.open.get(root) ? '推回' : '拉開', lie: '', sleep: '',
      hob: this.burnerOn ? '關火' : '開火', coffee: '', shower: this.shower?.visible ? '關掉' : '打開', garment: '拿起來看',
      lamp: this.lampOn.get(root.userData.light) ? '關燈' : '開燈',
      curtains: this.curtainsClosed.get(root.userData.target) ? '拉開' : '拉上', tv: this.tv?.on ? '關掉' : '打開',
      music: this.music.playing ? '停止' : '播放', faucet: this.streams.get(root.userData.spout)?.visible ? '關水' : '開水',
      sit: '', letters: '翻閱', photo: '看看', gift: this.open.get(root) ? '再看一次' : '拆開', keepsake: '拿起來看',
      letter: '讀信', snowglobe: '拿起來看 ·', computer: '', travel: '看看', bath: this.bath?.full ? '放掉水' : '放水',
    };
    return `<b>${verb[kind] ?? ''}</b>${base}`;
  }

  activate(root: THREE.Object3D) {
    const d = root.userData;
    switch (d.interact as string) {
      case 'door': this.autoOpened.delete(root); this.setDoor(root, !this.open.get(root)); break;
      case 'drawer': {
        const isOpen = !this.open.get(root);
        this.open.set(root, isOpen);
        const p0 = (d._p0 ??= root.position.toArray()) as number[];
        const sl = d.slide as number[];
        const k = isOpen ? 1 : 0;
        const pos = root.position as unknown as Record<string, number>;
        this.tween(pos, 'x', p0[0] + sl[0] * k, 0.5);
        this.tween(pos, 'y', p0[1] + sl[2] * k, 0.5);
        this.tween(pos, 'z', p0[2] - sl[1] * k, 0.5);
        break;
      }
      case 'hob': this.toggleBurners(); break;
      case 'coffee': {
        const c = new THREE.Box3().setFromObject(root).getCenter(new THREE.Vector3());
        this.puff(new THREE.Vector3(c.x, c.y - 0.12, c.z), 6);
        this.onToast('咖啡沖好了 ☕');
        break;
      }
      case 'shower': this.toggleShower(d.spout as string); break;
      case 'garment': {
        // the broad side of a hanging garment is across its thinner horizontal extent
        const body = root.children.find((c) => c.name.endsWith('_body')) ?? root;
        const sz = new THREE.Box3().setFromObject(body).getSize(new THREE.Vector3());
        const face = sz.x < sz.z ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1);
        this.inspector.open(root, { title: d.label as string, story: '拖動轉一轉，看看布料和摺痕' }, { face });
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
      case 'faucet': this.toggleStream(d.spout as string); break;
      case 'letters': lettersSheet(); break;
      case 'keepsake':
      case 'snowglobe': {
        const cap = keepsakeCaption(d.index as number) ?? { title: d.label as string };
        const lantern = d.interact === 'snowglobe';
        if (lantern) this.musicBox.start();
        this.inspector.open(root, cap, { onClose: () => { if (lantern) this.musicBox.stop(); } });
        break;
      }
      case 'computer': this.desktop.show(); break;
      case 'travel': travelSheet((el) => travelView(el, getContent().trips ?? [])); break;
      case 'bath': this.toggleBath(); break;
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
      case 'lie':
      case 'sleep':
      case 'sit': {
        const seat = this.world.byName.get(d.seat as string);
        if (seat) {
          const p = new THREE.Vector3();
          seat.getWorldPosition(p);
          const look = new THREE.Vector3();
          const t = this.world.byName.get(d.look as string);
          if (t) t.getWorldPosition(look); else look.copy(p).add(new THREE.Vector3(1, 0, 0));
          this.player.sit(p, look);
          document.getElementById('stand')!.hidden = false;
          if (d.interact === 'sleep') setTimeout(() => this.onSleep(), 1500);
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

  // Water: faucets, tub filler, bath ------------------------------------------------
  private toggleStream(spout: string) {
    let m = this.streams.get(spout);
    if (!m) {
      const o = this.world.byName.get(spout);
      if (!o) return;
      const p = new THREE.Vector3();
      o.getWorldPosition(p);
      // fall until the first surface below (basin, sink or tub floor)
      const ray = new THREE.Raycaster(p.clone().add(new THREE.Vector3(0, -0.02, 0)), new THREE.Vector3(0, -1, 0), 0, 2);
      const hits = ray.intersectObjects(this.world.interior.children, true).filter((h) => !h.object.userData.bathwater);
      const h = Math.max(0.05, hits[0]?.distance ?? 0.3);
      m = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.009, h, 10, 1, true),
        new THREE.MeshStandardMaterial({ color: 0xcfe8ff, roughness: 0.05, transparent: true, opacity: 0.55, emissive: 0x335566, emissiveIntensity: 0.4 }),
      );
      m.position.set(p.x, p.y - h / 2, p.z);
      m.visible = false;
      this.scene.add(m);
      this.streams.set(spout, m);
    }
    m.visible = !m.visible;
  }

  private setupBath() {
    let water: THREE.Mesh | null = null;
    this.world.interior.traverse((o) => { if (o.userData.bathwater) water = o as THREE.Mesh; });
    if (!water) return;
    const w = water as THREE.Mesh;
    w.material = new THREE.MeshStandardMaterial({ color: 0xbfe3ea, roughness: 0.04, metalness: 0, transparent: true,
      opacity: 0.6, emissive: 0x1d3a44, emissiveIntensity: 0.25, depthWrite: false });
    w.visible = false;
    this.bath = { water: w, full: false, y0: w.position.y };
  }

  private toggleBath() {
    const b = this.bath;
    if (!b) return;
    b.full = !b.full;
    this.toggleStream('tub_spout');
    if (b.full) {
      b.water.visible = true;
      b.water.position.y = b.y0 - 0.3;
      this.tween(b.water.position as unknown as Record<string, number>, 'y', b.y0, 6, () => {
        const s = this.streams.get('tub_spout');
        if (s?.visible) s.visible = false;
      });
    } else {
      this.tween(b.water.position as unknown as Record<string, number>, 'y', b.y0 - 0.3, 3, () => { b.water.visible = false; });
    }
  }

  // Study computer screen (live desktop on the display) + pins on the travel map --------
  private setupComputer() {
    const mesh = this.world.byName.get('pc_screen') as THREE.Mesh | undefined;
    if (!mesh) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 584;
    const tex = new THREE.CanvasTexture(canvas);
    tex.flipY = false;
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
    mat.emissive = new THREE.Color(1, 1, 1);
    mat.emissiveMap = tex;
    mat.emissiveIntensity = 0.9;
    mesh.material = mat;
    this.pc = { canvas, tex, t: 99 };
  }

  private drawComputer(dt: number) {
    const pc = this.pc!;
    pc.t += dt;
    if (pc.t < 20) return;
    pc.t = 0;
    const c = pc.canvas.getContext('2d')!;
    const W = pc.canvas.width, H = pc.canvas.height;
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1d2b45'); g.addColorStop(0.6, '#c98a6b'); g.addColorStop(1, '#2a2230');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(0, 0, W, 34);
    c.fillStyle = '#fff'; c.font = '20px "Noto Sans TC", sans-serif';
    const now = new Date();
    c.fillText(`${now.getMonth() + 1}月${now.getDate()}日 ${now.toTimeString().slice(0, 5)}`, W - 190, 24);
    c.font = 'italic 64px "Cormorant Garamond", Georgia, serif';
    c.fillText('Dear V', 60, H / 2);
    const apps = ['相簿', '旅行', '信件', '便條', '音樂'];
    c.fillStyle = 'rgba(255,255,255,0.22)';
    c.fillRect(W / 2 - 260, H - 96, 520, 76);
    apps.forEach((a, i) => {
      c.fillStyle = ['#e8b26a', '#6aa9c9', '#d98c8c', '#e9d98f', '#a98fd9'][i];
      c.fillRect(W / 2 - 240 + i * 100, H - 86, 56, 56);
      c.fillStyle = '#fff'; c.font = '16px "Noto Sans TC", sans-serif';
      c.fillText(a, W / 2 - 232 + i * 100, H - 12);
    });
    pc.tex.needsUpdate = true;
  }

  private setupTravelPins() {
    const map = this.world.byName.get('travel_map');
    const trips = getContent().trips ?? [];
    if (!map || !trips.length) return;
    const box = new THREE.Box3().setFromObject(map);
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xb3262e, roughness: 0.3, emissive: 0x3a0508 });
    for (const t of trips) {
      if (t.lat == null || t.lon == null) continue;
      // the map faces +z (into the study); u runs along -x of Blender, i.e. +x here
      const u = (t.lon + 180) / 360, v = (90 - t.lat) / 180;
      const pin = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 8), pinMat);
      pin.position.set(THREE.MathUtils.lerp(box.min.x, box.max.x, u), THREE.MathUtils.lerp(box.max.y, box.min.y, v), box.max.z + 0.012);
      this.scene.add(pin);
    }
  }

  // Doors ---------------------------------------------------------------------------
  /** Hinged leaves rotate about their Blender axis (z = vertical hinge, x / y = drop-down). */
  setDoor(root: THREE.Object3D, isOpen: boolean) {
    const d = root.userData;
    this.open.set(root, isOpen);
    const r0 = (d._r0 ??= [root.rotation.x, root.rotation.y, root.rotation.z]) as number[];
    const a = isOpen ? THREE.MathUtils.degToRad(d.angle) : 0;
    const rot = root.rotation as unknown as Record<string, number>;
    const dur = d.auto ? 0.8 : 0.7;
    if (d.axis === 'x') this.tween(rot, 'x', r0[0] + a, dur);
    else if (d.axis === 'y') this.tween(rot, 'z', r0[2] - a, dur);
    else this.tween(rot, 'y', r0[1] + a, dur);
  }

  /** Room doors open as you walk up to them and close again behind you. */
  private autoDoorsUpdate() {
    const p = this.player.pos;
    for (const { root, center } of this.autoDoors) {
      const dist = Math.hypot(p.x - center.x, p.z - center.z);
      const isOpen = !!this.open.get(root);
      if (!isOpen && dist < 1.5) { this.setDoor(root, true); this.autoOpened.add(root); }
      else if (isOpen && this.autoOpened.has(root) && dist > 3.2) { this.setDoor(root, false); this.autoOpened.delete(root); }
    }
  }

  private doorColliders(): Box2[] {
    const out: Box2[] = [];
    for (const { root: door } of this.autoDoors) {
      if (!this.open.get(door)) {
        const b = new THREE.Box3().setFromObject(door);
        out.push({ min: [b.min.x - 0.04, b.min.z - 0.04], max: [b.max.x + 0.04, b.max.z + 0.04] });
      }
    }
    return out;
  }

  // Kitchen hob, shower, steam ------------------------------------------------------------
  private setupBurners() {
    const hob = this.world.byName.get('k_hob');
    hob?.traverse((o) => {
      if (o.userData.burner) {
        const m = o as THREE.Mesh;
        const mat = (m.material as THREE.MeshStandardMaterial).clone();
        mat.emissive = new THREE.Color(1.0, 0.25, 0.05);
        mat.emissiveIntensity = 0;
        m.material = mat;
        this.burners.push(m);
      }
    });
  }

  private toggleBurners() {
    this.burnerOn = !this.burnerOn;
    for (const b of this.burners) {
      this.tween(b.material as unknown as Record<string, number>, 'emissiveIntensity', this.burnerOn ? 2.2 : 0, 1.2);
    }
    if (this.burnerOn) {
      const pot = this.world.byName.get('k_pot');
      if (pot) this.puff(pot.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.1, 0)), 10);
    }
  }

  private toggleShower(spout: string) {
    if (!this.shower) {
      const o = this.world.byName.get(spout);
      if (!o) return;
      const p = o.getWorldPosition(new THREE.Vector3());
      const g = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: 0xd8ecff, roughness: 0.05, transparent: true, opacity: 0.35,
        emissive: 0x335566, emissiveIntensity: 0.3, depthWrite: false });
      const geo = new THREE.CylinderGeometry(0.003, 0.004, p.y, 5, 1, true);
      for (let i = 0; i < 46; i++) {
        const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 0.16;
        const m = new THREE.Mesh(geo, mat);
        m.position.set(p.x + Math.cos(a) * r, p.y / 2, p.z + Math.sin(a) * r);
        m.rotation.z = (Math.random() - 0.5) * 0.06;
        g.add(m);
      }
      g.visible = false;
      this.scene.add(g);
      this.shower = g;
    }
    this.shower.visible = !this.shower.visible;
  }

  /** A few soft rising puffs (coffee, cooking). */
  private puff(origin: THREE.Vector3, n: number) {
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
      m.position.copy(origin);
      this.scene.add(m);
      this.steam.push({ mesh: m, t: -i * 0.35, origin: origin.clone() });
    }
  }

  private updateSteam(dt: number) {
    for (const s of this.steam) {
      s.t += dt;
      const k = Math.max(0, s.t) / 3;
      const m = s.mesh.material as THREE.MeshBasicMaterial;
      m.opacity = s.t < 0 ? 0 : 0.22 * Math.sin(Math.min(1, k) * Math.PI);
      s.mesh.position.set(s.origin.x + Math.sin(s.t * 2 + s.origin.x) * 0.03, s.origin.y + k * 0.45, s.origin.z);
      s.mesh.scale.setScalar(1 + k * 2.5);
    }
    for (const s of this.steam.filter((x) => x.t > 3)) {
      this.scene.remove(s.mesh);
      s.mesh.geometry.dispose();
    }
    this.steam = this.steam.filter((x) => x.t <= 3);
    if (this.burnerOn && Math.random() < dt * 0.8) {
      const pot = this.world.byName.get('k_pot');
      if (pot) this.puff(pot.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.12, 0)), 1);
    }
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
    if (this.pc) this.drawComputer(dt);
    for (const m of this.streams.values()) if (m.visible) m.scale.x = 1 + Math.sin(performance.now() * 0.03) * 0.08;
    if (this.heart && this.heart.position) this.heart.rotation.y += dt * 1.2;
    if (this.shower?.visible) this.shower.children.forEach((c, i) => { c.scale.x = 1 + Math.sin(performance.now() * 0.05 + i) * 0.3; });
    this.updateSteam(dt);
    this.autoDoorsUpdate();
  }
}
