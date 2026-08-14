import type { MemoryObject, MemoryObjectType } from './types';

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
      return [14.05, 1.2 + (existingCount % 3) * 0.58, -7.2 + offset];
    case 'gift-cabinet':
      return [-7.0 + (existingCount % 2) * 0.48, 0.7 + (existingCount % 3) * 0.58, -5.28];
    case 'desk':
      return [11.6 + (existingCount % 3) * 0.42, 0.94, -4.2];
    case 'wall':
      return [9.25, 1.5 + (existingCount % 2) * 0.82, -0.8 + offset];
    case 'wardrobe':
      return [-14.15, 0.78 + (existingCount % 2) * 0.52, -2.8 + offset];
    default:
      return [0, 0, 0];
  }
}

function starter(
  roomId: string,
  id: string,
  title: string,
  meta: MemoryMeta,
  position: [number, number, number]
): MemoryObject {
  return {
    id: `starter-${id}`,
    room_id: roomId,
    type: legacyTypeForMemory(meta.category),
    title,
    image_url: null,
    note: encodeMemoryNote(meta),
    pos_x: position[0],
    pos_y: position[1],
    pos_z: position[2],
    created_at: '2026-08-12T00:00:00.000Z',
  };
}

/** The house should feel inhabited on first visit, even before Owner Mode is used. */
export function createStarterMemories(roomId: string): MemoryObject[] {
  return [
    starter(roomId, 'tie-set', '领带收藏盒', {
      category: 'gift', displayLocation: 'gift-cabinet', interaction: 'open-box', visual: 'box', direction: 'given',
      description: '领结、长领带、领带夹与胸针被完整收进同一个礼盒。点击展示柜中的盒子，可以重新打开这份收藏。',
    }, [-7.0, 0, -5.28]),
    starter(roomId, 'gold-520', '520 金色纪念饼', {
      category: 'gift', displayLocation: 'gift-cabinet', interaction: 'rotate', visual: 'coin', direction: 'given',
      description: '一枚写着 520 的金色纪念物。它被放在独立底座上，在暖光下保留金属细节。',
    }, [-7.0, 0, -5.28]),
    starter(roomId, 'star-certificate', '星星命名证书', {
      category: 'certificate', displayLocation: 'gift-cabinet', interaction: 'zoom', visual: 'frame', direction: 'given',
      description: '关于一颗星星的命名证书。原件与照片之后都可以从 Owner Mode 补充进这份档案。',
    }, [-7.0, 0, -5.28]),
    starter(roomId, 'music-house', '圣诞水晶音乐屋', {
      category: 'gift', displayLocation: 'gift-cabinet', interaction: 'rotate', visual: 'miniature-house', direction: 'given',
      description: '不是水晶球，而是一座会发光的圣诞小屋。它在收藏柜里拥有自己的柔和灯光。',
    }, [-7.0, 0, -5.28]),
    starter(roomId, 'silk-pajamas', '条纹丝质睡衣', {
      category: 'gift', displayLocation: 'wardrobe', interaction: 'zoom', visual: 'clothing', direction: 'given',
      description: '深色条纹的长袖长裤丝质睡衣，袖口保留了专属刺绣的位置。',
    }, [-14.15, 0, 2.75]),
    starter(roomId, 'first-moment', '这间回忆小屋', {
      category: 'moment', displayLocation: 'archive', interaction: 'view', visual: 'object', direction: 'shared',
      description: '这里不是一次性完成的展示页，而是一间会随着礼物、信件和照片继续生长的家。',
    }, [14.05, 1.2, -7.2]),
  ];
}
