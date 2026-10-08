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

  walkTo(p: THREE.Vector3, onArrive: (() => void) | null = null) {
    this.stand();
    this.target = new THREE.Vector3(p.x, 0, p.z);
    this.onArrive = onArrive;
  }

  sit(seat: THREE.Vector3, look: THREE.Vector3) {
    this.target = null;
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
    this.pos.set(s.pos.x + 0.7, 0, s.pos.z); // step forward off the sofa, towards the coffee table
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
    return [THREE.MathUtils.clamp(x, -8.8, 6.8), THREE.MathUtils.clamp(z, -4.75, 4.85)];
  }

  update(dt: number) {
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
      if (dist < 0.12) {
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
