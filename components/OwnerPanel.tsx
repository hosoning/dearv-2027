'use client';

import { useEffect, useState } from 'react';
import type { EnvironmentSettings } from '@/lib/environment';
import type {
  DisplayLocation,
  MemoryCategory,
  MemoryDirection,
  MemoryInteraction,
  MemoryVisual,
} from '@/lib/memory-system';

export interface OwnerMemoryInput {
  category: MemoryCategory;
  title: string;
  date: string;
  direction: MemoryDirection;
  displayLocation: DisplayLocation;
  interaction: MemoryInteraction;
  visual: MemoryVisual;
  description: string;
  pages: string[];
  image: File | null;
}

export default function OwnerPanel({
  open,
  onClose,
  onAddMemory,
  environmentSettings,
  onEnvironmentChange,
  t,
}: {
  open: boolean;
  onClose: () => void;
  onAddMemory: (input: OwnerMemoryInput) => Promise<void>;
  environmentSettings: EnvironmentSettings;
  onEnvironmentChange: (settings: EnvironmentSettings) => void;
  t: (key: string) => string;
}) {
  const [authorized, setAuthorized] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [category, setCategory] = useState<MemoryCategory>('gift');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [direction, setDirection] = useState<MemoryDirection>('given');
  const [displayLocation, setDisplayLocation] = useState<DisplayLocation>('gift-cabinet');
  const [interaction, setInteraction] = useState<MemoryInteraction>('open-box');
  const [visual, setVisual] = useState<MemoryVisual>('box');
  const [description, setDescription] = useState('');
  const [pagesText, setPagesText] = useState('');
  const [image, setImage] = useState<File | null>(null);

  useEffect(() => {
    if (!open) return;
    try {
      setAuthorized(window.sessionStorage.getItem('dearv-owner') === '1');
    } catch {}
  }, [open]);

  if (!open) return null;

  function unlockOwner() {
    const expected = process.env.NEXT_PUBLIC_OWNER_PIN || '2027';
    if (pin === expected) {
      setAuthorized(true);
      setPinError(false);
      try {
        window.sessionStorage.setItem('dearv-owner', '1');
      } catch {}
    } else {
      setPinError(true);
      setPin('');
    }
  }

  async function saveMemory() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onAddMemory({
        category,
        title: title.trim(),
        date,
        direction,
        displayLocation,
        interaction,
        visual,
        description,
        pages: pagesText
          .split(/\n?---\n?/g)
          .map((page) => page.trim())
          .filter(Boolean),
        image,
      });
      setTitle('');
      setDate('');
      setDescription('');
      setPagesText('');
      setImage(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="h-full w-full max-w-lg overflow-y-auto border-l border-white/10 bg-[#171513]/95 p-5 text-white shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-amber-100/45">dearv-2027</p>
            <h2 className="mt-1 text-lg font-medium">{t('owner')}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:bg-white/5">{t('close')}</button>
        </div>

        {!authorized ? (
          <div className="mt-24 rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <p className="mb-2 text-sm font-medium">{t('ownerPin')}</p>
            <p className="mb-4 text-xs leading-5 text-white/45">{t('ownerHint')}</p>
            <input
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && unlockOwner()}
              type="password"
              inputMode="numeric"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-amber-100/40"
            />
            <button type="button" onClick={unlockOwner} className="mt-3 w-full rounded-2xl bg-amber-100 py-3 text-sm font-medium text-stone-900">{t('ownerUnlock')}</button>
            {pinError && <p className="mt-3 text-xs text-rose-300">{t('wrongCode')}</p>}
          </div>
        ) : (
          <>
            <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
              <h3 className="mb-4 text-sm font-medium">{t('addMemory')}</h3>
              <div className="space-y-3">
                <label className="block text-xs text-white/55">
                  {t('category')}
                  <select value={category} onChange={(event) => setCategory(event.target.value as MemoryCategory)} className="mt-1 w-full rounded-2xl border border-white/10 bg-[#201d1a] px-3 py-2.5 text-sm text-white outline-none">
                    {(['gift', 'letter', 'notebook', 'photo', 'certificate', 'moment'] as MemoryCategory[]).map((value) => <option key={value} value={value}>{t(value)}</option>)}
                  </select>
                </label>

                <label className="block text-xs text-white/55">
                  {t('title')}
                  <input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none" />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-xs text-white/55">
                    {t('date')}
                    <div className="mt-1 rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">
                      <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="block w-full min-w-0 border-0 bg-transparent p-0 text-sm text-white outline-none" />
                    </div>
                  </label>
                  <label className="block text-xs text-white/55">
                    {t('direction')}
                    <select value={direction} onChange={(event) => setDirection(event.target.value as MemoryDirection)} className="mt-1 w-full rounded-2xl border border-white/10 bg-[#201d1a] px-3 py-2.5 text-sm text-white outline-none">
                      {(['given', 'received', 'shared'] as MemoryDirection[]).map((value) => <option key={value} value={value}>{t(value)}</option>)}
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-xs text-white/55">
                    {t('location')}
                    <select value={displayLocation} onChange={(event) => setDisplayLocation(event.target.value as DisplayLocation)} className="mt-1 w-full rounded-2xl border border-white/10 bg-[#201d1a] px-3 py-2.5 text-sm text-white outline-none">
                      <option value="gift-cabinet">{t('cabinet')}</option>
                      <option value="archive">{t('archiveShelf')}</option>
                      <option value="desk">{t('desk')}</option>
                      <option value="wall">{t('wall')}</option>
                      <option value="wardrobe">{t('wardrobe')}</option>
                    </select>
                  </label>
                  <label className="block text-xs text-white/55">
                    {t('visual')}
                    <select value={visual} onChange={(event) => setVisual(event.target.value as MemoryVisual)} className="mt-1 w-full rounded-2xl border border-white/10 bg-[#201d1a] px-3 py-2.5 text-sm text-white outline-none">
                      <option value="box">{t('box')}</option>
                      <option value="book">{t('book')}</option>
                      <option value="clothing">{t('clothing')}</option>
                      <option value="miniature-house">{t('miniatureHouse')}</option>
                      <option value="coin">{t('coin')}</option>
                      <option value="frame">{t('frame')}</option>
                      <option value="object">{t('object')}</option>
                    </select>
                  </label>
                </div>

                <label className="block text-xs text-white/55">
                  {t('interaction')}
                  <select value={interaction} onChange={(event) => setInteraction(event.target.value as MemoryInteraction)} className="mt-1 w-full rounded-2xl border border-white/10 bg-[#201d1a] px-3 py-2.5 text-sm text-white outline-none">
                    <option value="read">{t('read')}</option>
                    <option value="flip-pages">{t('flipPages')}</option>
                    <option value="rotate">{t('rotate')}</option>
                    <option value="zoom">{t('zoom')}</option>
                    <option value="open-box">{t('openBox')}</option>
                    <option value="view">{t('view')}</option>
                  </select>
                </label>

                <label className="block text-xs text-white/55">
                  {t('description')}
                  <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} className="mt-1 w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none" />
                </label>

                {category === 'notebook' && (
                  <label className="block text-xs text-white/55">
                    {t('notebookPages')}
                    <textarea value={pagesText} onChange={(event) => setPagesText(event.target.value)} rows={7} className="mt-1 w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none" />
                    <span className="mt-1 block text-[11px] leading-5 text-white/35">{t('notebookPagesHint')}</span>
                  </label>
                )}

                <label className="block text-xs text-white/55">
                  {t('image')}
                  <input type="file" accept="image/*" onChange={(event) => setImage(event.target.files?.[0] ?? null)} className="mt-1 block w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:text-white" />
                </label>

                <button type="button" disabled={saving || !title.trim()} onClick={saveMemory} className="w-full rounded-2xl bg-amber-100 py-3 text-sm font-medium text-stone-900 disabled:opacity-40">
                  {saving ? '…' : t('save')}
                </button>
              </div>
            </section>

            <section className="mt-4 rounded-3xl border border-white/10 bg-white/[0.035] p-4">
              <h3 className="mb-4 text-sm font-medium">{t('environmentPreview')}</h3>
              <div className="grid grid-cols-3 gap-2">
                <label className="text-xs text-white/55">
                  {t('season')}
                  <select value={environmentSettings.season} onChange={(event) => onEnvironmentChange({ ...environmentSettings, season: event.target.value as EnvironmentSettings['season'] })} className="mt-1 w-full rounded-xl border border-white/10 bg-[#201d1a] px-2 py-2 text-xs text-white">
                    <option value="auto">{t('auto')}</option><option value="spring">{t('spring')}</option><option value="summer">{t('summer')}</option><option value="autumn">{t('autumn')}</option><option value="winter">{t('winter')}</option>
                  </select>
                </label>
                <label className="text-xs text-white/55">
                  {t('dayPhase')}
                  <select value={environmentSettings.dayPhase} onChange={(event) => onEnvironmentChange({ ...environmentSettings, dayPhase: event.target.value as EnvironmentSettings['dayPhase'] })} className="mt-1 w-full rounded-xl border border-white/10 bg-[#201d1a] px-2 py-2 text-xs text-white">
                    <option value="auto">{t('auto')}</option><option value="day">{t('day')}</option><option value="night">{t('night')}</option>
                  </select>
                </label>
                <label className="text-xs text-white/55">
                  {t('weather')}
                  <select value={environmentSettings.weather} onChange={(event) => onEnvironmentChange({ ...environmentSettings, weather: event.target.value as EnvironmentSettings['weather'] })} className="mt-1 w-full rounded-xl border border-white/10 bg-[#201d1a] px-2 py-2 text-xs text-white">
                    <option value="auto">{t('auto')}</option><option value="clear">{t('clearWeather')}</option><option value="rain">{t('rain')}</option><option value="snow">{t('snow')}</option>
                  </select>
                </label>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
