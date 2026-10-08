import { store, fileToDataUrl, type Letter } from './store';

const sheet = document.getElementById('sheet')!;
const body = document.getElementById('sheet-body')!;
let onClose: (() => void) | null = null;

export function openSheet(html: string, bind?: (root: HTMLElement) => void, closed?: () => void) {
  body.innerHTML = html;
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
  const render = (tab: 'list' | 'write', open?: Letter) => {
    const letters = store.letters();
    let inner = '';
    if (open) {
      inner = `<div class="paper">${esc(open.body)}<div class="sig">— ${esc(open.from)} · ${esc(open.date)}</div></div>
        <div class="row" style="margin-top:14px"><button class="ghost" data-back>返回信箱</button></div>`;
    } else if (tab === 'list') {
      inner = `<div class="letter-list">${letters.map((l) => `
        <button class="letter-item" data-id="${esc(l.id)}"><div class="t">${esc(l.title)}</div>
        <div class="d">${esc(l.from)} · ${esc(l.date)}</div></button>`).join('')}</div>`;
    } else {
      inner = `<div class="field"><label>標題</label><input id="lt" maxlength="60" placeholder="寫給 V 的一封信" /></div>
        <div class="field"><label>內容</label><textarea id="lb" placeholder="今天想說的話……"></textarea></div>
        <div class="field"><label>署名</label><input id="lf" maxlength="30" value="我" /></div>
        <div class="row"><button class="primary" id="seal">封存這封信</button></div>`;
    }
    openSheet(`<h2>Letters</h2><div class="sub">信箱 · ${letters.length} 封</div>
      ${open ? '' : `<div class="tabs"><button data-tab="list" class="${tab === 'list' ? 'on' : ''}">信件</button>
      <button data-tab="write" class="${tab === 'write' ? 'on' : ''}">寫信</button></div>`}${inner}`, (root) => {
      root.querySelectorAll<HTMLElement>('[data-tab]').forEach((b) =>
        b.addEventListener('click', () => render(b.dataset.tab as 'list' | 'write')));
      root.querySelectorAll<HTMLElement>('[data-id]').forEach((b) =>
        b.addEventListener('click', () => render('list', letters.find((l) => l.id === b.dataset.id))));
      root.querySelector('[data-back]')?.addEventListener('click', () => render('list'));
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
