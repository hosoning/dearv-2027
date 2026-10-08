import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export interface Caption { title: string; date?: string; story?: string }

/**
 * Pick up a keepsake: a lit clone floats in front of the viewer over a dimmed home.
 * Drag to turn it, scroll / pinch to bring it closer. The original stays on its shelf.
 */
export class Inspector {
  active = false;
  private scene = new THREE.Scene();
  private cam = new THREE.PerspectiveCamera(32, 1, 0.01, 50);
  private pivot = new THREE.Group();
  private holder = new THREE.Group();
  private yaw = 0.5;
  private pitch = 0.25;
  private dist = 2.4;
  private targetDist = 2.4;
  private drag: { id: number; x: number; y: number } | null = null;
  private pinch: { d: number } | null = null;
  private pointers = new Map<number, { x: number; y: number }>();
  private idle = 0;
  private appear = 0;
  private snow: { points: THREE.Points; box: THREE.Box3; vel: Float32Array } | null = null;
  private onClose: (() => void) | null = null;
  private ui = document.getElementById('inspect')!;

  constructor(private renderer: THREE.WebGLRenderer, private canvas: HTMLCanvasElement) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.9;
    const veil = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      transparent: true, depthTest: false, depthWrite: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: 'varying vec2 vUv; void main(){ float r = distance(vUv, vec2(0.5, 0.55)); gl_FragColor = vec4(0.03, 0.025, 0.02, mix(0.55, 0.85, smoothstep(0.1, 0.8, r))); }',
    }));
    veil.frustumCulled = false;
    veil.renderOrder = -10;
    this.scene.add(veil);
    const key = new THREE.DirectionalLight(0xfff2e0, 2.4);
    key.position.set(-1.5, 2.2, 2.5);
    const rim = new THREE.DirectionalLight(0xdfe8ff, 1.2);
    rim.position.set(2, 1.5, -2);
    this.scene.add(key, rim, new THREE.HemisphereLight(0xfff6ea, 0x2a2420, 0.6));
    this.pivot.add(this.holder);
    this.scene.add(this.pivot);
    canvas.addEventListener('pointerdown', this.down, { capture: true });
    canvas.addEventListener('pointermove', this.move, { capture: true });
    canvas.addEventListener('pointerup', this.up, { capture: true });
    canvas.addEventListener('pointercancel', this.up, { capture: true });
    canvas.addEventListener('wheel', (e) => {
      if (!this.active) return;
      e.preventDefault();
      this.targetDist = THREE.MathUtils.clamp(this.targetDist * (1 + e.deltaY * 0.001), 1.1, 4);
    }, { passive: false });
    this.ui.querySelector('[data-close]')!.addEventListener('click', () => this.close());
    window.addEventListener('keydown', (e) => { if (this.active && e.key === 'Escape') this.close(); });
  }

  open(root: THREE.Object3D, caption: Caption, opts: { onClose?: () => void } = {}) {
    this.close(true);
    root.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const clone = root.clone(true);
    // the clone keeps the original world transform, re-centred on the holder
    clone.matrixAutoUpdate = false;
    clone.matrix.copy(root.matrixWorld);
    const s = 0.9 / Math.max(size.x, size.y, size.z, 1e-3);
    this.holder.scale.setScalar(s);
    this.holder.position.copy(center).multiplyScalar(-s);
    clone.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const src = m.material as THREE.MeshStandardMaterial;
      if (o.userData.glass || src.transparent) {
        m.material = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.03, transmission: 0, transparent: true,
          opacity: 0.18, depthWrite: false, envMapIntensity: 1.5 });
        m.renderOrder = 2;
        return;
      }
      const mat = src.clone();
      // drop the baked room lighting: the piece is lit by the studio lights here
      mat.lightMap = null;
      mat.onBeforeCompile = () => {};
      mat.customProgramCacheKey = () => 'inspect';
      mat.envMapIntensity = 1;
      mat.needsUpdate = true;
      m.material = mat;
    });
    this.holder.add(clone);
    this.setupSnow(clone);
    this.yaw = -0.6;
    this.pitch = 0.22;
    this.dist = this.targetDist = 2.3;
    this.appear = 0;
    this.idle = 0;
    this.active = true;
    this.onClose = opts.onClose ?? null;
    (this.ui.querySelector('.ins-title') as HTMLElement).textContent = caption.title;
    (this.ui.querySelector('.ins-date') as HTMLElement).textContent = caption.date ?? '';
    (this.ui.querySelector('.ins-story') as HTMLElement).textContent = caption.story ?? '';
    this.ui.hidden = false;
  }

  close(silent = false) {
    if (!this.active) return;
    this.active = false;
    this.ui.hidden = true;
    this.holder.clear();
    this.snow = null;
    const cb = this.onClose;
    this.onClose = null;
    if (!silent) cb?.();
  }

  private setupSnow(clone: THREE.Object3D) {
    let glass: THREE.Object3D | null = null;
    clone.traverse((o) => { if (o.userData.snowbox) glass = o; });
    if (!glass) return;
    this.holder.updateMatrixWorld(true);
    // box of the glass case in holder-local space (holder carries the fit scale)
    const g = glass as THREE.Object3D;
    const inv = new THREE.Matrix4().copy(this.holder.matrixWorld).invert();
    const box = new THREE.Box3().setFromObject(g).applyMatrix4(inv);
    box.expandByScalar(-0.004);
    const n = 320;
    const pos = new Float32Array(n * 3);
    const vel = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = THREE.MathUtils.lerp(box.min.x, box.max.x, Math.random());
      pos[i * 3 + 1] = THREE.MathUtils.lerp(box.min.y, box.max.y, Math.random());
      pos[i * 3 + 2] = THREE.MathUtils.lerp(box.min.z, box.max.z, Math.random());
      vel[i] = (0.25 + Math.random() * 0.35) * (box.max.y - box.min.y);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const points = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.012 / this.holder.scale.x,
      sizeAttenuation: true, transparent: true, opacity: 0.95, depthWrite: false }));
    points.renderOrder = 3;
    this.holder.add(points);
    const glow = new THREE.PointLight(0xffc27a, 2.5, 3, 2);
    glow.position.copy(box.getCenter(new THREE.Vector3()));
    this.holder.add(glow);
    this.snow = { points, box, vel };
  }

  private down = (e: PointerEvent) => {
    if (!this.active) return;
    e.stopImmediatePropagation();
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      this.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) };
      this.drag = null;
    } else {
      this.drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
    }
    this.idle = 0;
  };

  private move = (e: PointerEvent) => {
    if (!this.active) return;
    e.stopImmediatePropagation();
    if (!this.pointers.has(e.pointerId)) return;
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.pinch && this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      this.targetDist = THREE.MathUtils.clamp(this.targetDist * (this.pinch.d / d), 1.1, 4);
      this.pinch.d = d;
      return;
    }
    if (this.drag && e.pointerId === this.drag.id) {
      this.yaw += (e.clientX - this.drag.x) * 0.008;
      this.pitch = THREE.MathUtils.clamp(this.pitch + (e.clientY - this.drag.y) * 0.006, -1.2, 1.2);
      this.drag.x = e.clientX;
      this.drag.y = e.clientY;
    }
    this.idle = 0;
  };

  private up = (e: PointerEvent) => {
    if (!this.active) return;
    e.stopImmediatePropagation();
    this.pointers.delete(e.pointerId);
    if (this.pointers.size < 2) this.pinch = null;
    if (this.drag?.id === e.pointerId) this.drag = null;
  };

  render(dt: number) {
    if (!this.active) return;
    this.appear = Math.min(1, this.appear + dt * 2.2);
    this.idle += dt;
    if (this.idle > 2.5 && !this.drag) this.yaw += dt * 0.25;
    this.dist += (this.targetDist - this.dist) * Math.min(1, dt * 6);
    const k = 1 - (1 - this.appear) ** 3;
    this.pivot.rotation.set(this.pitch, this.yaw, 0, 'XYZ');
    this.pivot.scale.setScalar(0.6 + 0.4 * k);
    this.pivot.position.y = (1 - k) * -0.3;
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    this.cam.aspect = w / h;
    // on phones the caption card sits below: lift the piece into the upper part of the screen
    this.cam.position.set(0, w < h ? -0.25 : 0, this.dist);
    this.cam.lookAt(0, w < h ? -0.25 : 0, 0);
    this.cam.updateProjectionMatrix();
    if (this.snow) {
      const s = this.snow;
      const a = s.points.geometry.getAttribute('position') as THREE.BufferAttribute;
      const p = a.array as Float32Array;
      const t = performance.now() / 1000;
      const span = s.box.max.x - s.box.min.x;
      for (let i = 0; i < s.vel.length; i++) {
        p[i * 3 + 1] -= s.vel[i] * dt * 0.35;
        p[i * 3] += Math.sin(t * 1.3 + i) * span * 0.02 * dt;
        p[i * 3 + 2] += Math.cos(t * 1.1 + i * 0.7) * span * 0.02 * dt;
        if (p[i * 3 + 1] < s.box.min.y) {
          p[i * 3 + 1] = s.box.max.y;
          p[i * 3] = THREE.MathUtils.lerp(s.box.min.x, s.box.max.x, Math.random());
          p[i * 3 + 2] = THREE.MathUtils.lerp(s.box.min.z, s.box.max.z, Math.random());
        }
      }
      a.needsUpdate = true;
    }
    const auto = this.renderer.autoClear;
    this.renderer.autoClear = false;
    this.renderer.clearDepth();
    this.renderer.render(this.scene, this.cam);
    this.renderer.autoClear = auto;
  }
}
