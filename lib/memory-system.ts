export type MemoryCategory =
  | 'letter'
  | 'notebook'
  | 'gift'
  | 'photo'
  | 'certificate'
  | 'moment';

export type DisplayLocation =
  | 'archive'
  | 'gift-cabinet'
  | 'desk'
  | 'wall'
  | 'wardrobe';

export interface MemoryItem {
  id: string;
  category: MemoryCategory;
  title: string;
  date?: string;
  description?: string;
  images: string[];
  displayLocation: DisplayLocation;
  interaction:
    | 'read'
    | 'flip-pages'
    | 'rotate'
    | 'zoom'
    | 'open-box'
    | 'view';
  createdAt: string;
}

export const defaultMemoryItems: MemoryItem[] = [
  {
    id: 'tie-set',
    category: 'gift',
    title: 'Tie Set',
    images: [],
    displayLocation: 'gift-cabinet',
    interaction: 'open-box',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'silk-pajamas',
    category: 'gift',
    title: 'Silk Pajamas',
    images: [],
    displayLocation: 'wardrobe',
    interaction: 'zoom',
    createdAt: new Date().toISOString(),
  },
];
