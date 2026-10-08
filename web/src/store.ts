/** Tiny local-first persistence. Every read/write is guarded (private mode, quotas). */
export interface Letter { id: string; title: string; body: string; from: string; date: string }

const K = {
  letters: 'dearv.letters.v1',
  photos: 'dearv.photos.v1',
  gift: 'dearv.gift.v1',
  state: 'dearv.state.v1',
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

const SEED: Letter[] = [
  {
    id: 'seed-1',
    title: '給 V：第一晚',
    from: '我',
    date: '2027-01-01',
    body:
      '這是我們的第一個家。\n\n窗外是整個海港，晚上的燈會一盞一盞亮起來。我把你喜歡的東西都放在這裡了——' +
      '沙發邊的落地燈、書房牆上的照片、還有那個你一定會先打開的禮物盒。\n\n以後的每一封信，都放在這個信箱裡。',
  },
  {
    id: 'seed-2',
    title: '關於黑膠唱機',
    from: '我',
    date: '2027-02-14',
    body: '如果有一天晚上睡不著，就去客廳把唱機打開，坐在沙發上看海。\n\n音樂是為這個房間寫的，很慢，很輕。',
  },
];

export const store = {
  letters(): Letter[] {
    return read<Letter[]>(K.letters, SEED);
  },
  addLetter(l: Omit<Letter, 'id' | 'date'>): Letter[] {
    const list = [{ ...l, id: `l-${Date.now()}`, date: new Date().toISOString().slice(0, 10) }, ...store.letters()];
    write(K.letters, list);
    return list;
  },
  photos(): Record<number, string> {
    return read<Record<number, string>>(K.photos, {});
  },
  setPhoto(index: number, dataUrl: string): boolean {
    const p = store.photos();
    p[index] = dataUrl;
    return write(K.photos, p);
  },
  gift(): string {
    return read<string>(K.gift, '親愛的 V：\n\n不管窗外是晴天還是下雨，\n這裡永遠為你留一盞燈。\n\n生日快樂。');
  },
  setGift(text: string) {
    write(K.gift, text);
  },
  state(): { t?: number; lights?: number } {
    return read(K.state, {});
  },
  setState(s: { t: number; lights: number }) {
    write(K.state, s);
  },
};

/** Downscale an uploaded image so it fits comfortably in localStorage. */
export async function fileToDataUrl(file: File, max = 1024): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const s = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * s);
    c.height = Math.round(img.height * s);
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}
