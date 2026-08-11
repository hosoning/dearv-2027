'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { Room, PlacedItem, Letter, MemoryObject, ItemCategory, MemoryObjectType } from '@/lib/types';
import {
  getActiveRoom,
  listPlacedItems,
  addPlacedItem,
  listLetters,
  addLetter,
  listMemoryObjects,
  addMemoryObject,
  updateMemoryObject,
} from '@/lib/storage';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useIsMobile } from '@/hooks/useIsMobile';
import PlacedItemMesh from './PlacedItemMesh';
import MemoryObjectMesh from './MemoryObjectMesh';
import CatalogPanel from './CatalogPanel';
import LetterPanel from './LetterPanel';
import MemoryObjectEditor from './MemoryObjectEditor';
import DialogBox from './DialogBox';
import MobileJoysticks from './MobileJoysticks';

const Scene = dynamic(() => import('./Scene'), { ssr: false });

function randomInRoom(): [number, number, number] {
  const x = (Math.random() - 0.5) * 6;
  const z = (Math.random() - 0.5) * 6;
  return [x, 0, z];
}

export default function HouseApp() {
  const isMobile = useIsMobile();
  const [room, setRoom] = useState<Room | null>(null);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [memoryObjects, setMemoryObjects] = useState<MemoryObject[]>([]);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [lettersOpen, setLettersOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingObject, setEditingObject] = useState<MemoryObject | null>(null);

  useEffect(() => {
    (async () => {
      const activeRoom = await getActiveRoom();
      setRoom(activeRoom);
      const [items, roomLetters, objects] = await Promise.all([
        listPlacedItems(activeRoom.id),
        listLetters(activeRoom.id),
        listMemoryObjects(activeRoom.id),
      ]);
      setPlacedItems(items);
      setLetters(roomLetters);
      setMemoryObjects(objects);
    })();
  }, []);

  const handlePlaceFurniture = useCallback(
    async (catalogId: string, category: ItemCategory) => {
      if (!room) return;
      const [x, y, z] = randomInRoom();
      const item = await addPlacedItem(room.id, {
        catalog_id: catalogId,
        category,
        pos_x: x,
        pos_y: y,
        pos_z: z,
        rotation_y: Math.random() * Math.PI * 2,
      });
      setPlacedItems((prev) => [...prev, item]);
      setCatalogOpen(false);
    },
    [room]
  );

  const handlePlaceMemoryObject = useCallback(
    async (type: MemoryObjectType) => {
      if (!room) return;
      const [x, y, z] = randomInRoom();
      const object = await addMemoryObject(room.id, {
        type,
        title: '',
        image_url: null,
        note: null,
        pos_x: x,
        pos_y: y,
        pos_z: z,
      });
      setMemoryObjects((prev) => [...prev, object]);
      setCatalogOpen(false);
      setEditingObject(object);
    },
    [room]
  );

  const handleCreateLetter = useCallback(
    async (input: { title: string; content: string; mood_tag: string | null; attachment_url: string | null }) => {
      if (!room) return;
      const letter = await addLetter(room.id, input);
      setLetters((prev) => [letter, ...prev]);
    },
    [room]
  );

  const handleSaveMemoryObject = useCallback(
    async (updates: { title: string; note: string; image_url: string | null }) => {
      if (!room || !editingObject) return;
      const updated = await updateMemoryObject(room.id, editingObject.id, updates);
      setMemoryObjects((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setEditingObject(null);
    },
    [room, editingObject]
  );

  if (!room) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-900 text-white">
        <p className="text-sm text-white/70">載入中…</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      <Scene onCompanionClick={() => setDialogOpen(true)}>
        {placedItems.map((item) => (
          <PlacedItemMesh key={item.id} item={item} />
        ))}
        {memoryObjects.map((object) => (
          <MemoryObjectMesh key={object.id} object={object} onClick={() => setEditingObject(object)} />
        ))}
      </Scene>

      {!isSupabaseConfigured && (
        <div className="pointer-events-none fixed left-1/2 top-3 z-30 -translate-x-1/2 rounded-full bg-amber-500/90 px-3 py-1 text-xs text-white shadow">
          未連接雲端 — 資料僅存於此瀏覽器
        </div>
      )}

      {!isMobile && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-full bg-black/40 px-4 py-1.5 text-xs text-white">
          WASD 移動 ・ 拖曳畫面看向四周 ・ 點擊物品互動
        </div>
      )}

      {isMobile && <MobileJoysticks />}

      <div className="fixed right-4 top-4 z-30 flex flex-col gap-2">
        <button
          onClick={() => setCatalogOpen(true)}
          className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-slate-800 shadow-lg hover:bg-white"
        >
          📦 目錄
        </button>
        <button
          onClick={() => setLettersOpen(true)}
          className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-slate-800 shadow-lg hover:bg-white"
        >
          ✉️ 信件
        </button>
      </div>

      <CatalogPanel
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        onPlaceFurniture={handlePlaceFurniture}
        onPlaceMemoryObject={handlePlaceMemoryObject}
      />
      <LetterPanel open={lettersOpen} onClose={() => setLettersOpen(false)} letters={letters} onCreate={handleCreateLetter} />
      {editingObject && (
        <MemoryObjectEditor object={editingObject} onClose={() => setEditingObject(null)} onSave={handleSaveMemoryObject} />
      )}
      <DialogBox open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
