import { useState, type CSSProperties } from 'react';
import { useReducedMotion } from 'motion/react';
import { Icon } from '../icons';
import { IDLE_TIMER, PRESETS_MIN, addTime, arm, begin, formatRemaining, pause, resume } from '../lib/timer';
import type { Timer } from '../lib/timer';
import { useTimebox } from '../lib/useTimebox';

// A pie-style countdown: the remaining wedge depletes clockwise from 12 o'clock
// while a thin hand sweeps the boundary, mimicking a clock. Digital time sits in
// the center disc for legibility. Two-step start: arm a duration, then Start.
export function TimerDial({
  timer,
  isHost,
  hostName,
  onChange,
  size = 88,
}: {
  timer: Timer;
  isHost: boolean;
  hostName?: string;
  onChange: (next: Timer) => void;
  size?: number;
}) {
  const reduce = useReducedMotion();
  const [setupOpen, setSetupOpen] = useState(false);
  const [customMin, setCustomMin] = useState('');
  const { rem, expired, paused, ready, frac, level, muted, toggleMute } = useTimebox(timer);

  const idle = timer.status === 'idle';
  const live = timer.status === 'running' || timer.status === 'paused';
  if (!isHost && (idle || ready)) return null;

  // Elapsed angle: 0deg = full pie, 360deg = empty. The hand sits at this angle.
  const elapsedDeg = expired ? 360 : (1 - frac) * 360;
  const sweep = paused || reduce ? 'none' : 'var(--timer-sweep, 240ms) linear';

  const dialStyle = {
    width: size,
    height: size,
    '--timer-elapsed-deg': `${elapsedDeg}deg`,
    '--timer-sweep-transition': sweep,
  } as CSSProperties;

  const dataState = idle ? 'idle' : ready ? 'ready' : expired ? 'expired' : 'running';

  const armMin = (min: number) => {
    onChange(arm(min * 60_000));
    setCustomMin('');
    setSetupOpen(false);
  };
  const armCustom = () => {
    const n = Math.round(Number(customMin));
    if (!Number.isFinite(n) || n < 1) return;
    armMin(Math.min(120, n));
  };

  return (
    <div className={`timer-dial-wrap timer-dial--${level}`} data-paused={paused ? '' : undefined}>
      <div className="timer-dial" style={dialStyle} data-state={dataState}>
        <div className="timer-dial-pie" />
        {live && !expired && <div className="timer-dial-hand" />}
        <div className="timer-dial-face">
          {idle ? (
            <span className="timer-dial-glyph">
              <Icon name="clock" size={Math.round(size * 0.26)} strokeWidth={1.6} />
            </span>
          ) : (
            <span className="timer-dial-time" style={{ fontSize: Math.round(size * 0.2) }}>
              {formatRemaining(rem)}
            </span>
          )}
        </div>
      </div>

      <div className="timer-dial-side">
        {idle ? (
          isHost &&
          (setupOpen ? (
            <div className="timer-dial-setup">
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
                    if (e.key === 'Escape') { setSetupOpen(false); setCustomMin(''); }
                  }}
                />
                <button className="timer-btn timer-btn--go" onClick={armCustom} disabled={!customMin}>
                  Set
                </button>
              </div>
            </div>
          ) : (
            <button className="timer-start-cta" onClick={() => setSetupOpen(true)}>
              Start a timebox
            </button>
          ))
        ) : ready ? (
          <>
            <div className="timer-dial-label">Ready to start</div>
            {isHost && (
              <div className="timer-controls">
                <button className="timer-btn timer-btn--go" onClick={() => onChange(begin(timer, Date.now()))}>
                  <Icon name="play" size={12} />
                  Start
                </button>
                <button className="timer-btn timer-btn--icon" aria-label="Cancel" title="Cancel" onClick={() => onChange(IDLE_TIMER)}>
                  <Icon name="x" size={13} />
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="timer-dial-label">
              {expired ? 'Time’s up' : paused ? 'Paused' : hostName ? `Set by ${hostName}` : 'Timebox'}
            </div>
            {expired && (
              <div className="timer-note">
                {isHost ? 'Keep going if you need to.' : 'Wrap up when you’re ready.'}
              </div>
            )}
            <div className="timer-controls">
              {isHost && (
                <>
                  <button className="timer-btn" onClick={() => onChange(addTime(timer, 60_000, Date.now()))}>+1m</button>
                  <button className="timer-btn" onClick={() => onChange(addTime(timer, 5 * 60_000, Date.now()))}>+5m</button>
                  {!expired &&
                    (paused ? (
                      <button className="timer-btn timer-btn--icon" aria-label="Resume" title="Resume" onClick={() => onChange(resume(timer, Date.now()))}>
                        <Icon name="play" size={13} />
                      </button>
                    ) : (
                      <button className="timer-btn timer-btn--icon" aria-label="Pause" title="Pause" onClick={() => onChange(pause(timer, Date.now()))}>
                        <Icon name="pause" size={13} />
                      </button>
                    ))}
                  <button className="timer-btn timer-btn--icon" aria-label="End timebox" title="End timebox" onClick={() => onChange(IDLE_TIMER)}>
                    <Icon name="stop" size={13} />
                  </button>
                </>
              )}
              <button
                className="timer-btn timer-btn--icon timer-mute"
                aria-label={muted ? 'Unmute timer sound' : 'Mute timer sound'}
                title={muted ? 'Unmute' : 'Mute'}
                onClick={toggleMute}
              >
                <Icon name={muted ? 'bell-off' : 'bell'} size={14} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
