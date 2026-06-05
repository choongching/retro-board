import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { Icon } from '../icons';
import { EXTEND_MIN, IDLE_TIMER, PRESETS_MIN, addTime, arm, begin, formatClock } from '../lib/timer';
import type { Timer } from '../lib/timer';
import { useTimebox } from '../lib/useTimebox';

const SIZE = 46;
const STROKE = 5;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

const extendLabel = (min: number) => `${min} ${min === 1 ? 'minute' : 'minutes'}`;

// Mimics the "expiration pill": a rounded-cap SVG ring on the left, a label +
// HH:MM:SS in the middle, and an Extend menu on the right (host picks the amount).
export function TimerRingPill({
  timer,
  isHost,
  label,
  onChange,
}: {
  timer: Timer;
  isHost: boolean;
  label?: string;
  onChange: (next: Timer) => void;
}) {
  const reduce = useReducedMotion();
  const [customMin, setCustomMin] = useState('');
  const [extendOpen, setExtendOpen] = useState(false);
  const extendRef = useRef<HTMLDivElement | null>(null);
  const { rem, expired, paused, ready, frac, level } = useTimebox(timer);

  // Close the extend menu on outside click / Esc.
  useEffect(() => {
    if (!extendOpen) return;
    const onDown = (e: MouseEvent) => {
      if (extendRef.current && !extendRef.current.contains(e.target as Node)) setExtendOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExtendOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [extendOpen]);

  const idle = timer.status === 'idle';
  if (!isHost && (idle || ready)) return null;

  const text =
    label ??
    (idle
      ? 'Set a timebox'
      : ready
        ? 'Ready to start'
        : expired
          ? 'Time’s up'
          : paused
            ? 'Paused'
            : 'Time remaining');
  // Visible arc = remaining fraction, sweeping clockwise from 12.
  const dashoffset = C * (1 - (idle ? 0 : frac));

  const armMin = (min: number) => {
    onChange(arm(min * 60_000));
    setCustomMin('');
  };
  const armCustom = () => {
    const n = Math.round(Number(customMin));
    if (!Number.isFinite(n) || n < 1) return;
    armMin(Math.min(120, n));
  };
  const extendBy = (min: number, now: number) => {
    onChange(addTime(timer, min * 60_000, now));
    setExtendOpen(false);
  };

  return (
    <div className={`timer-ring-pill timer-ring--${level}`} data-paused={paused ? '' : undefined}>
      <svg className="timer-ring-svg" width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden>
        <circle className="timer-ring-track" cx={SIZE / 2} cy={SIZE / 2} r={R} strokeWidth={STROKE} fill="none" />
        <circle
          className="timer-ring-progress"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={dashoffset}
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
            transition: paused || reduce ? 'stroke 0.25s ease' : 'stroke-dashoffset 240ms linear, stroke 0.25s ease',
          }}
        />
      </svg>

      <div className="timer-ring-text">
        <div className="timer-ring-label">{text}</div>
        {!idle && <div className="timer-ring-time">{formatClock(rem)}</div>}
      </div>

      <span className="timer-grow" />

      {isHost &&
        (idle ? (
          <div className="timer-ring-setup">
            {PRESETS_MIN.map((m) => (
              <button key={m} className="timer-preset" onClick={() => armMin(m)}>
                {m}m
              </button>
            ))}
            <input
              className="timer-custom-input"
              type="number"
              min={1}
              max={120}
              inputMode="numeric"
              placeholder="min"
              value={customMin}
              onChange={(e) => setCustomMin(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') armCustom();
              }}
            />
          </div>
        ) : ready ? (
          <div className="timer-ring-launch">
            <button className="timer-ring-start" onClick={() => onChange(begin(timer, Date.now()))}>
              <Icon name="play" size={13} />
              Start
            </button>
            <button className="timer-ring-clear" aria-label="Clear timer" title="Clear" onClick={() => onChange(IDLE_TIMER)}>
              <Icon name="x" size={14} />
            </button>
          </div>
        ) : (
          <div className="timer-ext" ref={extendRef}>
            <button
              className="timer-ring-extend"
              aria-haspopup="menu"
              aria-expanded={extendOpen}
              onClick={() => setExtendOpen((o) => !o)}
            >
              <Icon name="plus" size={13} />
              Extend it
              <span className={`timer-ext-caret${extendOpen ? ' is-open' : ''}`}>
                <Icon name="chevron-down" size={13} />
              </span>
            </button>
            {extendOpen && (
              <div className="timer-ext-menu" role="menu">
                {EXTEND_MIN.map((m) => (
                  <button key={m} className="timer-ext-item" role="menuitem" onClick={() => extendBy(m, Date.now())}>
                    +{extendLabel(m)}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
