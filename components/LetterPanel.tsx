'use client';

import { useState, type ChangeEvent } from 'react';
import type { Letter } from '@/lib/types';
import { uploadAttachment } from '@/lib/storage';

const MOODS = [
  { tag: 'happy', icon: '😊' },
  { tag: 'sad', icon: '😢' },
  { tag: 'missing', icon: '💭' },
  { tag: 'love', icon: '❤️' },
];

export default function LetterPanel({
  open,
  onClose,
  letters,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  letters: Letter[];
  onCreate: (input: { title: string; content: string; mood_tag: string | null; attachment_url: string | null }) => Promise<void>;
}) {
  const [tab, setTab] = useState<'list' | 'compose'>('list');
  const [selected, setSelected] = useState<Letter | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<string | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      setAttachmentUrl(await uploadAttachment(file));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await onCreate({ title: title.trim() || '無題', content, mood_tag: mood, attachment_url: attachmentUrl });
      setTitle('');
      setContent('');
      setMood(null);
      setAttachmentUrl(null);
      setTab('list');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="flex max-h-[75vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex gap-4">
            <button
              onClick={() => {
                setTab('list');
                setSelected(null);
              }}
              className={`text-sm font-medium ${tab === 'list' ? 'text-slate-900' : 'text-slate-400'}`}
            >
              信件
            </button>
            <button onClick={() => setTab('compose')} className={`text-sm font-medium ${tab === 'compose' ? 'text-slate-900' : 'text-slate-400'}`}>
              寫信
            </button>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'list' && !selected && (
            <div className="flex flex-col gap-2">
              {letters.length === 0 && <p className="text-sm text-slate-400">還沒有信件，寫下第一封吧。</p>}
              {letters.map((letter) => (
                <button
                  key={letter.id}
                  onClick={() => setSelected(letter)}
                  className="rounded-xl border border-slate-100 p-3 text-left hover:border-slate-300"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">{letter.title}</span>
                    {letter.mood_tag && <span>{MOODS.find((m) => m.tag === letter.mood_tag)?.icon}</span>}
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-400">{letter.content}</p>
                  <p className="mt-1 text-[11px] text-slate-300">{new Date(letter.created_at).toLocaleString('zh-TW')}</p>
                </button>
              ))}
            </div>
          )}

          {tab === 'list' && selected && (
            <div>
              <button onClick={() => setSelected(null)} className="mb-3 text-xs text-slate-400 hover:text-slate-600">
                ← 返回列表
              </button>
              <h3 className="mb-1 text-base font-semibold text-slate-800">{selected.title}</h3>
              <p className="mb-3 text-[11px] text-slate-400">{new Date(selected.created_at).toLocaleString('zh-TW')}</p>
              {selected.attachment_url && (
                <img src={selected.attachment_url} alt="" className="mb-3 max-h-52 w-full rounded-lg object-cover" />
              )}
              <p className="whitespace-pre-wrap text-sm text-slate-700">{selected.content}</p>
            </div>
          )}

          {tab === 'compose' && (
            <div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="標題"
                className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="寫下你想說的話…"
                rows={6}
                className="mb-3 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
              <div className="mb-3 flex gap-2">
                {MOODS.map((m) => (
                  <button
                    key={m.tag}
                    onClick={() => setMood(mood === m.tag ? null : m.tag)}
                    className={`rounded-lg border px-3 py-1.5 text-lg ${mood === m.tag ? 'border-slate-500 bg-slate-100' : 'border-slate-200'}`}
                  >
                    {m.icon}
                  </button>
                ))}
              </div>
              <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} className="mb-3 text-sm" />
              {attachmentUrl && <img src={attachmentUrl} alt="" className="mb-3 max-h-32 rounded-lg object-cover" />}
              <button
                onClick={handleSubmit}
                disabled={saving || uploading || !content.trim()}
                className="w-full rounded-lg bg-slate-800 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {saving ? '寄出中…' : '封存這封信'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
