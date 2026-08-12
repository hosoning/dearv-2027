'use client';

import { useEffect, useMemo, useState } from 'react';
import type { MemoryObject } from '@/lib/types';
import { decodeMemoryNote } from '@/lib/memory-system';

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
    }, 280);
  }

  return (
    <div>
      <div className="mx-auto mt-4 w-full max-w-xl [perspective:1400px]">
        <div className="relative min-h-[360px] rounded-[10px_26px_26px_10px] bg-[#d3b991] p-2 shadow-2xl">
          <div
            className={`min-h-[344px] origin-left rounded-[6px_22px_22px_6px] bg-[#f2e8d6] p-7 text-stone-700 shadow-inner transition-transform duration-300 [transform-style:preserve-3d] ${
              turning === 'next' ? '[transform:rotateY(-82deg)]' : turning === 'previous' ? '[transform:rotateY(42deg)]' : ''
            }`}
          >
            <div className="mb-5 flex items-center justify-between border-b border-stone-300/70 pb-3 text-[11px] uppercase tracking-[0.24em] text-stone-400">
              <span>dearv archive</span>
              <span>{t('page')} {page + 1}</span>
            </div>
            <div className="whitespace-pre-wrap font-serif text-[15px] leading-8">{safePages[page] || ' '}</div>
          </div>
          <div className="absolute bottom-4 left-1 top-4 w-1 rounded-full bg-black/10" />
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-md" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[30px] border border-white/12 bg-[#171513]/95 p-5 text-white shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.2em] text-amber-100/45">
              <span>{t(meta.category)}</span>
              {meta.date && <span>· {meta.date}</span>}
              {meta.direction && <span>· {t(meta.direction)}</span>}
            </div>
            <h2 className="text-xl font-medium sm:text-2xl">{object.title || t(meta.category)}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:bg-white/5">{t('close')}</button>
        </div>

        {meta.category === 'notebook' || meta.interaction === 'flip-pages' ? (
          <NotebookViewer pages={meta.pages ?? []} t={t} />
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-[minmax(0,1.1fr)_minmax(220px,.9fr)]">
            <div className="min-h-64 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]">
              {object.image_url ? (
                <img src={object.image_url} alt={object.title || t(meta.category)} className="h-full min-h-64 w-full object-contain" />
              ) : (
                <div className="flex min-h-64 items-center justify-center p-8 text-center text-sm text-white/25">
                  {t(meta.visual === 'miniature-house' ? 'miniatureHouse' : meta.visual)}
                </div>
              )}
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">{t('location')}</p>
                  <p className="mt-1 text-white/75">{meta.displayLocation === 'gift-cabinet' ? t('cabinet') : meta.displayLocation === 'archive' ? t('archiveShelf') : t(meta.displayLocation)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">{t('interaction')}</p>
                  <p className="mt-1 text-white/75">{t(meta.interaction === 'flip-pages' ? 'flipPages' : meta.interaction === 'open-box' ? 'openBox' : meta.interaction)}</p>
                </div>
                {meta.description && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">{t('description')}</p>
                    <p className="mt-2 whitespace-pre-wrap leading-7 text-white/70">{meta.description}</p>
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
