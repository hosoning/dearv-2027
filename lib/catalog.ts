import type { CatalogEntry } from './types';

export const FURNITURE_CATALOG: CatalogEntry[] = [
  { id: 'stool', name: '小凳子', category: 'seating', icon: '🪑' },
  { id: 'plant', name: '盆栽', category: 'plant', icon: '🪴' },
  { id: 'side_table', name: '邊桌', category: 'table', icon: '🛋️' },
];

export const MEMORY_OBJECT_CATALOG: { type: 'star_bottle' | 'photo_frame' | 'gift_box'; name: string; icon: string }[] = [
  { type: 'star_bottle', name: '星星瓶', icon: '✨' },
  { type: 'photo_frame', name: '照片框', icon: '🖼️' },
  { type: 'gift_box', name: '禮物盒', icon: '🎁' },
];
