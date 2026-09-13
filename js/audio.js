window.HJ = window.HJ || {};
(function () {
/**
 * 哈基米音效引擎
 * 全部用 Web Audio 实时合成，无需外部音频资源。
 * Lv6 解锁「哈基米语音」后，音效升级为更完整的合成语音包。
 */
let ctx = null;
let enabled = true;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
function setEnabled(v) { enabled = v; }
function unlockAudio() { ac(); }

function tone({ freq = 440, dur = 0.12, type = 'sine', gain = 0.15, delay = 0, slideTo = null, vibrato = 0 }) {
  const c = ac(); if (!c || !enabled) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.linearRampToValueAtTime(slideTo, t0 + dur);
  if (vibrato) {
    const lfo = c.createOscillator(); const lg = c.createGain();
    lfo.frequency.value = 8; lg.gain.value = vibrato;
    lfo.connect(lg); lg.connect(osc.frequency); lfo.start(t0); lfo.stop(t0 + dur);
  }
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g); g.connect(c.destination);
  osc.start(t0); osc.stop(t0 + dur + 0.02);
}

function noise({ dur = 0.2, gain = 0.1, delay = 0 }) {
  const c = ac(); if (!c || !enabled) return;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource(); src.buffer = buf;
  const g = c.createGain(); g.gain.value = gain;
  const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1200;
  src.connect(f); f.connect(g); g.connect(c.destination);
  src.start(c.currentTime + delay);
}

const SFX = {
  // 记录成功：清脆上行三连
  success: (v) => { [660, 880, 1170].forEach((f, i) => tone({ freq: f, dur: 0.13, type: 'triangle', gain: 0.16, delay: i * 0.075 })); if (v) hajimiVoice(1.0); },
  // 异常：下行滑音
  bad: (v) => { tone({ freq: 520, dur: 0.28, type: 'sawtooth', gain: 0.1, slideTo: 180 }); if (v) hajimiVoice(0.6, true); },
  // 升级：琶音 + 闪光
  levelup: (v) => { [523, 659, 784, 1046, 1318].forEach((f, i) => tone({ freq: f, dur: 0.16, type: 'square', gain: 0.12, delay: i * 0.08 })); setTimeout(() => noise({ dur: 0.5, gain: 0.05 }), 400); if (v) hajimiVoice(1.3); },
  // 掀衣服：咻
  peek: () => { tone({ freq: 300, dur: 0.18, type: 'sine', gain: 0.12, slideTo: 900 }); noise({ dur: 0.15, gain: 0.06, delay: 0.02 }); },
  // 警告：两声警报
  warn: () => { [0, 0.22].forEach(d => tone({ freq: 880, dur: 0.16, type: 'square', gain: 0.1, delay: d })); },
  // 勋章：叮
  medal: () => { tone({ freq: 1318, dur: 0.5, type: 'sine', gain: 0.14 }); tone({ freq: 1975, dur: 0.4, type: 'sine', gain: 0.07, delay: 0.05 }); },
  // 点击
  tap: () => tone({ freq: 720, dur: 0.05, type: 'triangle', gain: 0.06 }),
  // 嗝屁风险
  danger: () => { [0, 0.3, 0.6].forEach(d => tone({ freq: 220, dur: 0.25, type: 'sawtooth', gain: 0.11, slideTo: 110, delay: d })); },
};

/** 合成「哈基米」人声感语调（Lv6 后启用） */
function hajimiVoice(rate = 1, sad = false) {
  const c = ac(); if (!c || !enabled) return;
  const base = sad ? 300 : 420;
  const seq = sad ? [1, 0.85, 0.7] : [1, 1.25, 1.5, 1.2];
  seq.forEach((r, i) => {
    tone({
      freq: base * r, dur: 0.12 / rate, type: 'sawtooth', gain: 0.07,
      delay: i * (0.11 / rate), vibrato: 14, slideTo: base * r * (sad ? 0.92 : 1.08),
    });
  });
}

function play(name, opts = {}) {
  try { SFX[name] && SFX[name](opts.voice); } catch (e) { /* 静默失败 */ }
}
function haptic(ms = 15) {
  try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* ignore */ }
}

  window.HJ.audio = { setEnabled, unlockAudio, play, haptic };
})();
