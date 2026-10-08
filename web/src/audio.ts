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
