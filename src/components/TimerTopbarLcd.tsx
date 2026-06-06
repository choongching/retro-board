import { useEffect, useRef, useState } from 'react';
import '@fontsource/dseg7-classic/400.css';
import { Icon } from '../icons';
import {
  EXTEND_MIN,
  IDLE_TIMER,
  PRESETS_MIN,
  addTime,
  arm,
  begin,
  formatClock,
  pause,
  resume,
} from '../lib/timer';
import type { Timer } from '../lib/timer';
import { useTimebox } from '../lib/useTimebox';

type Menu = 'none' | 'setup' | 'extend';

// Option F: a slim, wide LCD strip for the board topbar. Seven-segment readout
// (with ghost backplate), no card chrome. Two-step start: pick a duration to
// arm it (neutral), then press Start. Participants see only a live readout.
export function TimerTopbarLcd({
  timer,
  isHost,
  onChange,
}: {
  timer: Timer;
  isHost: boolean;
  onChange: (next: Timer) => void;
}) {
  const [menu, setMenu] = useState<Menu>('none');
  const [customMin, setCustomMin] = useState('');
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const { rem, expired, paused, ready, level } = useTimebox(timer);

  useEffect(() => {
    if (menu === 'none') return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenu('none');
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu('none');
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  const idle = timer.status === 'idle';
  if (!isHost && (idle || ready)) return null;

  const armMin = (min: number) => {
    onChange(arm(min * 60_000));
    setCustomMin('');
    setMenu('none');
  };
  const armCustom = () => {
    const n = Math.round(Number(customMin));
    if (!Number.isFinite(n) || n < 1) return;
    armMin(Math.min(120, n));
  };
  const extendBy = (min: number, now: number) => {
    onChange(addTime(timer, min * 60_000, now));
    setMenu('none');
  };

  // ── Idle: a compact "Set timer" popover of presets ──
  if (idle) {
    return (
      <div className="timer-mini" ref={wrapRef}>
        <div className="timer-mini-set">
          <button
            className="timer-mini-set-btn"
            aria-haspopup="menu"
            aria-expanded={menu === 'setup'}
            title="Set a timebox for this session"
            onClick={() => setMenu((m) => (m === 'setup' ? 'none' : 'setup'))}
          >
            <Icon name="clock" size={14} />
            Set timer
            <span className={`timer-ext-caret${menu === 'setup' ? ' is-open' : ''}`}>
              <Icon name="chevron-down" size={12} />
            </span>
          </button>
          {menu === 'setup' && (
            <div className="timer-mini-pop" role="menu">
              <div className="timer-presets">
                {PRESETS_MIN.map((m) => (
                  <button key={m} className="timer-preset" title={`Arm a ${m}-minute timebox`} onClick={() => armMin(m)}>
                    {m}m
                  </button>
                ))}
              </div>
              <div className="timer-custom">
                <input
                  className="timer-custom-input"
                  type="number"
                  min={1}
                  max={120}
                  inputMode="numeric"
                  placeholder="min"
                  title="Enter a custom duration in minutes"
                  value={customMin}
                  onChange={(e) => setCustomMin(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') armCustom();
                  }}
                />
                <button className="timer-btn timer-btn--go" title="Arm this duration (does not start yet)" onClick={armCustom} disabled={!customMin}>
                  Set
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const lcd = (
    <div className={`timer-mini-lcd timer-lcd--${level}`} data-paused={paused ? '' : undefined}>
      <span className="timer-mini-clock" aria-hidden>
        <Icon name="clock" size={13} />
      </span>
      <span
        className="timer-mini-digits"
        role="timer"
        aria-live="off"
        title={ready ? 'Armed and ready. Press Start' : expired ? 'Time is up' : paused ? 'Paused' : 'Time remaining'}
      >
        <span className="timer-mini-ghost" aria-hidden>88:88:88</span>
        <span className="timer-mini-value">{formatClock(rem)}</span>
      </span>
    </div>
  );

  // Participants just see the readout; no module chrome, no controls.
  if (!isHost) {
    return <div className="timer-mini" ref={wrapRef}>{lcd}</div>;
  }

  return (
    <div className="timer-mini" ref={wrapRef}>
      <div className="timer-mini-box">
        {lcd}
        <span className="timer-mini-sep" aria-hidden />

        {ready ? (
          <div className="timer-mini-ctrls">
            <button className="timer-mini-start" title="Start the countdown" onClick={() => onChange(begin(timer, Date.now()))}>
              <Icon name="play" size={13} />
              Start
            </button>
            <button className="timer-mini-btn" aria-label="Clear timer" title="Clear the armed timer" onClick={() => onChange(IDLE_TIMER)}>
              <Icon name="x" size={15} />
            </button>
          </div>
        ) : (
          <div className="timer-mini-ctrls">
            {paused ? (
              <button className="timer-mini-btn" aria-label="Resume" title="Resume the countdown" onClick={() => onChange(resume(timer, Date.now()))}>
                <Icon name="play" size={14} />
              </button>
            ) : (
              <button className="timer-mini-btn" aria-label="Pause" title="Pause the countdown" onClick={() => onChange(pause(timer, Date.now()))} disabled={expired}>
                <Icon name="pause" size={14} />
              </button>
            )}

            <div className="timer-ext">
              <button
                className="timer-mini-btn"
                aria-label="Add time"
                title="Add time"
                aria-haspopup="menu"
                aria-expanded={menu === 'extend'}
                onClick={() => setMenu((m) => (m === 'extend' ? 'none' : 'extend'))}
              >
                <Icon name="plus" size={15} />
              </button>
              {menu === 'extend' && (
                <div className="timer-ext-menu" role="menu">
                  {EXTEND_MIN.map((m) => (
                    <button
                      key={m}
                      className="menu-item"
                      role="menuitem"
                      title={`Add ${m} ${m === 1 ? 'minute' : 'minutes'}`}
                      onClick={() => extendBy(m, Date.now())}
                    >
                      +{m} {m === 1 ? 'minute' : 'minutes'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className="timer-mini-btn" aria-label="End timebox" title="End the timebox" onClick={() => onChange(IDLE_TIMER)}>
              <Icon name="stop" size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
