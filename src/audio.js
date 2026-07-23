let AC = null;

export function initAudio() {
  if (AC) return;
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
  } catch {
    /* no audio */
  }
}

export function sfx(kind) {
  if (!AC) return;
  const t = AC.currentTime;
  function noise(dur, f, vol) {
    const b = AC.createBuffer(1, AC.sampleRate * dur, AC.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = AC.createBufferSource();
    s.buffer = b;
    const fl = AC.createBiquadFilter();
    fl.type = 'bandpass';
    fl.frequency.value = f;
    const g = AC.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(fl).connect(g).connect(AC.destination);
    s.start();
  }
  function tone(f0, f1, dur, vol, type = 'sine') {
    const o = AC.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + dur);
    const g = AC.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(AC.destination);
    o.start(t);
    o.stop(t + dur);
  }
  if (kind === 'slash') noise(0.09, 2600, 0.25);
  else if (kind === 'hit') { noise(0.07, 900, 0.3); tone(180, 60, 0.09, 0.25, 'square'); }
  else if (kind === 'parry') { tone(1400, 2200, 0.16, 0.3, 'triangle'); noise(0.12, 4000, 0.2); }
  else if (kind === 'dash') noise(0.14, 1400, 0.14);
  else if (kind === 'launch') tone(220, 660, 0.18, 0.28, 'sawtooth');
  else if (kind === 'skill') { tone(90, 32, 0.6, 0.5, 'sine'); noise(0.5, 500, 0.5); }
  else if (kind === 'hurt') tone(140, 50, 0.2, 0.35, 'square');
  else if (kind === 'win') [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, f, 0.25, 0.25, 'triangle'), i * 140));
  else if (kind === 'lose') tone(300, 80, 0.9, 0.3, 'sawtooth');
}
