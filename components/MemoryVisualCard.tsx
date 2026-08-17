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
      <div className="relative h-[74%] w-[72%]">
        <div className="absolute left-[4%] top-[16%] aspect-square w-[58%] rounded-full border-[5px] border-[#d8c49b] bg-[#eee1bd] shadow-2xl">
          <div className="absolute inset-[9%] overflow-hidden rounded-full bg-[#e8b2bd]">
            {[[-18,4],[10,-2],[35,7],[-5,27],[24,30],[-25,34]].map(([x,y], index) => (
              <div key={index} className="absolute h-[27%] w-[27%] rounded-full bg-[radial-gradient(circle_at_44%_42%,#f4c6cf_0_18%,#df9daa_20%_48%,#b96f80_51%_100%)] shadow-inner" style={{ left: `${38 + x}%`, top: `${29 + y}%` }} />
            ))}
          </div>
          <div className="absolute left-1/2 top-[4%] h-[92%] w-[12%] -translate-x-1/2 rounded-full bg-[#d99ca5]/90 shadow-sm" />
          <div className="absolute left-1/2 top-[4%] h-[15%] w-[42%] -translate-x-1/2 rounded-[50%] border-[9px] border-[#d99ca5]" />
        </div>
        <div className="absolute bottom-[2%] right-[1%] aspect-square w-[44%] rounded-full border-[4px] border-[#eed57b] bg-[radial-gradient(circle_at_36%_28%,#ffeaa5,#c8942f_60%,#7c5519)] shadow-[0_16px_36px_rgba(213,164,55,.28)]">
          <div className="absolute inset-[9%] rounded-full border border-amber-100/60" />
          <div className="absolute inset-0 flex items-center justify-center font-serif text-[clamp(15px,3.2vw,31px)] font-semibold text-[#785316] drop-shadow-sm">520</div>
        </div>
        <div className="absolute right-[4%] top-[9%] h-[35%] w-[39%] rounded-sm bg-[#f0dfb6] shadow-lg before:absolute before:left-[17%] before:top-[-8%] before:h-[13%] before:w-[66%] before:rounded-full before:border-[3px] before:border-[#d5c29d]" />
      </div>
    </div>
  );
  if (object.id === 'starter-star-certificate' || meta.visual === 'frame') return (
    <div className={common}>
      <div className="relative aspect-[1.38] w-[66%] border-[7px] border-[#72583c] bg-[#eee2ca] p-[8%] shadow-2xl">
        <div className="h-1 w-1/2 rounded bg-stone-400/60" /><div className="mt-[7%] h-1 w-4/5 rounded bg-stone-400/40" /><div className="mt-[7%] h-1 w-3/5 rounded bg-stone-400/40" />
        <div className="absolute right-[13%] top-[18%] h-5 w-5 rotate-45 border border-[#c59b3c]" />
        <div className="absolute bottom-[12%] right-[14%] h-7 w-7 rounded-full border-2 border-[#c59b3c]" />
      </div>
    </div>
  );
  if (object.id === 'starter-music-house' || meta.visual === 'miniature-house') return (
    <div className={common}>
      <div className="relative h-[72%] w-[51%]">
        <div className="absolute bottom-0 left-1/2 h-[22%] w-[82%] -translate-x-1/2 rounded-md border border-[#9a734e] bg-[#2d2119] shadow-2xl" />
        <div className="absolute bottom-[18%] left-1/2 h-[55%] w-[72%] -translate-x-1/2 rounded-sm border-[5px] border-[#6b4b32] bg-[radial-gradient(circle_at_50%_55%,rgba(255,211,126,.33),rgba(228,239,233,.1)_45%,rgba(43,31,23,.22)_100%)] shadow-[inset_0_0_20px_rgba(255,221,164,.22)]">
          <div className="absolute bottom-[8%] left-[9%] h-[18%] w-[25%] rounded-sm bg-[#c47753] after:absolute after:-top-[45%] after:left-[8%] after:h-[65%] after:w-[84%] after:rotate-45 after:bg-[#f2eee5]" />
          <div className="absolute bottom-[8%] right-[8%] h-[16%] w-[22%] rounded-sm bg-[#d5bd93] after:absolute after:-top-[45%] after:left-[8%] after:h-[65%] after:w-[84%] after:rotate-45 after:bg-[#f3efe6]" />
          <div className="absolute bottom-[6%] left-1/2 h-[56%] w-[5%] -translate-x-1/2 bg-[#745239]" />
          {[0,1,2].map((i) => <div key={i} className="absolute left-1/2 -translate-x-1/2 rounded-[50%] bg-[#315541]" style={{ bottom: `${18 + i * 14}%`, width: `${48 - i * 10}%`, height: '24%' }} />)}
          {Array.from({ length: 20 }).map((_, i) => <i key={i} className="absolute h-1 w-1 rounded-full bg-[#fff9e7] shadow-[0_0_5px_#fff4c6]" style={{ left: `${8 + (i * 37) % 84}%`, top: `${6 + (i * 23) % 83}%` }} />)}
        </div>
        <div className="absolute left-1/2 top-[10%] h-[15%] w-[82%] -translate-x-1/2 [clip-path:polygon(8%_100%,20%_10%,80%_10%,92%_100%)] bg-[#2b2019]" />
        <div className="absolute left-1/2 top-0 h-[22%] w-[36%] -translate-x-1/2 rounded-[50%] border-[7px] border-[#4b3325]" />
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
  return <div className={common}><span className="h-6 w-6 rotate-45 border border-amber-100/45" /></div>;
}
