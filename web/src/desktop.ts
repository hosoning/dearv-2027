/** The study computer: a small desktop with Photos, Travel, Letters, Notes and Music. */
import { lettersSheet, openBook, letterBook, assetUrl, type Content, type Trip } from './ui';
import { store } from './store';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export interface DesktopHooks {
  photos: () => string[];
  music: { playing: () => boolean; toggle: () => void };
}

export class Desktop {
  private root = document.getElementById('desktop')!;
  private win = this.root.querySelector('.dk-window') as HTMLElement;
  private clock = 0;
  onClose: () => void = () => {};

  constructor(private content: () => Content, private hooks: DesktopHooks) {
    this.root.querySelector('[data-power]')!.addEventListener('click', () => this.close());
    this.root.querySelectorAll<HTMLElement>('[data-app]').forEach((b) =>
      b.addEventListener('click', () => this.app(b.dataset.app!)));
    window.addEventListener('keydown', (e) => { if (!this.root.hidden && e.key === 'Escape') this.close(); });
  }

  get open() { return !this.root.hidden; }

  show() {
    this.root.hidden = false;
    this.win.hidden = true;
    const tick = () => {
      const now = new Date();
      (this.root.querySelector('.dk-clock') as HTMLElement).textContent =
        `${now.getMonth() + 1}月${now.getDate()}日  ${now.toTimeString().slice(0, 5)}`;
    };
    tick();
    this.clock = window.setInterval(tick, 15000);
  }

  close() {
    this.root.hidden = true;
    window.clearInterval(this.clock);
    this.onClose();
  }

  private frame(title: string, body: string) {
    this.win.hidden = false;
    this.win.innerHTML = `<div class="dk-bar"><button class="dk-dot" data-x aria-label="關閉"></button><span>${esc(title)}</span></div>
      <div class="dk-body">${body}</div>`;
    this.win.querySelector('[data-x]')!.addEventListener('click', () => { this.win.hidden = true; });
    return this.win.querySelector('.dk-body') as HTMLElement;
  }

  app(name: string) {
    if (name === 'photos') {
      const imgs = this.hooks.photos();
      const body = this.frame('相簿', `<div class="dk-grid">${imgs.map((s, i) =>
        `<button class="dk-thumb" data-i="${i}" style="background-image:url('${s}')"></button>`).join('')}</div>
        <img class="dk-view" hidden alt="" />`);
      const view = body.querySelector('.dk-view') as HTMLImageElement;
      body.querySelectorAll<HTMLElement>('[data-i]').forEach((b) => b.addEventListener('click', () => {
        view.src = imgs[+b.dataset.i!];
        view.hidden = false;
      }));
      view.addEventListener('click', () => { view.hidden = true; });
    } else if (name === 'travel') {
      travelView(this.frame('旅行', ''), this.content().trips ?? []);
    } else if (name === 'letters') {
      const c = this.content();
      const mine = store.letters();
      const body = this.frame('信件', `<div class="dk-list">${c.letters.map((l, i) =>
        `<button data-pin="${i}"><b>${esc(l.title)}</b><span>${esc(l.date ?? '')}</span></button>`).join('')}
        ${mine.map((l) => `<button data-id="${esc(l.id)}"><b>${esc(l.title)}</b><span>${esc(l.date)}</span></button>`).join('')}
        </div><div class="row" style="margin-top:12px"><button class="primary" data-write>寫一封新的信</button></div>`);
      body.querySelectorAll<HTMLElement>('[data-pin]').forEach((b) =>
        b.addEventListener('click', () => openBook(letterBook(c.letters[+b.dataset.pin!]))));
      body.querySelectorAll<HTMLElement>('[data-id]').forEach((b) =>
        b.addEventListener('click', () => { const l = mine.find((x) => x.id === b.dataset.id); if (l) openBook(letterBook(l)); }));
      body.querySelector('[data-write]')!.addEventListener('click', () => lettersSheet('write'));
    } else if (name === 'notes') {
      const body = this.frame('便條', `<textarea class="dk-notes" id="dk-notes" placeholder="寫點什麼……"></textarea>
        <div class="dk-hint">自動保存在這台裝置上</div>`);
      const ta = body.querySelector('textarea')!;
      ta.value = store.notes();
      ta.addEventListener('input', () => store.setNotes(ta.value));
    } else if (name === 'music') {
      const body = this.frame('音樂', `<div class="dk-music"><div class="dk-disc"></div>
        <button class="primary" data-play></button><p>客廳的黑膠唱機</p></div>`);
      const btn = body.querySelector('[data-play]') as HTMLButtonElement;
      const sync = () => { btn.textContent = this.hooks.music.playing() ? '暫停' : '播放'; body.querySelector('.dk-disc')!.classList.toggle('spin', this.hooks.music.playing()); };
      btn.addEventListener('click', () => { this.hooks.music.toggle(); sync(); });
      sync();
    }
  }
}

/** Trip list → itinerary, with pins on the world map. Shared by the computer and the study wall. */
export function travelView(el: HTMLElement, trips: Trip[]) {
  const map = (focus?: number) => `<div class="tv-map" style="background-image:url('${assetUrl('content/world_map.webp')}')">${
    trips.map((t, i) => (t.lat == null || t.lon == null) ? '' :
      `<i class="tv-pin ${focus === i ? 'on' : ''}" style="left:${((t.lon + 180) / 360) * 100}%;top:${((90 - t.lat) / 180) * 100}%"
        title="${esc(t.title)}"></i>`).join('')}</div>`;
  const list = () => {
    el.innerHTML = `${map()}<div class="tv-list">${trips.map((t, i) => `<button data-t="${i}"><b>${esc(t.title)}</b>
      <span>${esc(t.dates ?? '')}${t.places?.length ? ' · ' + esc(t.places.join('、')) : ''}</span></button>`).join('')
      || '<p class="dk-hint">還沒有旅行記錄。</p>'}</div>`;
    el.querySelectorAll<HTMLElement>('[data-t]').forEach((b) => b.addEventListener('click', () => detail(+b.dataset.t!)));
  };
  const detail = (i: number) => {
    const t = trips[i];
    el.innerHTML = `${map(i)}<div class="tv-detail"><button class="ghost" data-back>‹ 全部旅行</button>
      <h3>${esc(t.title)}</h3><div class="sub">${esc(t.dates ?? '')}</div>
      ${t.cover ? `<img class="tv-cover" src="${esc(assetUrl(t.cover))}" alt="" />` : ''}
      <ol class="tv-days">${(t.days ?? []).map((d) => `<li><b>${esc(d.day)}</b><p>${esc(d.text)}</p></li>`).join('')}</ol>
      ${t.note ? `<p class="tv-note">${esc(t.note)}</p>` : ''}</div>`;
    el.querySelector('[data-back]')!.addEventListener('click', list);
  };
  list();
}
