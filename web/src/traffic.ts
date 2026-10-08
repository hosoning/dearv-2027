import * as THREE from 'three';

/** A traffic lane exported by blender/exterior.py (Blender coordinates; y3 = three.js z). */
export interface Lane { y: number; y3: number; z: number; dir: number; count: number; speed: number; far?: number }

const SPAN = 2600;   // cars loop over x in [-SPAN, SPAN]
const COLORS = [0xf2f2f0, 0x1b1c1f, 0x8c9096, 0x2b3f63, 0x6b1d22, 0xc9c4b8, 0x3a3d40, 0xe6e6e6, 0x17324a, 0xb8b2a6];

/**
 * Waterfront traffic: instanced bodies, cabins, headlights and tail lights moving along
 * the highway lanes (and as light streams on the far shore road).
 */
export class Traffic {
  private body: THREE.InstancedMesh;
  private cabin: THREE.InstancedMesh;
  private heads: THREE.InstancedMesh;
  private tails: THREE.InstancedMesh;
  private headMat = new THREE.MeshBasicMaterial({ color: 0xfff3d6, toneMapped: false });
  private tailMat = new THREE.MeshBasicMaterial({ color: 0xff2a1a, toneMapped: false });
  private cars: { lane: Lane; x: number; v: number; len: number; far: boolean }[] = [];
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private s = new THREE.Vector3();
  private p = new THREE.Vector3();

  constructor(scene: THREE.Scene, lanes: Lane[]) {
    const rnd = mulberry(2027);
    for (const lane of lanes) {
      for (let i = 0; i < lane.count; i++) {
        this.cars.push({
          lane, far: !!lane.far,
          x: -SPAN + (2 * SPAN * (i + rnd() * 0.6)) / lane.count,
          v: lane.speed * (0.85 + rnd() * 0.3),
          len: rnd() < 0.12 ? 9 + rnd() * 3 : 4.3 + rnd() * 0.6,   // the odd bus or lorry
        });
      }
    }
    const n = this.cars.length;
    const bodyMat = new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.6 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x15191e, roughness: 0.1, metalness: 0.4 });
    this.body = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), bodyMat, n);
    this.cabin = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), glassMat, n);
    this.heads = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), this.headMat, n);
    this.tails = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), this.tailMat, n);
    const c = new THREE.Color();
    this.cars.forEach((car, i) => this.body.setColorAt(i, c.setHex(COLORS[Math.floor(rnd() * COLORS.length)])));
    for (const im of [this.body, this.cabin, this.heads, this.tails]) {
      im.frustumCulled = false;
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      scene.add(im);
    }
    this.update(0, 0);
  }

  /** night: 0..1 */
  update(dt: number, night: number) {
    // headlights read as small glowing points from 110 m up; brighten them at night
    this.headMat.color.setRGB(1, 0.95, 0.84).multiplyScalar(0.15 + 2.6 * night);
    this.tailMat.color.setRGB(1, 0.16, 0.1).multiplyScalar(0.3 + 2.2 * night);
    this.cars.forEach((car, i) => {
      const L = car.lane;
      car.x += car.v * L.dir * dt;
      if (car.x > SPAN) car.x -= 2 * SPAN;
      if (car.x < -SPAN) car.x += 2 * SPAN;
      const front = L.dir;
      const z = L.y3;
      const bodyScale = car.far ? 0 : 1;
      this.set(this.body, i, car.x, L.z + 0.75, z, car.len * bodyScale, 1.4 * bodyScale, 1.85 * bodyScale);
      const cabLen = car.len > 8 ? car.len * 0.95 : car.len * 0.55;
      this.set(this.cabin, i, car.x - front * car.len * 0.05, L.z + 1.65, z, cabLen * bodyScale, 0.7 * bodyScale, 1.7 * bodyScale);
      // lights: two lamps per end merged into one wide strip; the far shore shows lights only
      const lw = car.far ? 2.2 : 1.5, lh = car.far ? 1.2 : 0.25;
      this.set(this.heads, i, car.x + front * (car.len / 2 + 0.03), L.z + 0.8, z, 0.1, lh, lw);
      this.set(this.tails, i, car.x - front * (car.len / 2 + 0.03), L.z + 0.85, z, 0.1, lh, lw);
    });
    for (const im of [this.body, this.cabin, this.heads, this.tails]) im.instanceMatrix.needsUpdate = true;
  }

  private set(im: THREE.InstancedMesh, i: number, x: number, y: number, z: number, sx: number, sy: number, sz: number) {
    this.p.set(x, y, z);
    this.s.set(Math.max(sx, 1e-4), Math.max(sy, 1e-4), Math.max(sz, 1e-4));
    this.m.compose(this.p, this.q, this.s);
    im.setMatrixAt(i, this.m);
  }
}

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
