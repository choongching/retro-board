import { useEffect, useRef, useState } from 'react';
import {
  CRITICAL_MS,
  WARNING_FRACTION,
  WARNING_MS,
  isExpired,
  playExpiry,
  playWarning,
  remaining,
} from './timer';
import type { Timer } from './timer';

const MUTE_KEY = 'retro.timer.muted';

export type TimerLevel = 'idle' | 'ready' | 'normal' | 'warning' | 'critical' | 'expired';

export type Timebox = {
  now: number;
  rem: number;
  expired: boolean;
  paused: boolean;
  /** Armed but not yet started (host still has to press Start). */
  ready: boolean;
  /** Remaining fraction 0..1 (1 = full box, 0 = done). */
  frac: number;
  level: TimerLevel;
  muted: boolean;
  toggleMute: () => void;
};

/**
 * Shared clock for the timebox UI: ticks while running, fires the 30s + expiry
 * chimes once each per endsAt, and derives the urgency level + progress fraction.
 * Consumed by both the digital band and the circular dial so there's one source
 * of truth (and one chime, not two).
 */
export function useTimebox(timer: Timer): Timebox {
  const [now, setNow] = useState(() => Date.now());
  const [muted, setMuted] = useState(() => localStorage.getItem(MUTE_KEY) === '1');
  const warnedFor = useRef<number | null>(null);
  const chimedFor = useRef<number | null>(null);

  const running = timer.status === 'running';
  const endsAt = running ? timer.endsAt : null;

  // Tick only while running; settle exactly on zero, then stop.
  useEffect(() => {
    if (endsAt == null) return;
    let raf = 0;
    let last = 0;
    const loop = () => {
      const t = Date.now();
      if (t - last >= 200) {
        last = t;
        setNow(t);
      }
      if (Date.now() < endsAt) raf = requestAnimationFrame(loop);
      else setNow(endsAt);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [endsAt]);

  // Chime: 30s warning, then expiry. Each fires once per endsAt, per client.
  useEffect(() => {
    if (!running || muted) return;
    const rem = timer.endsAt - now;
    if (rem <= 0) {
      if (chimedFor.current !== timer.endsAt) {
        chimedFor.current = timer.endsAt;
        playExpiry();
      }
    } else if (rem <= WARNING_MS && warnedFor.current !== timer.endsAt) {
      warnedFor.current = timer.endsAt;
      playWarning();
    }
  }, [now, running, muted, timer]);

  const toggleMute = () =>
    setMuted((m) => {
      const next = !m;
      localStorage.setItem(MUTE_KEY, next ? '1' : '0');
      return next;
    });

  const rem = remaining(timer, now);
  const expired = isExpired(timer, now);
  const paused = timer.status === 'paused';
  const ready = timer.status === 'ready';
  const idle = timer.status === 'idle';
  // "live" = counting (running/paused); ready shows a full, static bar.
  const live = timer.status === 'running' || timer.status === 'paused';
  const frac =
    timer.status === 'idle' || timer.durationMs <= 0
      ? 0
      : Math.max(0, Math.min(1, rem / timer.durationMs));

  const level: TimerLevel = idle
    ? 'idle'
    : ready
      ? 'ready'
      : expired
        ? 'expired'
        : live && rem <= CRITICAL_MS
          ? 'critical'
          : live && frac <= WARNING_FRACTION
            ? 'warning'
            : 'normal';

  return { now, rem, expired, paused, ready, frac, level, muted, toggleMute };
}
