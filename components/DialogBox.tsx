'use client';

export default function DialogBox({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed bottom-28 left-1/2 z-40 w-[90%] max-w-sm -translate-x-1/2 rounded-2xl bg-white/95 p-4 shadow-2xl sm:bottom-10">
      <p className="mb-3 text-sm text-slate-700">嗨，好久不見了。</p>
      <div className="flex flex-col gap-2">
        <button className="rounded-lg bg-slate-100 py-2 text-sm hover:bg-slate-200">你好</button>
        <button className="rounded-lg bg-slate-100 py-2 text-sm hover:bg-slate-200">今天過得怎麼樣？</button>
        <button onClick={onClose} className="rounded-lg bg-slate-800 py-2 text-sm text-white hover:bg-slate-700">
          關閉
        </button>
      </div>
    </div>
  );
}
