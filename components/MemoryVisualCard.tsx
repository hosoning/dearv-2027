'use client';

import type { MemoryObject } from '@/lib/types';
import { decodeMemoryNote } from '@/lib/memory-system';

export default function MemoryVisualCard({ object, compact = false }: { object: MemoryObject; compact?: boolean }) {
  const meta = decodeMemoryNote(object.note);
  if (object.image_url) return <img src={object.image_url} alt={object.title} className="h-full w-full object-cover" />;

  const common = `relative flex h-full ${compact ? '' : 'min-h-64'} w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_38%,#6e5a45_0%,#30271f_42%,#171411_100%)]`;
  if (object.id === 'starter-tie-set' || meta.visual === 'box') return (
    <div className={common}>
      <div className="absolute h-[47%] w-[64%] translate-y-[12%] rounded-[7px] border border-amber-100/25 bg-[#d9c8ad] shadow-2xl">
        <div className="absolute -top-[30%] left-0 h-[32%] w-full origin-bottom -skew-x-6 rounded-t-md border border-amber-100/20 bg-[#a98f6e]" />
        <div className="absolute left-[22%] top-[21%] h-[52%] w-[12%] -rotate-6 rounded-sm bg-[#2e3035] shadow-lg" />
        <div className="absolute left-[48%] top-[27%] h-[37%] w-[18%] rotate-6 rounded-sm bg-[#554a48]" />
        <div className="absolute right-[10%] top-[22%] h-8 w-8 rounded-full border-[5px] border-[#c9a963]" />
      </div>
    </div>
  );
  if (object.id === 'starter-gold-520' || meta.visual === 'coin') return (
    <div className={common}>
      <div className="relative aspect-square h-[55%] rounded-full border-[5px] border-[#e3c16c] bg-[radial-gradient(circle_at_35%_28%,#ffe7a0,#c38f2d_58%,#795416)] shadow-[0_15px_35px_rgba(220,170,62,.25)]">
        <div className="absolute inset-[10%] rounded-full border border-amber-100/60" />
        <div className="absolute inset-0 flex items-center justify-center font-serif text-[clamp(16px,4vw,34px)] font-semibold text-[#755117] drop-shadow-sm">520</div>
      </div>
    </div>
  );
  if (object.id === 'starter-star-certificate' || meta.visual === 'frame') return (
    <div className={common}>
      <div className="relative aspect-[1.38] w-[66%] border-[7px] border-[#72583c] bg-[#eee2ca] p-[8%] shadow-2xl">
        <div className="h-1 w-1/2 rounded bg-stone-400/60" /><div className="mt-[7%] h-1 w-4/5 rounded bg-stone-400/40" /><div className="mt-[7%] h-1 w-3/5 rounded bg-stone-400/40" />
        <div className="absolute right-[13%] top-[18%] text-xl text-[#c59b3c]">✦</div>
        <div className="absolute bottom-[12%] right-[14%] h-7 w-7 rounded-full border-2 border-[#c59b3c]" />
      </div>
    </div>
  );
  if (object.id === 'starter-music-house' || meta.visual === 'miniature-house') return (
    <div className={common}>
      <div className="relative mt-[7%] h-[42%] w-[48%] rounded-sm bg-[#ead9bc] shadow-[0_12px_35px_rgba(255,201,111,.22)]">
        <div className="absolute -top-[38%] left-[9%] h-[62%] w-[82%] rotate-45 rounded-[3px] bg-[#704636]" />
        <div className="absolute bottom-[13%] left-[15%] h-[45%] w-[20%] rounded-t-full bg-[#604333]" />
        <div className="absolute bottom-[28%] right-[18%] h-[24%] w-[22%] bg-[#ffd478] shadow-[0_0_18px_#ffc55e]" />
      </div>
    </div>
  );
  if (object.id === 'starter-silk-pajamas' || meta.visual === 'clothing') return (
    <div className={common}>
      <div className="relative h-[70%] w-[52%]">
        <div className="absolute left-[22%] top-0 h-[58%] w-[56%] rounded-t-[30%] bg-[repeating-linear-gradient(90deg,#28333e_0_12%,#a2aab0_13%_15%)] shadow-2xl" />
        <div className="absolute left-[5%] top-[11%] h-[48%] w-[21%] -rotate-12 rounded bg-[#28333e]" /><div className="absolute right-[5%] top-[11%] h-[48%] w-[21%] rotate-12 rounded bg-[#28333e]" />
        <div className="absolute bottom-0 left-[25%] h-[49%] w-[20%] bg-[repeating-linear-gradient(90deg,#28333e_0_40%,#89939a_42%_46%)]" /><div className="absolute bottom-0 right-[25%] h-[49%] w-[20%] bg-[repeating-linear-gradient(90deg,#28333e_0_40%,#89939a_42%_46%)]" />
      </div>
    </div>
  );
  return <div className={common}><span className="text-3xl text-amber-100/55">✦</span></div>;
}
