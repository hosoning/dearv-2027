import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { lightUniforms, type World } from './world';

/** 0 = day, 0.5 = dusk, 1 = night. Everything outside and the baked mix follow it. */
export interface TimeState {
  t: number;
  lights: number; // 0..1 interior lights
}

const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}`;

const SKY_FRAG = /* glsl */ `
uniform vec3 uZenith; uniform vec3 uHorizon; uniform vec3 uGround;
uniform vec3 uSunDir; uniform vec3 uSunColor; uniform float uNight; uniform vec3 uMoonDir; uniform float uTime;
varying vec3 vDir;
float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 col = mix(uHorizon, uZenith, pow(clamp(h, 0.0, 1.0), 0.55));
  col = mix(col, uGround, smoothstep(0.0, -0.08, h));
  float sd = max(dot(d, normalize(uSunDir)), 0.0);
  col += uSunColor * (pow(sd, 900.0) * 30.0 + pow(sd, 12.0) * 0.35 + pow(sd, 3.0) * 0.12) * (1.0 - uNight);
  // stars + moon at night
  if (uNight > 0.01) {
    vec3 sp = floor(d * 420.0);
    float s = step(0.9975, hash(sp)) * smoothstep(0.02, 0.25, h);
    float tw = 0.6 + 0.4 * sin(uTime * 2.0 + hash(sp + 3.0) * 30.0);
    col += vec3(s * tw) * uNight * 0.9;
    float md = dot(d, normalize(uMoonDir));
    col += vec3(1.0, 0.97, 0.9) * smoothstep(0.9993, 0.9996, md) * 1.6 * uNight;
    col += vec3(0.5, 0.6, 0.8) * pow(max(md, 0.0), 60.0) * 0.18 * uNight;
  }
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const lerp3 = (a: THREE.Color, b: THREE.Color, c: THREE.Color, t: number) =>
  t < 0.5 ? a.clone().lerp(b, t * 2) : b.clone().lerp(c, (t - 0.5) * 2);

const C = (h: number) => new THREE.Color(h);
const PALETTE = {
  zenith: [C(0x3d78c8), C(0x2f3f73), C(0x03060f)],
  horizon: [C(0xbcd6ec), C(0xf3a06a), C(0x0d1424)],
  ground: [C(0x55697a), C(0x3a2f35), C(0x02040a)],
  sun: [C(0xfff1dc), C(0xff9a55), C(0x223355)],
  dayTint: [new THREE.Color(1, 1, 1), new THREE.Color(1.0, 0.62, 0.38).multiplyScalar(0.55), new THREE.Color(0.1, 0.12, 0.2)],
  water: [C(0x0f4a5e), C(0x2a2a3e), C(0x050a14)],
};

export class Environment {
  sky: THREE.Mesh;
  water: Water;
  sun = new THREE.DirectionalLight(0xffffff, 3);
  hemi = new THREE.HemisphereLight(0xbcd6ec, 0x2b3540, 1.2);
  private skyMat: THREE.ShaderMaterial;
  private daySun: THREE.Vector3;
  private boats: { obj: THREE.Object3D; speed: number; range: number; phase: number }[] = [];
  private beacons: THREE.Mesh[] = [];
  state: TimeState = { t: 0, lights: 0 };

  constructor(private scene: THREE.Scene, private world: World) {
    const m = world.manifest;
    this.daySun = new THREE.Vector3(...m.sunDirection).normalize();
    this.skyMat = new THREE.ShaderMaterial({
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uZenith: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() }, uGround: { value: new THREE.Color() },
        uSunDir: { value: this.daySun.clone() }, uSunColor: { value: new THREE.Color() }, uNight: { value: 0 },
        uMoonDir: { value: new THREE.Vector3(-0.5, 0.45, -0.75).normalize() }, uTime: { value: 0 },
      },
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(9000, 48, 24), this.skyMat);
    this.sky.frustumCulled = false;
    this.sky.renderOrder = -10;
    scene.add(this.sky);

    this.water = new Water(new THREE.PlaneGeometry(24000, 24000), {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: world.waterNormals,
      sunDirection: this.daySun.clone(),
      sunColor: 0xffffff,
      waterColor: 0x1d4f63,
      distortionScale: 5.5,
      fog: true,
    });
    this.water.rotation.x = -Math.PI / 2;
    this.water.position.y = m.waterY;
    (this.water.material as THREE.ShaderMaterial).uniforms.size.value = 0.12;
    scene.add(this.water);

