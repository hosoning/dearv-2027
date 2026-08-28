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
  scale_x?: number;
  scale_y?: number;
  scale_z?: number;
  state?: Record<string, unknown>;
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
  asset_url?: string | null;
  asset_version?: number;
  display_config?: Record<string, unknown>;
  interaction_config?: Record<string, unknown>;
  updated_at?: string;
  created_at: string;
}

export interface RoomRuntimeState {
  room_id: string;
  object_id: string;
  state: Record<string, unknown>;
  updated_at: string;
}

export type FoodStage =
  | 'raw'
  | 'washed'
  | 'chopped'
  | 'cooked'
  | 'plated'
  | 'burnt';

export interface InventoryItem {
  room_id: string;
  instance_id: string;
  definition_id: string;
  stage: FoodStage;
  location: string;
  metadata: Record<string, unknown>;
  updated_at: string;
}

export interface CatalogEntry {
  id: string;
  name: string;
  category: ItemCategory;
  icon: string;
}
