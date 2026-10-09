import * as THREE from 'three';

export interface Box2 { min: [number, number]; max: [number, number] }

const EYE = 1.6;
const RADIUS = 0.24;

/**
 * Comfortable first-person controls.
 * Desktop: drag to look, WASD / arrows to walk, click floor to walk there.
 * Touch:   left half = floating joystick, right half = look, tap = interact / walk.
 */
export class Player {
  yaw = 0;
  pitch = 0;
  pos = new THREE.Vector3();
  vel = new THREE.Vector3();
  keys = new Set<string>();
  target: THREE.Vector3 | null = null;
  onArrive: (() => void) | null = null;
  seated: { pos: THREE.Vector3; look: THREE.Vector3 } | null = null;
  dynamicColliders: () => Box2[] = () => [];
  bounds: Box2 = { min: [-100, -100], max: [100, 100] };
  private joy = { id: -1, ox: 0, oy: 0, x: 0, y: 0 };
  private look = { id: -1, x: 0, y: 0, moved: 0 };
  private bob = 0;
  private cinematic: { from: THREE.Vector3; to: THREE.Vector3; fromQ: THREE.Quaternion; toQ: THREE.Quaternion; t: number; dur: number } | null = null;

  constructor(
    private camera: THREE.PerspectiveCamera,
    private el: HTMLElement,
    private colliders: Box2[],
    private joyEl: HTMLElement,
    private onTap: (x: number, y: number) => void,
  ) {
    window.addEventListener('keydown', (e) => {
      if ((e.target as HTMLElement).closest('input,textarea')) return;
      this.keys.add(e.code);
      if (/Key[WASD]|Arrow/.test(e.code)) { this.target = null; this.stand(); }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
    el.addEventListener('pointerdown', this.down);
    el.addEventListener('pointermove', this.move);
    el.addEventListener('pointerup', this.up);
    el.addEventListener('pointercancel', this.up);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  spawn(p: THREE.Vector3, look: THREE.Vector3) {
    this.pos.set(p.x, 0, p.z);
    this.faceTowards(look, p.y);
  }

  faceTowards(look: THREE.Vector3, eye = EYE) {
    const d = look.clone().sub(new THREE.Vector3(this.pos.x, eye, this.pos.z));
    this.yaw = Math.atan2(-d.x, -d.z);
    this.pitch = Math.atan2(d.y, Math.hypot(d.x, d.z));
  }

  private path: THREE.Vector3[] = [];
  private nav: Nav | null = null;

  walkTo(p: THREE.Vector3, onArrive: (() => void) | null = null) {
    this.stand();
    this.nav ??= new Nav(this.colliders, this.bounds);
    const goal = new THREE.Vector3(p.x, 0, p.z);
    this.path = this.nav.find(this.pos, goal) ?? [goal];
    this.target = this.path.shift() ?? goal;
    this.onArrive = onArrive;
  }

  private standFrom: THREE.Vector3 | null = null;

  sit(seat: THREE.Vector3, look: THREE.Vector3) {
    this.target = null;
    if (!this.seated) this.standFrom = this.pos.clone();
    this.seated = { pos: seat.clone(), look: look.clone() };
    const toQ = new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().lookAt(seat, look, new THREE.Vector3(0, 1, 0)));
    this.cinematic = {
      from: this.camera.position.clone(), to: seat.clone(), fromQ: this.camera.quaternion.clone(), toQ, t: 0, dur: 1.4,
    };
  }

  stand() {
    if (!this.seated) return;
    const s = this.seated;
    this.seated = null;
    // back to where we stood before sitting down
    if (this.standFrom) this.pos.copy(this.standFrom); else this.pos.set(s.pos.x + 0.7, 0, s.pos.z);
    this.standFrom = null;
    this.faceTowards(s.look);
    this.cinematic = null;
  }

  get isSeated() { return !!this.seated; }

  private down = (e: PointerEvent) => {
    this.el.setPointerCapture(e.pointerId);
    const touch = e.pointerType === 'touch';
    if (touch && e.clientX < window.innerWidth * 0.42 && this.joy.id < 0) {
      this.joy = { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: 0, y: 0 };
      this.joyEl.hidden = false;
      this.joyEl.style.left = `${e.clientX}px`;
      this.joyEl.style.top = `${e.clientY}px`;
      (this.joyEl.firstElementChild as HTMLElement).style.transform = '';
      return;
    }
    if (this.look.id < 0) this.look = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0 };
  };

  private move = (e: PointerEvent) => {
    if (e.pointerId === this.joy.id) {
      const dx = e.clientX - this.joy.ox;
      const dy = e.clientY - this.joy.oy;
      const l = Math.min(1, Math.hypot(dx, dy) / 50);
      const a = Math.atan2(dy, dx);
      this.joy.x = Math.cos(a) * l;
      this.joy.y = Math.sin(a) * l;
      (this.joyEl.firstElementChild as HTMLElement).style.transform = `translate(${this.joy.x * 34}px, ${this.joy.y * 34}px)`;
      if (l > 0.15) { this.target = null; this.stand(); }
      return;
    }
    if (e.pointerId === this.look.id) {
      const dx = e.clientX - this.look.x;
      const dy = e.clientY - this.look.y;
      this.look.x = e.clientX;
      this.look.y = e.clientY;
      this.look.moved += Math.abs(dx) + Math.abs(dy);
      if (this.seated || this.cinematic) return;
      const k = e.pointerType === 'touch' ? 0.005 : 0.0032;
      this.yaw += dx * k;
      this.pitch = THREE.MathUtils.clamp(this.pitch + dy * k, -1.25, 1.25);
    }
  };

  private up = (e: PointerEvent) => {
    if (e.pointerId === this.joy.id) {
      this.joy.id = -1;
      this.joy.x = this.joy.y = 0;
      this.joyEl.hidden = true;
      return;
    }
    if (e.pointerId === this.look.id) {
      if (this.look.moved < 8) this.onTap(e.clientX, e.clientY);
      this.look.id = -1;
    }
  };

  private collide(nx: number, nz: number): [number, number] {
    const boxes = this.colliders.concat(this.dynamicColliders());
    let x = nx, z = nz;
    for (let pass = 0; pass < 2; pass++) {
      for (const b of boxes) {
        const cx = THREE.MathUtils.clamp(x, b.min[0], b.max[0]);
        const cz = THREE.MathUtils.clamp(z, b.min[1], b.max[1]);
        const dx = x - cx, dz = z - cz;
        const d2 = dx * dx + dz * dz;
        if (d2 < RADIUS * RADIUS) {
          const d = Math.sqrt(d2);
          if (d > 1e-5) {
            x = cx + (dx / d) * RADIUS;
            z = cz + (dz / d) * RADIUS;
          } else {
            // centre inside the box: push out along the shallowest axis
            const pushes = [b.min[0] - RADIUS - x, b.max[0] + RADIUS - x, b.min[1] - RADIUS - z, b.max[1] + RADIUS - z];
            const i = pushes.reduce((bi, v, j) => (Math.abs(v) < Math.abs(pushes[bi]) ? j : bi), 0);
            if (i < 2) x += pushes[i]; else z += pushes[i];
          }
        }
      }
    }
    const b = this.bounds;
    return [THREE.MathUtils.clamp(x, b.min[0] + 0.2, b.max[0] - 0.2), THREE.MathUtils.clamp(z, b.min[1] + 0.2, b.max[1] - 0.2)];
  }

  update(dt: number): void {
    if (this.cinematic) {
      const c = this.cinematic;
      c.t = Math.min(1, c.t + dt / c.dur);
      const k = c.t * c.t * (3 - 2 * c.t);
      this.camera.position.lerpVectors(c.from, c.to, k);
      this.camera.quaternion.slerpQuaternions(c.fromQ, c.toQ, k);
      if (c.t >= 1) this.cinematic = null;
      return;
    }
    if (this.seated) return;

    const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
    const wish = new THREE.Vector3();
    const k = this.keys;
    if (k.has('KeyW') || k.has('ArrowUp')) wish.add(fwd);
    if (k.has('KeyS') || k.has('ArrowDown')) wish.sub(fwd);
    if (k.has('KeyD')) wish.add(right);
    if (k.has('KeyA')) wish.sub(right);
    if (k.has('ArrowLeft')) this.yaw += dt * 1.8;
    if (k.has('ArrowRight')) this.yaw -= dt * 1.8;
    if (this.joy.id >= 0) wish.addScaledVector(fwd, -this.joy.y).addScaledVector(right, this.joy.x);

    if (this.target) {
      const d = this.target.clone().sub(this.pos);
      d.y = 0;
      const dist = d.length();
      if (dist < (this.path.length ? 0.3 : 0.12)) {
        if (this.path.length) { this.target = this.path.shift()!; return this.update(0); }
        this.target = null;
        const cb = this.onArrive;
        this.onArrive = null;
        cb?.();
      } else {
        wish.copy(d.normalize()).multiplyScalar(Math.min(1, dist / 0.6) + 0.15);
        // gently turn towards the walking direction
        const want = Math.atan2(-d.x, -d.z);
        let diff = want - this.yaw;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        this.yaw += diff * Math.min(1, dt * 2.5);
      }
    }
    const speed = k.has('ShiftLeft') || k.has('ShiftRight') ? 3.6 : 2.0;
    if (wish.lengthSq() > 1) wish.normalize();
    this.vel.lerp(wish.multiplyScalar(speed), Math.min(1, dt * 9));
    const before = this.pos.clone();
    const [x, z] = this.collide(this.pos.x + this.vel.x * dt, this.pos.z + this.vel.z * dt);
    this.pos.set(x, 0, z);
    const moved = this.pos.distanceTo(before);
    if (this.target && moved < this.vel.length() * dt * 0.2 && this.vel.length() > 0.3) {
      // stuck against furniture: give up gracefully
      this.target = null;
      this.path = [];
      const cb = this.onArrive;
      this.onArrive = null;
      cb?.();
    }
    this.bob += moved * 7.5;
    const bobY = Math.sin(this.bob) * 0.018 * Math.min(1, this.vel.length() / 2);
    this.camera.position.set(this.pos.x, EYE + bobY, this.pos.z);
    this.camera.quaternion.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
  }
}

/**
 * Grid A* over the floor plan (10 cm cells, colliders inflated by the walking radius) so
 * click-to-walk and the "walk to" menu go around furniture and through doorways.
 */
class Nav {
  private res = 0.1;
  private w: number;
  private h: number;
  private x0: number;
  private z0: number;
  private blocked: Uint8Array;

