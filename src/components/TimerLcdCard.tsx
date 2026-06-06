import { useState } from 'react';
import '@fontsource/dseg7-classic/400.css';
import { Icon } from '../icons';
import {
  IDLE_TIMER,
  PRESETS_MIN,
  addTime,
  arm,
  begin,
  formatClock,
  pause,
  reset,
  resume,
} from '../lib/timer';
import type { Timer } from '../lib/timer';
import { useTimebox } from '../lib/useTimebox';

function humanDuration(ms: number): string {
  const min = Math.round(ms / 60_000);
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h} hr ${m} min`;
  if (h) return `${h} hr`;
  return `${m} min`;
}

// Mimics the "agenda card": a goal-icon header with a status pill, a tinted
// seven-segment LCD readout (DSEG7 + ghost backplate), and centered controls.
// Two-step start: a duration is armed first, then the host presses Start.
export function TimerLcdCard({
  timer,
  isHost,
  title = 'Timebox',
  subtitle,
  onChange,
}: {
  timer: Timer;
  isHost: boolean;
  title?: string;
  subtitle?: string;
  onChange: (next: Timer) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [customMin, setCustomMin] = useState('');
  const { rem, expired, paused, ready, level } = useTimebox(timer);

  const idle = timer.status === 'idle';
  if (!isHost && (idle || ready)) return null;

  const live = !idle && !ready;
  const statusLabel = ready ? 'Ready' : expired ? 'Time’s up' : paused ? 'Paused' : 'Ongoing';
  const sub =
    subtitle ??
    (idle
      ? 'Pick a duration to begin'
      : ready
        ? `${humanDuration(timer.durationMs)}. Press Start when ready`
        : `${humanDuration(timer.durationMs)} timebox`);

  const armMin = (min: number) => {
    onChange(arm(min * 60_000));
    setCustomMin('');
  };
  const armCustom = () => {
    const n = Math.round(Number(customMin));
    if (!Number.isFinite(n) || n < 1) return;
    armMin(Math.min(120, n));
  };

  return (
    <div className={`timer-lcd-card timer-lcd--${level}`} data-paused={paused ? '' : undefined}>
      <header className="timer-lcd-head">
        <span className="timer-lcd-goal" aria-hidden>
          <Icon name="target" size={20} />
        </span>
        <div className="timer-lcd-titles">
          <div className="timer-lcd-title-row">
            <span className="timer-lcd-title">{title}</span>
            {!idle && (
              <span className="timer-lcd-status">
                <span className="timer-lcd-status-dot" />
                {statusLabel}
              </span>
            )}
          </div>
          <div className="timer-lcd-sub">{sub}</div>
        </div>
        {isHost && live && (
          <div className="timer-lcd-menu-wrap">
            <button className="timer-lcd-kebab" aria-label="Timer options" onClick={() => setMenuOpen((o) => !o)}>
              <Icon name="more-vertical" size={18} />
            </button>
            {menuOpen && (
              <div className="timer-lcd-menu" role="menu">
                <button
                  className="menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    onChange(IDLE_TIMER);
                  }}
                >
                  End timebox
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <div className="timer-lcd-panel">
        <span className="timer-lcd-clock" aria-hidden>
          <Icon name="clock" size={26} />
        </span>
        <div className="timer-lcd-digits" role="timer" aria-live="off">
          <span className="timer-lcd-ghost" aria-hidden>88:88:88</span>
          <span className="timer-lcd-value">{formatClock(idle ? 0 : rem)}</span>
        </div>
      </div>

      {isHost && idle && (
        <div className="timer-lcd-setup">
          <div className="timer-presets">
            {PRESETS_MIN.map((m) => (
              <button key={m} className="timer-preset" onClick={() => armMin(m)}>
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
              value={customMin}
              onChange={(e) => setCustomMin(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') armCustom();
              }}
            />
            <button className="timer-btn timer-btn--go" onClick={armCustom} disabled={!customMin}>
              Set
            </button>
          </div>
        </div>
      )}

      {isHost && ready && (
        <div className="timer-lcd-launch">
          <button className="timer-lcd-change" onClick={() => onChange(IDLE_TIMER)}>
            Change
          </button>
          <button className="timer-lcd-start" onClick={() => onChange(begin(timer, Date.now()))}>
            <Icon name="play" size={15} />
            Start
          </button>
        </div>
      )}

      {isHost && live && (
        <div className="timer-lcd-controls">
          {paused ? (
            <button className="timer-lcd-ctrl" aria-label="Resume" title="Resume" onClick={() => onChange(resume(timer, Date.now()))}>
              <Icon name="play" size={18} />
            </button>
          ) : (
            <button className="timer-lcd-ctrl" aria-label="Pause" title="Pause" onClick={() => onChange(pause(timer, Date.now()))} disabled={expired}>
              <Icon name="pause" size={18} />
            </button>
          )}
          <button className="timer-lcd-ctrl" aria-label="Add one minute" title="+1 min" onClick={() => onChange(addTime(timer, 60_000, Date.now()))}>
            <Icon name="plus" size={18} />
          </button>
          <button className="timer-lcd-ctrl" aria-label="Restart" title="Restart" onClick={() => onChange(reset(timer, Date.now()))}>
            <Icon name="restart" size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
