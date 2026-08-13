'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Room, PlacedItem, Letter, MemoryObject } from '@/lib/types';
import {
  getActiveRoom,
  listPlacedItems,
  listLetters,
  addLetter,
  listMemoryObjects,
  addMemoryObject,
  uploadAttachment,
} from '@/lib/storage';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useLanguage, type Language } from '@/lib/i18n';
import {
  DEFAULT_ENVIRONMENT_SETTINGS,
  loadEnvironmentSettings,
  resolveEnvironment,
  saveEnvironmentSettings,
  type EnvironmentSettings,
} from '@/lib/environment';
import {
  decodeMemoryNote,
  encodeMemoryNote,
  legacyTypeForMemory,
  positionForLocation,
} from '@/lib/memory-system';
import PlacedItemMesh from './PlacedItemMesh';
import MemoryObjectMesh from './MemoryObjectMesh';
import LetterPanel from './LetterPanel';
import DialogBox from './DialogBox';
import MobileJoysticks from './MobileJoysticks';
import EntranceGate from './EntranceGate';
import OwnerPanel, { type OwnerMemoryInput } from './OwnerPanel';
import MemoryDetailPanel from './MemoryDetailPanel';
import DisplayModeControls from './DisplayModeControls';
import MemoryVisualCard from './MemoryVisualCard';

const Scene = dynamic(() => import('./Scene'), { ssr: false });

function LanguageSwitcher({ language, setLanguage }: { language: Language; setLanguage: (language: Language) => void }) {
  return (
    <div className="flex rounded-full border border-white/10 bg-black/25 p-1 backdrop-blur-xl">
      {(['zh-TW', 'zh-CN', 'en'] as Language[]).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setLanguage(item)}
          className={`rounded-full px-2.5 py-1.5 text-[10px] transition ${language === item ? 'bg-white text-stone-900' : 'text-white/55 hover:text-white'}`}
        >
          {item === 'zh-TW' ? '繁中' : item === 'zh-CN' ? '简中' : 'EN'}
        </button>
      ))}
    </div>
  );
}

