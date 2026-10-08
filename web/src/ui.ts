import { store, fileToDataUrl, type Letter } from './store';

export interface BookPage { image?: string | null; text?: string; heading?: string }
export interface Book { title: string; subtitle?: string; pages: BookPage[] }
export interface ContentLetter { title: string; from?: string; date?: string; image?: string; pages: string[] }
export interface Keepsake { title: string; date?: string; pages: BookPage[] }
export interface Content { keepsakes: Keepsake[]; letters: ContentLetter[] }

let content: Content = { keepsakes: [], letters: [] };
let assetBase = './';
export function setContent(c: Content, base: string) { content = c; assetBase = base; }
const img = (src?: string | null) => (!src ? '' : /^(data:|https?:|blob:)/.test(src) ? src : assetBase + src);

/** Split long text into pages that fit a book page. */
function paginate(text: string, per = 230): string[] {
  const out: string[] = [];
  let cur = '';
  for (const para of text.split(/\n/)) {
    if ((cur + para).length > per && cur) { out.push(cur.trim()); cur = ''; }
    cur += para + '\n';
  }
  if (cur.trim()) out.push(cur.trim());
  return out.length ? out : [''];
}

export function letterBook(l: { title: string; from?: string; date?: string; image?: string; pages?: string[]; body?: string }): Book {
  const texts = l.pages ?? paginate(l.body ?? '');
  const pages: BookPage[] = texts.map((t) => ({ text: t }));
  if (l.image) pages.unshift({ image: l.image });
  pages.push({ text: `— ${l.from ?? '我'}${l.date ? ' · ' + l.date : ''}`, heading: 'sig' });
  return { title: l.title, subtitle: l.date, pages };
}
export const keepsakeBook = (i: number): Book | null => {
  const k = content.keepsakes[i];
  return k ? { title: k.title, subtitle: k.date, pages: k.pages } : null;
};
export const pinnedLetterBook = (i: number): Book | null => {
  const l = content.letters[i];
  return l ? letterBook(l) : null;
};

/** A page-turning book: swipe / arrows / tap edges to flip. */
export function openBook(book: Book, closed?: () => void) {
  const pages = [{ heading: 'cover' } as BookPage, ...book.pages];
  const html = `<div class="book" tabindex="0">
    <div class="book-stage">${pages.map((p, i) => `
      <div class="leaf" style="z-index:${pages.length - i}">
        <div class="leaf-face">${
          p.heading === 'cover'
            ? `<div class="cover"><div class="cover-orn">❦</div><h3>${esc(book.title)}</h3>${book.subtitle ? `<div class="cover-sub">${esc(book.subtitle)}</div>` : ''}<div class="cover-hint">翻開 →</div></div>`
            : `${p.image ? `<img src="${esc(img(p.image))}" alt="" draggable="false" />` : ''}${
                p.text ? `<div class="leaf-text ${p.heading === 'sig' ? 'sig' : ''} ${p.image ? 'caption' : ''}">${esc(p.text)}</div>` : ''}`
        }<div class="folio">${i === 0 ? '' : i}</div></div>
        <div class="leaf-back"></div>
      </div>`).join('')}
    </div>
    <div class="book-nav"><button data-prev aria-label="上一頁">‹</button><span data-count></span><button data-next aria-label="下一頁">›</button></div>
  </div>`;
  openSheet(html, (root) => {
    root.closest('.sheet-card')!.classList.add('wide');
    const leaves = [...root.querySelectorAll<HTMLElement>('.leaf')];
    const count = root.querySelector<HTMLElement>('[data-count]')!;
    let cur = 0;
    const render = () => {
      leaves.forEach((l, i) => {
        l.classList.toggle('flipped', i < cur);
        l.style.zIndex = String(i < cur ? i : leaves.length - i);
      });
      count.textContent = `${cur + 1} / ${leaves.length}`;
    };
    const go = (d: number) => { cur = Math.max(0, Math.min(leaves.length - 1, cur + d)); render(); };
    root.querySelector('[data-prev]')!.addEventListener('click', () => go(-1));
    root.querySelector('[data-next]')!.addEventListener('click', () => go(1));
    const stage = root.querySelector<HTMLElement>('.book-stage')!;
    let sx = 0;
    stage.addEventListener('pointerdown', (e) => { sx = e.clientX; });
    stage.addEventListener('pointerup', (e) => {
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      else {
        const r = stage.getBoundingClientRect();
        go(e.clientX - r.left < r.width * 0.3 ? -1 : 1);
      }
    });
    const key = (e: KeyboardEvent) => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); };
    window.addEventListener('keydown', key);
    render();
    const prevClose = closed;
    onClose = () => { window.removeEventListener('keydown', key); prevClose?.(); };
  }, closed);
}

const sheet = document.getElementById('sheet')!;
const body = document.getElementById('sheet-body')!;
let onClose: (() => void) | null = null;

