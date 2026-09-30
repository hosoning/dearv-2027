'use client';

import { FURNITURE_CATALOG, MEMORY_OBJECT_CATALOG } from '@/lib/catalog';
import type { ItemCategory, MemoryObjectType } from '@/lib/types';

export default function CatalogPanel({
  open,
  onClose,
  onPlaceFurniture,
  onPlaceMemoryObject,
}: {
  open: boolean;
  onClose: () => void;
  onPlaceFurniture: (catalogId: string, category: ItemCategory) => void;
  onPlaceMemoryObject: (type: MemoryObjectType) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[70vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white/95 p-5 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">收藏目錄</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>

        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">家具擺設</p>
        <div className="mb-5 grid grid-cols-3 gap-3">
          {FURNITURE_CATALOG.map((entry) => (
            <button
              key={entry.id}
              onClick={() => onPlaceFurniture(entry.id, entry.category)}
              className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 p-3 text-sm hover:border-slate-400 hover:bg-slate-50"
            >
              <span className="text-2xl">{entry.icon}</span>
              <span className="text-slate-700">{entry.name}</span>
            </button>
          ))}
        </div>

        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">記憶物件</p>
        <div className="grid grid-cols-3 gap-3">
          {MEMORY_OBJECT_CATALOG.map((entry) => (
            <button
              key={entry.type}
              onClick={() => onPlaceMemoryObject(entry.type)}
              className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 p-3 text-sm hover:border-slate-400 hover:bg-slate-50"
            >
              <span className="text-2xl">{entry.icon}</span>
              <span className="text-slate-700">{entry.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
