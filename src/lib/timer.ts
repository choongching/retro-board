// Shared timebox timer: state machine + a tiny asset-free chime.
//
// The running timer stores an absolute `endsAt` wall-clock so every client
// derives "remaining" locally (no per-second broadcasts, no drift). "Expired"
// is NOT a stored state: a running timer whose endsAt is in the past renders
// as expired everywhere. This keeps expiry robust even if the host drops.

export type Timer =
  | { status: 'idle' }
  | { status: 'ready'; durationMs: number } // a duration is armed but the host hasn't started it
  | { status: 'running'; endsAt: number; durationMs: number }
  | { status: 'paused'; remainingMs: number; durationMs: number };

export const IDLE_TIMER: Timer = { status: 'idle' };

export const PRESETS_MIN = [5, 10, 15, 20];
export const EXTEND_MIN = [1, 5, 10, 15];

export const MIN_MS = 60_000;
export const WARNING_MS = 30_000; // single chime cue at 30s left
export const CRITICAL_MS = 60_000; // red + pulse under a minute
export const WARNING_FRACTION = 0.25; // amber once a quarter remains

// --- transitions (pure; callers pass `now` so this stays testable) ---

export function start(ms: number, now: number): Timer {
  return { status: 'running', endsAt: now + ms, durationMs: ms };
}

// Arm a duration without starting it: the host still has to press Start.
export function arm(ms: number): Timer {
  return { status: 'ready', durationMs: ms };
}

// Kick off the countdown from an armed (ready) timer.
export function begin(t: Timer, now: number): Timer {
  if (t.status !== 'ready') return t;
  return { status: 'running', endsAt: now + t.durationMs, durationMs: t.durationMs };
}

export function remaining(t: Timer, now: number): number {
  if (t.status === 'running') return Math.max(0, t.endsAt - now);
  if (t.status === 'paused') return t.remainingMs;
  if (t.status === 'ready') return t.durationMs; // shows the full, static duration
  return 0;
}

export function isExpired(t: Timer, now: number): boolean {
  return t.status === 'running' && now >= t.endsAt;
}

export function addTime(t: Timer, ms: number, now: number): Timer {
  // Extending after time's up starts a fresh box of `ms`, so the bar refills.
  if (isExpired(t, now)) return start(ms, now);
  if (t.status === 'running') {
    return { status: 'running', endsAt: t.endsAt + ms, durationMs: t.durationMs + ms };
  }
  if (t.status === 'paused') {
    return { status: 'paused', remainingMs: t.remainingMs + ms, durationMs: t.durationMs + ms };
  }
  if (t.status === 'ready') {
    // Adjusting time before start just changes the armed duration.
    return { status: 'ready', durationMs: t.durationMs + ms };
  }
  return start(ms, now);
}

export function pause(t: Timer, now: number): Timer {
  if (t.status !== 'running') return t;
  return { status: 'paused', remainingMs: Math.max(0, t.endsAt - now), durationMs: t.durationMs };
}

export function resume(t: Timer, now: number): Timer {
  if (t.status !== 'paused') return t;
  return { status: 'running', endsAt: now + t.remainingMs, durationMs: t.durationMs };
}

// Restart the box from the top using its configured duration.
export function reset(t: Timer, now: number): Timer {
  if (t.status !== 'running' && t.status !== 'paused') return t;
  if (t.durationMs <= 0) return t;
  return { status: 'running', endsAt: now + t.durationMs, durationMs: t.durationMs };
}

export function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Zero-padded HH:MM:SS — for the LCD / ring treatments that read like a clock.
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// --- chime: synthesized so there's no audio asset to ship or license ---

let audioCtx: AudioContext | null = null;

function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  if (audioCtx.state === 'suspended') void audioCtx.resume();
  return audioCtx;
}

function blip(ac: AudioContext, freq: number, at: number, dur: number, peak: number) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  // Quick attack, gentle exponential release: a soft, rounded tone, not a beep.
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

// One soft note: "30 seconds".
export function playWarning() {
  const ac = ctx();
  if (!ac) return;
  blip(ac, 660, ac.currentTime, 0.18, 0.06);
}

// Two rising notes: "time's up".
export function playExpiry() {
  const ac = ctx();
  if (!ac) return;
  const t = ac.currentTime;
  blip(ac, 660, t, 0.16, 0.07);
  blip(ac, 880, t + 0.17, 0.26, 0.07);
}
