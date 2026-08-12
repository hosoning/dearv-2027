'use client';

import { useState, type ChangeEvent } from 'react';
import type { Letter } from '@/lib/types';
import { uploadAttachment } from '@/lib/storage';

const MOODS = [
  { tag: 'happy', icon: '·' },
  { tag: 'sad', icon: '○' },
  { tag: 'missing', icon: '◇' },
  { tag: 'love', icon: '♥' },
];

export default function LetterPanel({
  open,
  onClose,
  letters,
  onCreate,
  t = (key: string) => key,
}: {
  open: boolean;
  onClose: () => void;
  letters: Letter[];
  onCreate: (input: { title: string; content: string; mood_tag: string | null; attachment_url: string | null }) => Promise<void>;
  t?: (key: string) => string;
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

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
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
      await onCreate({ title: title.trim() || 'Untitled', content, mood_tag: mood, attachment_url: attachmentUrl });
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-3 backdrop-blur-sm sm:items-center" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="flex max-h-[82vh] w-full max-w-xl flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[#171513]/95 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex gap-2">
            <button type="button" onClick={() => { setTab('list'); setSelected(null); }} className={`rounded-full px-3 py-1.5 text-xs ${tab === 'list' ? 'bg-white text-stone-900' : 'text-white/45'}`}>{t('letters')}</button>
            <button type="button" onClick={() => setTab('compose')} className={`rounded-full px-3 py-1.5 text-xs ${tab === 'compose' ? 'bg-white text-stone-900' : 'text-white/45'}`}>＋ {t('letter')}</button>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/55">{t('close')}</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'list' && !selected && (
            <div className="flex flex-col gap-2">
              {letters.length === 0 && <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm leading-7 text-white/30">{t('emptyArchive')}</p>}
              {letters.map((letter) => (
                <button key={letter.id} type="button" onClick={() => setSelected(letter)} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left hover:bg-white/[0.06]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-medium text-white/80">{letter.title}</span>
                    {letter.mood_tag && <span className="text-amber-100/55">{MOODS.find((item) => item.tag === letter.mood_tag)?.icon}</span>}
                  </div>
                  <p className="mt-2 truncate text-xs text-white/35">{letter.content}</p>
                  <p className="mt-2 text-[10px] text-white/20">{new Date(letter.created_at).toLocaleString()}</p>
                </button>
              ))}
            </div>
          )}

          {tab === 'list' && selected && (
            <div>
              <button type="button" onClick={() => setSelected(null)} className="mb-4 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/45">← {t('archive')}</button>
              <h3 className="mb-1 text-lg font-medium text-white/85">{selected.title}</h3>
              <p className="mb-5 text-[10px] text-white/25">{new Date(selected.created_at).toLocaleString()}</p>
              {selected.attachment_url && <img src={selected.attachment_url} alt="" className="mb-5 max-h-72 w-full rounded-2xl object-contain" />}
              <div className="rounded-3xl bg-[#f0e6d5] p-6 text-stone-700 shadow-inner">
                <p className="whitespace-pre-wrap font-serif text-[15px] leading-8">{selected.content}</p>
              </div>
            </div>
          )}

          {tab === 'compose' && (
            <div className="space-y-3">
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t('title')} className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none" />
              <textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder={t('description')} rows={7} className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none" />
              <div className="flex gap-2">
                {MOODS.map((item) => (
                  <button key={item.tag} type="button" onClick={() => setMood(mood === item.tag ? null : item.tag)} className={`h-9 w-9 rounded-full border text-sm ${mood === item.tag ? 'border-amber-100/60 bg-amber-100/10 text-amber-100' : 'border-white/10 text-white/45'}`}>{item.icon}</button>
                ))}
              </div>
              <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} className="block w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/65 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:text-white" />
              {attachmentUrl && <img src={attachmentUrl} alt="" className="max-h-40 rounded-2xl object-contain" />}
              <button type="button" onClick={handleSubmit} disabled={saving || uploading || !content.trim()} className="w-full rounded-2xl bg-amber-100 py-3 text-sm font-medium text-stone-900 disabled:opacity-40">{saving ? '…' : t('save')}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
