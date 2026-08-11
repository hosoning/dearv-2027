export interface Room {
  id: string;
  user_id: string;
  name: string;
  layout_config: Record<string, unknown>;
  created_at: string;
}

export type ItemCategory = 'seating' | 'plant' | 'table' | 'decor';

export interface PlacedItem {
  id: string;
  room_id: string;
  catalog_id: string;
  category: ItemCategory;
  pos_x: number;
  pos_y: number;
  pos_z: number;
  rotation_y: number;
  created_at: string;
}

export interface Letter {
  id: string;
  room_id: string;
  title: string;
  content: string;
  mood_tag: string | null;
  attachment_url: string | null;
  created_at: string;
}

export type MemoryObjectType = 'star_bottle' | 'photo_frame' | 'gift_box';

export interface MemoryObject {
  id: string;
  room_id: string;
  type: MemoryObjectType;
  title: string;
  image_url: string | null;
  note: string | null;
  pos_x: number;
  pos_y: number;
  pos_z: number;
  created_at: string;
}

export interface CatalogEntry {
  id: string;
  name: string;
  category: ItemCategory;
  icon: string;
}
