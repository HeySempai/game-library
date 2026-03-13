// Shared AudioContext (lazy init)
let ctx;
function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

// Short click/tap sound
// Very short (50ms) high-pitched click, square wave at 800Hz, low volume
export function playClick() {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();

  osc.type = 'square';
  osc.frequency.value = 800;

  gain.gain.setValueAtTime(0.15, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.05);

  osc.connect(gain);
  gain.connect(ac.destination);

  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + 0.05);
}

// Whoosh sound for spinning/transitions
// Noise-based whoosh using white noise buffer, 200ms, bandpass filter sweep
export function playWhoosh() {
  const ac = getCtx();
  const bufferSize = ac.sampleRate * 0.2;
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = ac.createBufferSource();
  source.buffer = buffer;

  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 2;
  filter.frequency.setValueAtTime(400, ac.currentTime);
  filter.frequency.exponentialRampToValueAtTime(2000, ac.currentTime + 0.1);
  filter.frequency.exponentialRampToValueAtTime(300, ac.currentTime + 0.2);

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.15, ac.currentTime);
  gain.gain.linearRampToValueAtTime(0.2, ac.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.2);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);

  source.start(ac.currentTime);
  source.stop(ac.currentTime + 0.2);
}

// Success/win fanfare - ascending notes (C5, E5, G5)
// 3 ascending tones each 150ms, triangle wave
export function playSuccess() {
  const ac = getCtx();
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

  notes.forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = 'triangle';
    osc.frequency.value = freq;

    const startTime = ac.currentTime + i * 0.15;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
    gain.gain.setValueAtTime(0.15, startTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.15);
  });
}

// Pop sound for confetti
// Short (80ms) sine at 400Hz with quick frequency drop
export function playPop() {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(150, ac.currentTime + 0.08);

  gain.gain.setValueAtTime(0.2, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.08);

  osc.connect(gain);
  gain.connect(ac.destination);

  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + 0.08);
}

// Tick sound for roulette spinning
// Very short (30ms) sine at 1200Hz, quiet
export function playTick() {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();

  osc.type = 'sine';
  osc.frequency.value = 1200;

  gain.gain.setValueAtTime(0.1, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.03);

  osc.connect(gain);
  gain.connect(ac.destination);

  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + 0.03);
}
