'use client';

import { useState } from 'react';
import { moveCameraTo } from '@/lib/controlsState';
import type { Language } from '@/lib/i18n';

const VIEWS = [
  { id: 'foyer', icon: '⌂', position: [-9.45, 1.62, 9.8], lookAt: [-3.7, 1.25, 4.2] },
  { id: 'living', icon: '◫', position: [-5.4, 1.62, 1.45], lookAt: [-0.55, 0.9, -3.75] },
  { id: 'kitchen', icon: '◇', position: [-3.75, 1.62, 4.7], lookAt: [0, 1.0, 8.4] },
  { id: 'study', icon: '▤', position: [-10.25, 1.62, 0.65], lookAt: [-12.0, 1.05, -4.1] },
  { id: 'bedroom', icon: '▰', position: [8.1, 1.62, 5.2], lookAt: [13.1, 1.0, 7.0] },
  { id: 'closet', icon: '⌑', position: [8.7, 1.62, -1.25], lookAt: [8.7, 1.32, -5.42] },
  { id: 'bath', icon: '○', position: [7.35, 1.62, -8.05], lookAt: [11.4, 1.05, -9.35] },
] as const;

const LABELS: Record<Language, Record<(typeof VIEWS)[number]['id'], string>> = {
  'zh-TW': { foyer: '玄關', living: '客廳', kitchen: '廚房', study: '書房', bedroom: '睡房', closet: '衣帽間', bath: '浴室' },
  'zh-CN': { foyer: '玄关', living: '客厅', kitchen: '厨房', study: '书房', bedroom: '睡房', closet: '衣帽间', bath: '浴室' },
  en: { foyer: 'Foyer', living: 'Living', kitchen: 'Kitchen', study: 'Study', bedroom: 'Bedroom', closet: 'Closet', bath: 'Bath' },
};

export default function RoomNavigator({ language }: { language: Language }) {
  const [active, setActive] = useState('foyer');

  return (
    <nav aria-label="Room navigation" className="pointer-events-auto fixed bottom-[max(14px,env(safe-area-inset-bottom))] left-1/2 z-30 flex max-w-[calc(100vw-24px)] -translate-x-1/2 gap-1 overflow-x-auto rounded-full border border-white/10 bg-[#171513]/72 p-1.5 shadow-2xl backdrop-blur-xl [scrollbar-width:none]">
      {VIEWS.map((view) => (
        <button
          key={view.id}
          type="button"
          aria-pressed={active === view.id}
          onClick={() => {
            setActive(view.id);
            moveCameraTo([...view.position], [...view.lookAt]);
            window.dispatchEvent(new CustomEvent('dearv:navigate', {
              detail: { position: [...view.position], lookAt: [...view.lookAt] },
            }));
          }}
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-2 text-[10px] transition sm:px-3 ${active === view.id ? 'bg-white text-stone-900 shadow-sm' : 'text-white/65 hover:bg-white/10 hover:text-white'}`}
        >
          <span aria-hidden className="text-[12px]">{view.icon}</span>
          <span>{LABELS[language][view.id]}</span>
        </button>
      ))}
    </nav>
  );
}
