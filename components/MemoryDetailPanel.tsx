'use client';

import { useEffect, useMemo, useState } from 'react';
import type { MemoryObject } from '@/lib/types';
import { decodeMemoryNote } from '@/lib/memory-system';
import Memory3DPreview from './Memory3DPreview';

function NotebookViewer({ pages, t }: { pages: string[]; t: (key: string) => string }) {
  const safePages = pages.length ? pages : [''];
  const [page, setPage] = useState(0);
  const [turning, setTurning] = useState<'next' | 'previous' | null>(null);

  useEffect(() => setPage(0), [pages]);

  function turn(direction: 'next' | 'previous') {
    if (turning) return;
    const target = direction === 'next' ? page + 1 : page - 1;
    if (target < 0 || target >= safePages.length) return;
    setTurning(direction);
    window.setTimeout(() => {
      setPage(target);
      setTurning(null);
    }, 320);
  }

  return (
    <div>
      <div className="mx-auto mt-4 w-full max-w-2xl [perspective:1600px]">
        <div className="relative min-h-[390px] rounded-[12px_28px_28px_12px] bg-[#b99a70] p-2.5 shadow-[0_28px_70px_rgba(0,0,0,.38)]">
          <div className="absolute inset-y-4 left-2 w-2 rounded-full bg-black/12" />
          <div
            className={`relative min-h-[370px] origin-left rounded-[8px_24px_24px_8px] bg-[linear-gradient(90deg,#e2d5c1_0%,#f3eadb_10%,#f6eee2_100%)] p-7 text-stone-700 shadow-inner transition-transform duration-300 [transform-style:preserve-3d] ${
              turning === 'next' ? '[transform:rotateY(-82deg)]' : turning === 'previous' ? '[transform:rotateY(42deg)]' : ''
            }`}
          >
            <div className="mb-5 flex items-center justify-between border-b border-stone-300/70 pb-3 text-[11px] uppercase tracking-[0.24em] text-stone-400">
              <span>dearv archive</span>
              <span>{t('page')} {page + 1}</span>
            </div>
            <div className="whitespace-pre-wrap font-serif text-[15px] leading-8">{safePages[page] || ' '}</div>
            <div className="pointer-events-none absolute inset-y-4 right-2 w-px bg-stone-300/45" />
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-center gap-3">
        <button type="button" disabled={page === 0 || Boolean(turning)} onClick={() => turn('previous')} className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/65 disabled:opacity-25">{t('previous')}</button>
        <span className="min-w-20 text-center text-xs text-white/40">{page + 1} / {safePages.length}</span>
        <button type="button" disabled={page === safePages.length - 1 || Boolean(turning)} onClick={() => turn('next')} className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/65 disabled:opacity-25">{t('next')}</button>
      </div>
    </div>
  );
}

export default function MemoryDetailPanel({ object, onClose, t }: { object: MemoryObject | null; onClose: () => void; t: (key: string) => string }) {
  const meta = useMemo(() => decodeMemoryNote(object?.note), [object]);
  if (!object) return null;

  const interactionKey = meta.interaction === 'open-box' ? 'openBox' : meta.interaction;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 backdrop-blur-lg" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-[32px] border border-white/12 bg-[#171513]/96 p-5 text-white shadow-[0_35px_110px_rgba(0,0,0,.55)] sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.2em] text-amber-100/45">
              <span>{t(meta.category)}</span>
              {meta.date && <span>· {meta.date}</span>}
              {meta.direction && <span>· {t(meta.direction)}</span>}
            </div>
            <h2 className="font-serif text-xl font-medium sm:text-3xl">{object.title || t(meta.category)}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:bg-white/5">{t('close')}</button>
        </div>

        {meta.category === 'notebook' || meta.interaction === 'flip-pages' ? (
          <NotebookViewer pages={meta.pages ?? []} t={t} />
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-[minmax(0,1.35fr)_minmax(260px,.65fr)]">
            <div className="min-h-[320px] overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035] shadow-inner">
              {object.image_url ? (
                <img src={object.image_url} alt={object.title} className="h-full min-h-[320px] w-full object-cover" />
              ) : (
                <Memory3DPreview object={object} />
              )}
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
              <div className="space-y-5 text-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">{t('location')}</p>
                  <p className="mt-1.5 text-white/75">{meta.displayLocation === 'gift-cabinet' ? t('cabinet') : meta.displayLocation === 'archive' ? t('archiveShelf') : t(meta.displayLocation)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">{t('interaction')}</p>
                  <p className="mt-1.5 text-white/75">{t(interactionKey)}</p>
                </div>
                {meta.description && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">{t('description')}</p>
                    <p className="mt-2 whitespace-pre-wrap font-serif text-[15px] leading-7 text-white/72">{meta.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}