export function openSheet(html: string, bind?: (root: HTMLElement) => void, closed?: () => void) {
  body.innerHTML = html;
  body.closest('.sheet-card')!.classList.remove('wide');
  sheet.hidden = false;
  onClose = closed ?? null;
  bind?.(body);
}
export function closeSheet() {
  sheet.hidden = true;
  body.innerHTML = '';
  const cb = onClose;
  onClose = null;
  cb?.();
}
export const sheetOpen = () => !sheet.hidden;
sheet.addEventListener('click', (e) => {
  if (e.target === sheet || (e.target as HTMLElement).closest('[data-close]')) closeSheet();
});
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && sheetOpen()) closeSheet(); });

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export function lettersSheet() {
  const render = (tab: 'list' | 'write') => {
    const mine = store.letters();
    const pinned = content.letters;
    let inner = '';
    if (tab === 'list') {
      inner = `<div class="letter-list">${pinned.map((l, i) => `
        <button class="letter-item" data-pin="${i}"><div class="t">✉︎ ${esc(l.title)}</div>
        <div class="d">${esc(l.from ?? '我')}${l.date ? ' · ' + esc(l.date) : ''} · 信件牆</div></button>`).join('')}
        ${mine.map((l) => `
        <button class="letter-item" data-id="${esc(l.id)}"><div class="t">${esc(l.title)}</div>
        <div class="d">${esc(l.from)} · ${esc(l.date)}</div></button>`).join('')}</div>`;
    } else {
      inner = `<div class="field"><label>標題</label><input id="lt" maxlength="60" placeholder="寫給 V 的一封信" /></div>
        <div class="field"><label>內容</label><textarea id="lb" placeholder="今天想說的話……"></textarea></div>
        <div class="field"><label>署名</label><input id="lf" maxlength="30" value="我" /></div>
        <div class="row"><button class="primary" id="seal">封存這封信</button></div>`;
    }
    openSheet(`<h2>Letters</h2><div class="sub">信箱 · ${pinned.length + mine.length} 封</div>
      <div class="tabs"><button data-tab="list" class="${tab === 'list' ? 'on' : ''}">信件</button>
      <button data-tab="write" class="${tab === 'write' ? 'on' : ''}">寫信</button></div>${inner}`, (root) => {
      root.querySelectorAll<HTMLElement>('[data-tab]').forEach((b) =>
        b.addEventListener('click', () => render(b.dataset.tab as 'list' | 'write')));
      root.querySelectorAll<HTMLElement>('[data-pin]').forEach((b) =>
        b.addEventListener('click', () => openBook(pinnedLetterBook(+b.dataset.pin!)!, () => {})));
      root.querySelectorAll<HTMLElement>('[data-id]').forEach((b) =>
        b.addEventListener('click', () => {
          const l = mine.find((x) => x.id === b.dataset.id) as Letter;
          openBook(letterBook(l));
        }));
      root.querySelector('#seal')?.addEventListener('click', () => {
        const title = (root.querySelector('#lt') as HTMLInputElement).value.trim();
        const text = (root.querySelector('#lb') as HTMLTextAreaElement).value.trim();
        const from = (root.querySelector('#lf') as HTMLInputElement).value.trim() || '我';
        if (!text) return;
        store.addLetter({ title: title || '無題', body: text, from });
        render('list');
      });
    });
  };
  render('list');
}

export function photoSheet(index: number, current: string, onReplace: (dataUrl: string) => void) {
  openSheet(`<h2>Memory</h2><div class="sub">回憶相框 ${index + 1}</div>
    <img class="photo-big" id="pimg" src="${current}" alt="" />
    <div class="row"><label class="primary" style="cursor:pointer">換一張照片<input id="pf" type="file" accept="image/*" hidden /></label>
    <span class="sub" id="pmsg" style="margin:0"></span></div>`, (root) => {
    root.querySelector('#pf')!.addEventListener('change', async (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (!f) return;
      const url = await fileToDataUrl(f);
      (root.querySelector('#pimg') as HTMLImageElement).src = url;
      const ok = store.setPhoto(index, url);
      (root.querySelector('#pmsg') as HTMLElement).textContent = ok ? '已掛上牆' : '已顯示（瀏覽器空間不足，未保存）';
      onReplace(url);
    });
  });
}

export function giftSheet(closed: () => void) {
  const render = (edit: boolean) => {
    const text = store.gift();
    openSheet(edit
      ? `<h2>Gift</h2><div class="sub">改寫卡片</div><div class="field"><textarea id="gt">${esc(text)}</textarea></div>
         <div class="row"><button class="primary" id="gs">放回禮物盒</button></div>`
      : `<div class="gift-card"><div class="heart">♥</div><h2>For V</h2></div>
         <div class="paper">${esc(text)}</div>
         <div class="row" style="margin-top:14px"><button class="ghost" id="ge">改寫卡片</button></div>`,
    (root) => {
      root.querySelector('#ge')?.addEventListener('click', () => render(true));
      root.querySelector('#gs')?.addEventListener('click', () => {
        store.setGift((root.querySelector('#gt') as HTMLTextAreaElement).value);
        render(false);
      });
    }, closed);
  };
  render(false);
}
