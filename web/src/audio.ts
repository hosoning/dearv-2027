/** A slow generative piano-pad loop with vinyl crackle, made entirely in WebAudio. */
export class Music {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private timer = 0;
  private step = 0;
  playing = false;

  private chords = [
    [48, 55, 59, 64, 67], // Cmaj9-ish
    [45, 52, 57, 60, 64], // Am7
    [41, 48, 53, 57, 64], // Fmaj7
    [43, 50, 55, 59, 62], // G6
  ];

  start() {
    if (this.playing) return;
    this.ctx ??= new AudioContext();
    const ctx = this.ctx;
    void ctx.resume();
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 1.5);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2400;
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.42;
    const fb = ctx.createGain();
    fb.gain.value = 0.32;
    delay.connect(fb).connect(delay);
    this.master.connect(lp);
    lp.connect(ctx.destination);
    lp.connect(delay);
    delay.connect(ctx.destination);
    this.crackle();
    this.playing = true;
    this.step = 0;
    const tick = () => {
      this.playBar();
      this.timer = window.setTimeout(tick, 3600);
    };
    tick();
  }

  stop() {
    if (!this.playing || !this.ctx || !this.master) return;
    window.clearTimeout(this.timer);
    const m = this.master;
    m.gain.cancelScheduledValues(this.ctx.currentTime);
    m.gain.setValueAtTime(m.gain.value, this.ctx.currentTime);
    m.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.2);
    setTimeout(() => m.disconnect(), 1400);
    this.playing = false;
  }

  private note(midi: number, when: number, dur: number, vel: number) {
    const ctx = this.ctx!;
    const f = 440 * 2 ** ((midi - 69) / 12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(vel, when + 0.015);
    g.gain.exponentialRampToValueAtTime(vel * 0.35, when + 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    for (const [mult, type, amp] of [[1, 'triangle', 1], [2, 'sine', 0.35], [3, 'sine', 0.12]] as const) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f * mult;
      o.detune.value = (Math.random() - 0.5) * 6;
      const og = ctx.createGain();
      og.gain.value = amp;
      o.connect(og).connect(g);
      o.start(when);
      o.stop(when + dur + 0.05);
    }
    g.connect(this.master!);
  }

  private playBar() {
    const ctx = this.ctx!;
    const t = ctx.currentTime + 0.05;
    const chord = this.chords[this.step % this.chords.length];
    this.note(chord[0] - 12, t, 3.4, 0.16);
    chord.slice(1).forEach((n, i) => this.note(n, t + i * 0.09, 3.2, 0.07));
    // a soft melody fragment
    const mel = [chord[4] + 12, chord[3] + 12, chord[2] + 12];
    mel.forEach((n, i) => { if (Math.random() < 0.75) this.note(n, t + 1.2 + i * 0.6 + Math.random() * 0.05, 1.6, 0.05); });
    this.step++;
  }

  private crackle() {
    const ctx = this.ctx!;
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() < 0.0009 ? (Math.random() - 0.5) * 0.8 : (Math.random() - 0.5) * 0.012;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const g = ctx.createGain();
    g.gain.value = 0.25;
    src.connect(g).connect(this.master!);
    src.start();
  }
}

/** Music-box "Silent Night" (public domain), for the Christmas snow lantern. */
export class MusicBox {
  private ctx: AudioContext | null = null;
  private out: GainNode | null = null;
  private timer = 0;
  playing = false;
  // [midi, beats] in 3/4
  private tune: [number, number][] = [
    [67, 1.5], [69, 0.5], [67, 1], [64, 3], [67, 1.5], [69, 0.5], [67, 1], [64, 3],
    [74, 2], [74, 1], [71, 3], [72, 2], [72, 1], [67, 3],
    [69, 2], [69, 1], [72, 1.5], [71, 0.5], [69, 1], [67, 1.5], [69, 0.5], [67, 1], [64, 3],
    [69, 2], [69, 1], [72, 1.5], [71, 0.5], [69, 1], [67, 1.5], [69, 0.5], [67, 1], [64, 3],
    [74, 2], [74, 1], [77, 1.5], [74, 0.5], [71, 1], [72, 3], [76, 3],
    [72, 1.5], [67, 0.5], [64, 1], [67, 1.5], [65, 0.5], [62, 1], [60, 6],
  ];

  start() {
    if (this.playing) return;
    this.ctx ??= new AudioContext();
    void this.ctx.resume();
    const ctx = this.ctx;
    this.out = ctx.createGain();
    this.out.gain.value = 0.55;
    const echo = ctx.createDelay();
    echo.delayTime.value = 0.23;
    const fb = ctx.createGain();
    fb.gain.value = 0.28;
    echo.connect(fb).connect(echo);
    this.out.connect(ctx.destination);
    this.out.connect(echo);
    echo.connect(ctx.destination);
    this.playing = true;
    const loop = () => {
      const beat = 0.5; // seconds per beat (~120 bpm, slightly slowed by the box)
      let t = ctx.currentTime + 0.08;
      for (const [m, b] of this.tune) {
        this.pluck(m + 12, t, 0.18);
        if (b >= 2) this.pluck(m, t, 0.07);
        t += b * beat * (0.97 + Math.random() * 0.06);
      }
      this.timer = window.setTimeout(loop, (t - ctx.currentTime + 1.2) * 1000);
    };
    loop();
  }

  stop() {
    if (!this.playing || !this.ctx || !this.out) return;
    window.clearTimeout(this.timer);
    const g = this.out;
    g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.25);
    setTimeout(() => g.disconnect(), 1500);
    this.playing = false;
  }

  private pluck(midi: number, when: number, vel: number) {
    const ctx = this.ctx!;
    const f = 440 * 2 ** ((midi - 69) / 12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(vel, when + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 1.6);
    for (const [mult, amp] of [[1, 1], [4.07, 0.35], [10.2, 0.08]] as const) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f * mult;
      const og = ctx.createGain();
      og.gain.value = amp;
      o.connect(og).connect(g);
      o.start(when);
      o.stop(when + 1.7);
    }
    g.connect(this.out!);
  }
}
