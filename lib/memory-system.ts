import type { MemoryObjectType } from './types';

export type MemoryCategory = 'letter' | 'notebook' | 'gift' | 'photo' | 'certificate' | 'moment';
export type DisplayLocation = 'archive' | 'gift-cabinet' | 'desk' | 'wall' | 'wardrobe';
export type MemoryInteraction = 'read' | 'flip-pages' | 'rotate' | 'zoom' | 'open-box' | 'view';
export type MemoryDirection = 'given' | 'received' | 'shared';
export type MemoryVisual = 'box' | 'book' | 'clothing' | 'miniature-house' | 'coin' | 'frame' | 'object';

export interface MemoryMeta {
  category: MemoryCategory;
  date?: string;
  direction?: MemoryDirection;
  displayLocation: DisplayLocation;
  interaction: MemoryInteraction;
  visual: MemoryVisual;
  description?: string;
  pages?: string[];
}

const META_MARKER = '__DEARV_META__';

export function encodeMemoryNote(meta: MemoryMeta): string {
  return `${META_MARKER}${JSON.stringify(meta)}`;
}

export function decodeMemoryNote(note: string | null | undefined): MemoryMeta {
  const fallback: MemoryMeta = {
    category: 'gift',
    displayLocation: 'gift-cabinet',
    interaction: 'view',
    visual: 'object',
  };
  if (!note) return fallback;
  if (!note.startsWith(META_MARKER)) return { ...fallback, description: note };
  try {
    return { ...fallback, ...(JSON.parse(note.slice(META_MARKER.length)) as Partial<MemoryMeta>) };
  } catch {
    return fallback;
  }
}

export function legacyTypeForMemory(category: MemoryCategory): MemoryObjectType {
  if (category === 'photo' || category === 'certificate' || category === 'letter' || category === 'notebook') return 'photo_frame';
  return 'gift_box';
}

export function defaultInteractionForCategory(category: MemoryCategory): MemoryInteraction {
  if (category === 'notebook') return 'flip-pages';
  if (category === 'letter') return 'read';
  if (category === 'certificate' || category === 'photo') return 'zoom';
  if (category === 'gift') return 'open-box';
  return 'view';
}

export function defaultVisualForCategory(category: MemoryCategory): MemoryVisual {
  if (category === 'notebook' || category === 'letter') return 'book';
  if (category === 'certificate' || category === 'photo') return 'frame';
  if (category === 'gift') return 'box';
  return 'object';
}

export function positionForLocation(location: DisplayLocation, existingCount = 0): [number, number, number] {
  const offset = (existingCount % 4) * 0.55;
  switch (location) {
    case 'archive':
      return [-4.25, 0.75 + (existingCount % 3) * 0.35, -0.9 + offset];
    case 'gift-cabinet':
      return [3.75 + (existingCount % 2) * 0.5, 0.65 + (existingCount % 3) * 0.45, -3.75];
    case 'desk':
      return [3.55, 0.82, 2.85 + (existingCount % 3) * 0.35];
    case 'wall':
      return [4.82, 1.45 + (existingCount % 2) * 0.75, -0.9 + offset];
    case 'wardrobe':
      return [-3.75 + (existingCount % 2) * 0.6, 0.65, 3.65];
    default:
      return [0, 0, 0];
  }
}