    this.sun.position.copy(this.daySun).multiplyScalar(500);
    scene.add(this.sun, this.hemi);
    scene.fog = new THREE.FogExp2(0xbcd6ec, 0.00016);
    this.buildHarbourLife(m.waterY);
  }

  /** Small modelled boats and blinking aviation beacons keep the harbour alive. */
  private buildHarbourLife(waterY: number) {
    const hullMat = new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.5 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x23303a, roughness: 0.4 });
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xffe2a8 });
    const mk = (len: number, w: number, decks: number) => {
      const g = new THREE.Group();
      const hull = new THREE.Mesh(new THREE.BoxGeometry(len, 2.4, w), darkMat);
      hull.position.y = 1.2;
      g.add(hull);
      for (let i = 0; i < decks; i++) {
        const deck = new THREE.Mesh(new THREE.BoxGeometry(len * (0.8 - i * 0.18), 2.2, w * 0.86), hullMat);
        deck.position.set(-len * 0.04 * i, 3.5 + i * 2.2, 0);
        g.add(deck);
      }
      for (let i = 0; i < Math.max(3, len / 6); i++) {
        const l = new THREE.Mesh(new THREE.SphereGeometry(0.45, 6, 4), lampMat);
        l.position.set(-len / 2 + (i + 0.5) * (len / Math.max(3, len / 6)), 3.6, w * 0.46);
        g.add(l);
      }
      return g;
    };
    const specs = [
      { len: 46, w: 11, decks: 2, x: -900, z: -520, speed: 9, range: 1800 },
      { len: 30, w: 8, decks: 1, x: 300, z: -320, speed: -13, range: 1600 },
      { len: 62, w: 14, decks: 3, x: -200, z: -820, speed: 6, range: 2200 },
      { len: 16, w: 5, decks: 1, x: 600, z: -180, speed: 17, range: 1400 },
    ];
    specs.forEach((s, i) => {
      const b = mk(s.len, s.w, s.decks);
      b.position.set(s.x, waterY, s.z);
      if (s.speed < 0) b.rotation.y = Math.PI;
      this.scene.add(b);
      this.boats.push({ obj: b, speed: s.speed, range: s.range, phase: i * 1.7 });
    });
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff2a20, transparent: true, fog: false });
    for (const [x, y, z] of [[-620, 466, -1500], [420, 262, -1650], [-240, 100, -210], [330, 52, -380]]) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(Math.max(1.2, Math.abs(z) / 500), 8, 6), beaconMat.clone());
      b.position.set(x, y, z);
      this.scene.add(b);
      this.beacons.push(b);
    }
  }

  apply(state: TimeState) {
    this.state = state;
    const t = state.t;
    const u = this.skyMat.uniforms;
    u.uZenith.value.copy(lerp3(PALETTE.zenith[0], PALETTE.zenith[1], PALETTE.zenith[2], t));
    u.uHorizon.value.copy(lerp3(PALETTE.horizon[0], PALETTE.horizon[1], PALETTE.horizon[2], t));
    u.uGround.value.copy(lerp3(PALETTE.ground[0], PALETTE.ground[1], PALETTE.ground[2], t));
    const sunCol = lerp3(PALETTE.sun[0], PALETTE.sun[1], PALETTE.sun[2], t);
    u.uSunColor.value.copy(sunCol);
    const night = THREE.MathUtils.smoothstep(t, 0.5, 1.0);
    u.uNight.value = night;

    // Sun sinks towards the western horizon at dusk and below it at night
    const az = Math.atan2(this.daySun.x, -this.daySun.z);
    const el0 = Math.asin(this.daySun.y);
    const el = THREE.MathUtils.lerp(el0, t < 0.5 ? 0.04 : -0.2, Math.min(1, t * 2) ** 1.4);
    const az2 = az - t * 0.9;
    const sunDir = new THREE.Vector3(Math.sin(az2) * Math.cos(el), Math.sin(el), -Math.cos(az2) * Math.cos(el));
    u.uSunDir.value.copy(sunDir);
    this.sun.position.copy(sunDir).multiplyScalar(500);
    this.sun.color.copy(sunCol);
    this.sun.intensity = THREE.MathUtils.lerp(3.0, 0.05, Math.min(1, t * 1.4));
    this.hemi.color.copy(u.uHorizon.value);
    this.hemi.groundColor.copy(u.uGround.value);
    this.hemi.intensity = THREE.MathUtils.lerp(1.3, 0.05, t);

    const wu = (this.water.material as THREE.ShaderMaterial).uniforms;
    const moon = u.uMoonDir.value as THREE.Vector3;
    wu.sunDirection.value.copy(night > 0.5 ? moon : sunDir);
    wu.sunColor.value.copy(night > 0.5 ? new THREE.Color(0x8899bb) : sunCol);
    wu.waterColor.value.copy(lerp3(PALETTE.water[0], PALETTE.water[1], PALETTE.water[2], t));

    (this.scene.fog as THREE.FogExp2).color.copy(u.uHorizon.value);

    for (const m of this.world.facadeMats) m.emissiveIntensity = 0.85 * THREE.MathUtils.smoothstep(t, 0.3, 0.9);

    // Baked interior mix
    lightUniforms.uNight.value = night;
    lightUniforms.uLights.value = state.lights;
    lightUniforms.uDayTint.value.copy(lerp3(PALETTE.dayTint[0], PALETTE.dayTint[1], PALETTE.dayTint[2], Math.min(t, 0.75)));
    for (const c of this.world.curtainMats) {
      c.emissiveIntensity = THREE.MathUtils.lerp(0.75, 0.05, Math.min(1, t * 1.3)) + state.lights * night * 0.12;
    }
    for (const g of this.world.glassMats) g.opacity = THREE.MathUtils.lerp(0.06, 0.16, night);
  }

  update(dt: number, time: number) {
    this.skyMat.uniforms.uTime.value = time;
    (this.water.material as THREE.ShaderMaterial).uniforms.time.value += dt * 0.5;
    for (const b of this.boats) {
      b.obj.position.x += b.speed * dt;
      if (b.obj.position.x > b.range) b.obj.position.x = -b.range;
      if (b.obj.position.x < -b.range) b.obj.position.x = b.range;
      b.obj.rotation.z = Math.sin(time * 0.8 + b.phase) * 0.01;
    }
    const blink = (Math.sin(time * 3.2) > 0.6 ? 1 : 0.15) * (0.3 + 0.7 * THREE.MathUtils.smoothstep(this.state.t, 0.3, 0.8));
    for (const b of this.beacons) (b.material as THREE.MeshBasicMaterial).opacity = blink;
  }
}