  constructor(colliders: Box2[], bounds: Box2) {
    this.x0 = bounds.min[0];
    this.z0 = bounds.min[1];
    this.w = Math.ceil((bounds.max[0] - bounds.min[0]) / this.res);
    this.h = Math.ceil((bounds.max[1] - bounds.min[1]) / this.res);
    this.blocked = new Uint8Array(this.w * this.h);
    const pad = RADIUS + 0.04;
    for (const b of colliders) {
      const i0 = Math.max(0, Math.floor((b.min[0] - pad - this.x0) / this.res));
      const i1 = Math.min(this.w - 1, Math.ceil((b.max[0] + pad - this.x0) / this.res));
      const j0 = Math.max(0, Math.floor((b.min[1] - pad - this.z0) / this.res));
      const j1 = Math.min(this.h - 1, Math.ceil((b.max[1] + pad - this.z0) / this.res));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) this.blocked[j * this.w + i] = 1;
    }
    for (let i = 0; i < this.w; i++) { this.blocked[i] = 1; this.blocked[(this.h - 1) * this.w + i] = 1; }
    for (let j = 0; j < this.h; j++) { this.blocked[j * this.w] = 1; this.blocked[j * this.w + this.w - 1] = 1; }
  }

  private cell(p: THREE.Vector3): [number, number] {
    return [THREE.MathUtils.clamp(Math.round((p.x - this.x0) / this.res), 0, this.w - 1),
      THREE.MathUtils.clamp(Math.round((p.z - this.z0) / this.res), 0, this.h - 1)];
  }