export default function HouseApp() {
  const isMobile = useIsMobile();
  const { language, setLanguage, t } = useLanguage();
  const [entered, setEntered] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [memoryObjects, setMemoryObjects] = useState<MemoryObject[]>([]);
  const [lettersOpen, setLettersOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedObject, setSelectedObject] = useState<MemoryObject | null>(null);
  const [environmentSettings, setEnvironmentSettings] = useState<EnvironmentSettings>(DEFAULT_ENVIRONMENT_SETTINGS);
  const [clock, setClock] = useState(() => Date.now());

  useEffect(() => {
    setEnvironmentSettings(loadEnvironmentSettings());
    const timer = window.setInterval(() => setClock(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

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

  const environment = useMemo(() => resolveEnvironment(environmentSettings, new Date(clock)), [environmentSettings, clock]);

  const handleEnvironmentChange = useCallback((settings: EnvironmentSettings) => {
    setEnvironmentSettings(settings);
    saveEnvironmentSettings(settings);
  }, []);

  const handleCreateLetter = useCallback(
    async (input: { title: string; content: string; mood_tag: string | null; attachment_url: string | null }) => {
      if (!room) return;
      const letter = await addLetter(room.id, input);
      setLetters((current) => [letter, ...current]);
    },
    [room]
  );

  const handleAddMemory = useCallback(
    async (input: OwnerMemoryInput) => {
      if (!room) return;
      const sameLocation = memoryObjects.filter((object) => decodeMemoryNote(object.note).displayLocation === input.displayLocation).length;
      const [x, y, z] = positionForLocation(input.displayLocation, sameLocation);
      const imageUrl = input.image ? await uploadAttachment(input.image) : null;
      const note = encodeMemoryNote({
        category: input.category,
        date: input.date || undefined,
        direction: input.direction,
        displayLocation: input.displayLocation,
        interaction: input.interaction,
        visual: input.visual,
        description: input.description || undefined,
        pages: input.pages.length ? input.pages : undefined,
      });
      const object = await addMemoryObject(room.id, {
        type: legacyTypeForMemory(input.category),
        title: input.title,
        image_url: imageUrl,
        note,
        pos_x: x,
        pos_y: y,
        pos_z: z,
      });
      setMemoryObjects((current) => [...current, object]);
    },
    [room, memoryObjects]
  );

  if (!entered) {
    return <EntranceGate language={language} setLanguage={setLanguage} t={t} onEnter={() => setEntered(true)} />;
  }

  if (!room) {
    return <div className="fixed inset-0 flex items-center justify-center bg-[#171513] text-sm text-white/55">{t('loading')}</div>;
  }

  const clockText = new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : language === 'zh-CN' ? 'zh-CN' : 'zh-HK', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(clock));

  const seasonLabel = t(environment.season);
  const weatherLabel = t(environment.weather === 'clear' ? 'clearWeather' : environment.weather);
  const phaseLabel = t(environment.dayPhase);

  return (
    <div className="app-viewport fixed inset-0 overflow-hidden bg-stone-900 text-white">
      <Scene
        environment={environment}
        onCompanionClick={() => setDialogOpen(true)}
        onArchiveClick={() => setCollectionOpen(true)}
        onLettersClick={() => setLettersOpen(true)}
        onGiftsClick={() => setCollectionOpen(true)}
      >
        {placedItems.map((item) => <PlacedItemMesh key={item.id} item={item} />)}
        {memoryObjects.map((object) => (
          <MemoryObjectMesh key={object.id} object={object} onClick={() => setSelectedObject(object)} />
        ))}
      </Scene>

      <div className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-start justify-between gap-3 p-3 sm:p-4">
        <div className="pointer-events-auto rounded-2xl border border-white/10 bg-black/25 px-3 py-2 backdrop-blur-xl">
          <p className="text-[9px] uppercase tracking-[0.28em] text-amber-100/50">dearv-2027</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-white/75">
            <span>{clockText}</span>
            <span className="text-white/25">·</span>
            <span>{seasonLabel}</span>
            <span className="text-white/25">·</span>
            <span>{phaseLabel}</span>
            <span className="text-white/25">·</span>
            <span>{weatherLabel}</span>
          </div>
        </div>

        <div className="pointer-events-auto flex flex-wrap justify-end gap-2">
          <DisplayModeControls />
          <LanguageSwitcher language={language} setLanguage={setLanguage} />
          <button type="button" onClick={() => setCollectionOpen(true)} className="rounded-full border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/75 backdrop-blur-xl hover:bg-black/40">{t('archive')}</button>
          <button type="button" onClick={() => setLettersOpen(true)} className="rounded-full border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/75 backdrop-blur-xl hover:bg-black/40">{t('letters')}</button>
          <button type="button" onClick={() => setOwnerOpen(true)} aria-label={t('owner')} className="h-9 w-9 rounded-full border border-white/10 bg-black/25 text-xs text-white/45 backdrop-blur-xl hover:text-white">⌁</button>
        </div>
      </div>

      {!isSupabaseConfigured && (
        <div className="pointer-events-none fixed bottom-20 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] text-white/35 backdrop-blur-xl">
          {t('localOnly')}
        </div>
      )}

      {!isMobile && (
        <div className="pointer-events-none fixed bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-[11px] text-white/55 backdrop-blur-xl">
          {t('walkHint')}
        </div>
      )}
      {isMobile && (
        <>
          <MobileJoysticks />
          <div className="mobile-control-hint pointer-events-none fixed bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/20 px-3 py-1 text-[10px] text-white/35">{t('mobileHint')}</div>
        </>
      )}

      {collectionOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/45 p-3 backdrop-blur-sm sm:items-center" onMouseDown={(event) => event.target === event.currentTarget && setCollectionOpen(false)}>
          <div className="max-h-[82vh] w-full max-w-4xl overflow-y-auto rounded-[30px] border border-white/10 bg-[#171513]/95 p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-amber-100/45">PRIVATE ARCHIVE</p>
                <h2 className="mt-1 text-lg font-medium">{t('archive')}</h2>
              </div>
              <button type="button" onClick={() => setCollectionOpen(false)} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/55">{t('close')}</button>
            </div>
            {memoryObjects.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 p-10 text-center text-sm leading-7 text-white/35">{t('emptyArchive')}</div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {memoryObjects.map((object) => {
                  const meta = decodeMemoryNote(object.note);
                  return (
                    <button
                      key={object.id}
                      type="button"
                      onClick={() => {
                        setCollectionOpen(false);
                        setSelectedObject(object);
                      }}
                      className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] text-left transition hover:-translate-y-0.5 hover:bg-white/[0.06]"
                    >
                      <div className="aspect-[4/3] bg-black/15">
                        <MemoryVisualCard object={object} compact />
                      </div>
                      <div className="p-3">
                        <p className="truncate text-sm text-white/80">{object.title || t(meta.category)}</p>
                        <p className="mt-1 truncate text-[10px] text-white/35">{meta.date || t(meta.displayLocation === 'gift-cabinet' ? 'cabinet' : meta.displayLocation === 'archive' ? 'archiveShelf' : meta.displayLocation)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <LetterPanel open={lettersOpen} onClose={() => setLettersOpen(false)} letters={letters} onCreate={handleCreateLetter} />
      <MemoryDetailPanel object={selectedObject} onClose={() => setSelectedObject(null)} t={t} />
      <OwnerPanel
        open={ownerOpen}
        onClose={() => setOwnerOpen(false)}
        onAddMemory={handleAddMemory}
        environmentSettings={environmentSettings}
        onEnvironmentChange={handleEnvironmentChange}
        t={t}
      />
      <DialogBox open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
