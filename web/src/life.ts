import * as THREE from 'three';
import type { World } from './world';
import type { Home } from './interact';

/**
 * Daily life in the kitchen, deterministic from the date and time (no AI): the fridge is
 * restocked each morning and what has been eaten so far today is gone. When he cooks, the
 * food really moves: out of the fridge, into the pan, onto the plate, eaten.
 */
interface Meal { at: number; items: string[] }

const dinnerProtein = (day: number) => (day % 2 ? 'fr_beef' : 'fr_salmon');

function mealsFor(d: Date): Meal[] {
  const day = Math.floor(d.getTime() / 86400000);
  const weekend = d.getDay() === 0 || d.getDay() === 6;
  const m: Meal[] = [];
  if (weekend) m.push({ at: 10.4, items: ['fr_egg_0_0', 'fr_egg_0_1', 'fr_tomato_0', 'fr_butter'] });
  else m.push({ at: 7.3, items: [`fr_yoghurt_${day % 4}`] });
  m.push({ at: 20.7, items: [dinnerProtein(day), 'fr_tomato_1', 'fr_tomato_2', `fr_lemon_${day % 3}`] });
  if (day % 3 === 0) m.push({ at: 21.5, items: ['fr_berries'] });
  return m;
}

export class KitchenLife {
  private items = new Map<string, THREE.Object3D>();
  private panFood: THREE.Mesh;
  private plateFood: THREE.Mesh;
  private held: string[] = [];
  private cooking = false;

  constructor(private world: World, private home: Home, scene: THREE.Scene) {
    for (const [name, o] of world.byName) if (/^fr_/.test(name)) this.items.set(name, o);
    const food = new THREE.MeshStandardMaterial({ color: 0xe0805a, roughness: 0.55 });
    this.panFood = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.025, 20), food);
    this.plateFood = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.03, 20), food.clone());
    const greens = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshStandardMaterial({ color: 0x5f9a3a, roughness: 0.7 }));
    greens.position.set(0.06, 0.02, 0.03);
    this.plateFood.add(greens);
    const pan = world.byName.get('k_pan');
    const plate = world.byName.get('dining_plate_1');
    if (pan) { pan.getWorldPosition(this.panFood.position); this.panFood.position.y += 0.03; }
    if (plate) { plate.getWorldPosition(this.plateFood.position); this.plateFood.position.y += 0.02; }
    this.panFood.visible = this.plateFood.visible = false;
    scene.add(this.panFood, this.plateFood);
  }

  /** Show / hide fridge contents for the current time (called every few seconds). */
  sync(now: Date) {
    const h = now.getHours() + now.getMinutes() / 60;
    const gone = new Set<string>();
    for (const m of mealsFor(now)) if (h >= m.at) m.items.forEach((i) => gone.add(i));
    for (const i of this.held) gone.add(i);
    for (const [name, o] of this.items) o.visible = !gone.has(name);
  }

  /** What tonight's / this morning's cooking takes out of the fridge. */
  private nextMeal(now: Date) {
    const h = now.getHours() + now.getMinutes() / 60;
    return mealsFor(now).find((m) => m.at > h);
  }

  // hooks driven by his schedule -------------------------------------------------------------------
  atFridge(now: Date, phase: 'arrive' | 'take' | 'leave') {
    const door = this.world.byName.get('fridge_door');
    if (phase === 'arrive' && door) this.home.setDoor(door, true);
    if (phase === 'take') {
      const meal = this.nextMeal(now);
      this.held = meal ? meal.items.filter((i) => this.items.get(i)?.visible) : [];
      this.sync(now);
      const meat = this.held.find((i) => i === 'fr_beef' || i === 'fr_salmon');
      const c = meat === 'fr_beef' ? 0x8a3b2c : 0xe8906a;
      (this.panFood.material as THREE.MeshStandardMaterial).color.setHex(c);
      (this.plateFood.material as THREE.MeshStandardMaterial).color.setHex(meat ? c : 0xf2d27a);
    }
    if (phase === 'leave' && door) this.home.setDoor(door, false);
  }

  atHob(on: boolean) {
    if (on === this.cooking) return;
    this.cooking = on;
    this.home.setBurners(on);
    this.panFood.visible = on;
    if (!on && this.held.length) this.plateFood.visible = true;     // plated, on the table
  }

  ate() {
    this.plateFood.visible = false;
    this.held = [];
  }
}
