import { supabase } from './supabase';
import type { Room, PlacedItem, Letter, MemoryObject, MemoryObjectType, ItemCategory } from './types';
import { createStarterMemories } from './memory-system';

// Data-access layer: reads/writes go to Supabase when a signed-in session
// exists, otherwise fall back to localStorage (with an in-memory shim for
// sandboxed browsers that block storage access entirely) so the app keeps
// working without any cloud setup. Only the Supabase path syncs across
// devices — the whole point of Phase 1.

const LOCAL_ROOM_ID = 'local-room';
const memoryFallback = new Map<string, string>();

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    const raw = memoryFallback.get(key);
    if (raw) return JSON.parse(raw) as T;
  }
  return fallback;
}

function writeLocal(key: string, value: unknown) {
  const raw = JSON.stringify(value);
  try {
    window.localStorage.setItem(key, raw);
  } catch {
    memoryFallback.set(key, raw);
  }
}

function uuid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function getSupabaseUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

// ─────────────────────────────────────────────────────────
// Room
// ─────────────────────────────────────────────────────────
export async function getActiveRoom(): Promise<Room> {
  const user = await getSupabaseUser();
  if (supabase && user) {
    const { data: existing, error: selectError } = await supabase
      .from('rooms')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1);
    if (selectError) throw selectError;
    if (existing && existing.length > 0) return existing[0] as Room;

    const { data: created, error: insertError } = await supabase
      .from('rooms')
      .insert({ user_id: user.id, name: '我的小屋' })
      .select()
      .single();
    if (insertError) throw insertError;
    return created as Room;
  }

  const local = readLocal<Room | null>(`room:${LOCAL_ROOM_ID}`, null);
  if (local) return local;
  const room: Room = {
    id: LOCAL_ROOM_ID,
    user_id: 'local',
    name: '我的小屋',
    layout_config: {},
    created_at: new Date().toISOString(),
  };
  writeLocal(`room:${LOCAL_ROOM_ID}`, room);
  return room;
}

function isLocalRoom(roomId: string) {
  return !supabase || roomId === LOCAL_ROOM_ID;
}

// ─────────────────────────────────────────────────────────
// Placed items
// ─────────────────────────────────────────────────────────
export async function listPlacedItems(roomId: string): Promise<PlacedItem[]> {
  if (!isLocalRoom(roomId) && supabase) {
    const { data, error } = await supabase
      .from('placed_items')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data as PlacedItem[]) ?? [];
  }
  return readLocal<PlacedItem[]>(`items:${roomId}`, []);
}

export async function addPlacedItem(
  roomId: string,
  input: { catalog_id: string; category: ItemCategory; pos_x: number; pos_y: number; pos_z: number; rotation_y: number }
): Promise<PlacedItem> {
  if (!isLocalRoom(roomId) && supabase) {
    const { data, error } = await supabase
      .from('placed_items')
      .insert({ room_id: roomId, ...input })
      .select()
      .single();
    if (error) throw error;
    return data as PlacedItem;
  }
  const items = readLocal<PlacedItem[]>(`items:${roomId}`, []);
  const item: PlacedItem = { id: uuid(), room_id: roomId, created_at: new Date().toISOString(), ...input };
  writeLocal(`items:${roomId}`, [...items, item]);
  return item;
}

export async function removePlacedItem(roomId: string, id: string): Promise<void> {
  if (!isLocalRoom(roomId) && supabase) {
    const { error } = await supabase.from('placed_items').delete().eq('id', id);
    if (error) throw error;
    return;
  }
  const items = readLocal<PlacedItem[]>(`items:${roomId}`, []);
  writeLocal(`items:${roomId}`, items.filter((i) => i.id !== id));
}

// ─────────────────────────────────────────────────────────
// Letters
// ─────────────────────────────────────────────────────────
export async function listLetters(roomId: string): Promise<Letter[]> {
  if (!isLocalRoom(roomId) && supabase) {
    const { data, error } = await supabase
      .from('letters')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as Letter[]) ?? [];
  }
  return readLocal<Letter[]>(`letters:${roomId}`, []);
}

export async function addLetter(
  roomId: string,
  input: { title: string; content: string; mood_tag: string | null; attachment_url: string | null }
): Promise<Letter> {
  if (!isLocalRoom(roomId) && supabase) {
    const { data, error } = await supabase
      .from('letters')
      .insert({ room_id: roomId, ...input })
      .select()
      .single();
    if (error) throw error;
    return data as Letter;
  }
  const letters = readLocal<Letter[]>(`letters:${roomId}`, []);
  const letter: Letter = { id: uuid(), room_id: roomId, created_at: new Date().toISOString(), ...input };
  writeLocal(`letters:${roomId}`, [letter, ...letters]);
  return letter;
}

// ─────────────────────────────────────────────────────────
// Memory objects (star bottle, photo frame, gift box)
// ─────────────────────────────────────────────────────────
export async function listMemoryObjects(roomId: string): Promise<MemoryObject[]> {
  if (!isLocalRoom(roomId) && supabase) {
    const { data, error } = await supabase
      .from('memory_objects')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    const objects = (data as MemoryObject[]) ?? [];
    return [...createStarterMemories(roomId), ...objects.filter((item) => !item.id.startsWith('starter-'))];
  }
  const objects = readLocal<MemoryObject[]>(`memory:${roomId}`, []);
  return [...createStarterMemories(roomId), ...objects.filter((item) => !item.id.startsWith('starter-'))];
}

export async function addMemoryObject(
  roomId: string,
  input: {
    type: MemoryObjectType;
    title: string;
    image_url: string | null;
    note: string | null;
    pos_x: number;
    pos_y: number;
    pos_z: number;
  }
): Promise<MemoryObject> {
  if (!isLocalRoom(roomId) && supabase) {
    const { data, error } = await supabase
      .from('memory_objects')
      .insert({ room_id: roomId, ...input })
      .select()
      .single();
    if (error) throw error;
    return data as MemoryObject;
  }
  const objects = readLocal<MemoryObject[]>(`memory:${roomId}`, []);
  const object: MemoryObject = { id: uuid(), room_id: roomId, created_at: new Date().toISOString(), ...input };
  writeLocal(`memory:${roomId}`, [...objects, object]);
  return object;
}

export async function updateMemoryObject(
  roomId: string,
  id: string,
  updates: { title?: string; note?: string | null; image_url?: string | null }
): Promise<MemoryObject> {
  if (!isLocalRoom(roomId) && supabase) {
    const { data, error } = await supabase.from('memory_objects').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as MemoryObject;
  }
  const objects = readLocal<MemoryObject[]>(`memory:${roomId}`, []);
  const next = objects.map((o) => (o.id === id ? { ...o, ...updates } : o));
  writeLocal(`memory:${roomId}`, next);
  return next.find((o) => o.id === id) as MemoryObject;
}

// ─────────────────────────────────────────────────────────
// Attachments (letter/memory-object images)
// ─────────────────────────────────────────────────────────
export async function uploadAttachment(file: File): Promise<string> {
  const user = await getSupabaseUser();
  if (supabase && user) {
    const path = `${user.id}/${uuid()}-${file.name}`;
    const { error } = await supabase.storage.from('memory-house').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('memory-house').getPublicUrl(path);
    return data.publicUrl;
  }
  // Local fallback: inline as a data URL so it survives in localStorage.
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const isCloudSyncActive = async (): Promise<boolean> => Boolean(await getSupabaseUser());
