'use client';

import { useState, type ChangeEvent } from 'react';
import type { MemoryObject } from '@/lib/types';
import { uploadAttachment } from '@/lib/storage';

const TYPE_LABEL: Record<MemoryObject['type'], string> = {
  star_bottle: '星星瓶',
  photo_frame: '照片框',
  gift_box: '禮物盒',
};

export default function MemoryObjectEditor({
  object,
  onClose,
  onSave,
}: {
  object: MemoryObject;
  onClose: () => void;
  onSave: (updates: { title: string; note: string; image_url: string | null }) => void;
}) {
  const [title, setTitle] = useState(object.title);
  const [note, setNote] = useState(object.note ?? '');
  const [imageUrl, setImageUrl] = useState(object.image_url);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadAttachment(file);
      setImageUrl(url);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">{TYPE_LABEL[object.type]}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>

        <label className="mb-1 block text-xs font-medium text-slate-500">標題</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
          placeholder="這個回憶的名字"
        />

        <label className="mb-1 block text-xs font-medium text-slate-500">筆記</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="mb-3 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
          placeholder="寫下這個物件的故事…"
        />

        {object.type === 'photo_frame' && (
          <>
            <label className="mb-1 block text-xs font-medium text-slate-500">照片</label>
            {imageUrl && <img src={imageUrl} alt="" className="mb-2 h-32 w-full rounded-lg object-cover" />}
            <input type="file" accept="image/*" onChange={handleFile} className="mb-3 text-sm" disabled={uploading} />
          </>
        )}

        <button
          onClick={() => onSave({ title, note, image_url: imageUrl })}
          disabled={uploading}
          className="w-full rounded-lg bg-slate-800 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {uploading ? '上傳中…' : '儲存'}
        </button>
      </div>
    </div>
  );
}