  /** Nearest free cell (spiral search) — targets often sit on furniture. */
  private free(i: number, j: number): [number, number] | null {
    if (!this.blocked[j * this.w + i]) return [i, j];
    for (let r = 1; r < 25; r++) {
      let best: [number, number] | null = null, bd = 1e9;
      for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
        const a = i + di, b = j + dj;
        if (a < 0 || b < 0 || a >= this.w || b >= this.h || this.blocked[b * this.w + a]) continue;
        const d = di * di + dj * dj;
        if (d < bd) { bd = d; best = [a, b]; }
      }
      if (best) return best;
    }
    return null;
  }

  private los(a: [number, number], b: [number, number]): boolean {
    const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 2);
    for (let k = 1; k < n; k++) {
      const i = Math.round(a[0] + ((b[0] - a[0]) * k) / n), j = Math.round(a[1] + ((b[1] - a[1]) * k) / n);
      if (this.blocked[j * this.w + i]) return false;
    }
    return true;
  }

  find(from: THREE.Vector3, to: THREE.Vector3): THREE.Vector3[] | null {
    const s0 = this.cell(from), g0 = this.cell(to);
    const s = this.free(...s0), g = this.free(...g0);
    if (!s || !g) return null;
    const W = this.w, N = this.w * this.h;
    const gs = new Float32Array(N).fill(Infinity);
    const came = new Int32Array(N).fill(-1);
    const closed = new Uint8Array(N);
    const start = s[1] * W + s[0], goal = g[1] * W + g[0];
    const hfn = (c: number) => { const dx = Math.abs((c % W) - g[0]), dy = Math.abs(Math.floor(c / W) - g[1]); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); };
    // binary heap of [f, cell]
    const heap: number[][] = [];
    const push = (f: number, c: number) => {
      heap.push([f, c]);
      let k = heap.length - 1;
      while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; }
    };
    const pop = () => {
      const top = heap[0], last = heap.pop()!;
      if (heap.length) {
        heap[0] = last;
        let k = 0;
        for (;;) {
          const l = 2 * k + 1, r = l + 1;
          let m = k;
          if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
          if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
          if (m === k) break;
          [heap[m], heap[k]] = [heap[k], heap[m]];
          k = m;
        }
      }
      return top;
    };
    gs[start] = 0;
    push(hfn(start), start);
    let found = false;
    while (heap.length) {
      const [, c] = pop();
      if (closed[c]) continue;
      if (c === goal) { found = true; break; }
      closed[c] = 1;
      const ci = c % W, cj = Math.floor(c / W);
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const ni = ci + di, nj = cj + dj;
        if (ni < 0 || nj < 0 || ni >= W || nj >= this.h) continue;
        const n = nj * W + ni;
        if (this.blocked[n] || closed[n]) continue;
        if (di && dj && (this.blocked[cj * W + ni] || this.blocked[nj * W + ci])) continue;
        const ng = gs[c] + (di && dj ? 1.414 : 1);
        if (ng < gs[n]) { gs[n] = ng; came[n] = c; push(ng + hfn(n), n); }
      }
    }
    if (!found) return null;
    const cells: [number, number][] = [];
    for (let c = goal; c !== -1; c = came[c]) cells.push([c % W, Math.floor(c / W)]);
    cells.reverse();
    // string-pull: keep only the corners needed for line of sight
    const pts: [number, number][] = [cells[0]];
    let anchor = cells[0];
    for (let k = 1; k < cells.length - 1; k++) {
      if (!this.los(anchor, cells[k + 1])) { pts.push(cells[k]); anchor = cells[k]; }
    }
    pts.push(cells[cells.length - 1]);
    const out = pts.slice(1).map(([i, j]) => new THREE.Vector3(this.x0 + i * this.res, 0, this.z0 + j * this.res));
    // finish exactly on the requested point when it is reachable from the last corner
    if (g0[0] === g[0] && g0[1] === g[1] && out.length) out[out.length - 1].set(to.x, 0, to.z);
    return out.length ? out : [new THREE.Vector3(to.x, 0, to.z)];
  }
}
