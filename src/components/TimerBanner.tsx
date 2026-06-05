import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Icon } from '../icons';
import {
  IDLE_TIMER,
  PRESETS_MIN,
  addTime,
  arm,
  begin,
  formatRemaining,
  pause,
  resume,
} from '../lib/timer';
import type { Timer } from '../lib/timer';
import { useTimebox } from '../lib/useTimebox';

export function TimerBanner({
  timer,
  isHost,
  hostName,
  onChange,
}: {
  timer: Timer;
  isHost: boolean;
  hostName?: string;
  onChange: (next: Timer) => void;
}) {
  const reduce = useReducedMotion();
  const [setupOpen, setSetupOpen] = useState(false);
  const [customMin, setCustomMin] = useState('');
  const { rem, expired, paused, ready, frac, level, muted, toggleMute } = useTimebox(timer);

  const live = timer.status === 'running' || timer.status === 'paused';
  // Host sees idle (start affordance) and armed states; participants only the live countdown.
  const visible = isHost || live;

  const armMin = (min: number) => {
    onChange(arm(min * 60_000));
    setCustomMin('');
    setSetupOpen(false); // so re-opening after a box ends starts from the quiet CTA
  };
  const armCustom = () => {
    const n = Math.round(Number(customMin));
    if (!Number.isFinite(n) || n < 1) return;
    armMin(Math.min(120, n));
  };

  const transition = reduce ? { duration: 0 } : { duration: 0.22, ease: [0.4, 0, 0.2, 1] as const };

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          key="timer-band"
          className={`timer-band timer-band--${level}`}
          data-paused={paused ? '' : undefined}
          data-pulse={level === 'critical' && !reduce ? '' : undefined}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={transition}
        >
          <div className="timer-band-inner">
            <span className="timer-clock" aria-hidden>
              <Icon name={paused ? 'pause' : 'clock'} size={16} strokeWidth={1.8} />
            </span>

            {timer.status === 'idle' ? (
              <IdleControls
                open={setupOpen}
                onOpen={() => setSetupOpen(true)}
                onCancel={() => {
                  setSetupOpen(false);
                  setCustomMin('');
                }}
                customMin={customMin}
                onCustomMin={setCustomMin}
                onPreset={armMin}
                onArmCustom={armCustom}
              />
            ) : ready ? (
              <>
                <span className="timer-time">{formatRemaining(rem)}</span>
                <span className="timer-note">Ready to start</span>
                <span className="timer-grow" />
                {isHost && (
                  <div className="timer-controls">
                    <button className="timer-btn timer-btn--go" onClick={() => onChange(begin(timer, Date.now()))}>
                      <Icon name="play" size={12} />
                      Start
                    </button>
                    <button
                      className="timer-btn timer-btn--icon"
                      aria-label="Cancel"
                      title="Cancel"
                      onClick={() => onChange(IDLE_TIMER)}
                    >
                      <Icon name="x" size={13} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                {expired ? (
                  <span className="timer-msg">Time’s up.</span>
                ) : (
                  <span className="timer-time" aria-live="off">
                    {formatRemaining(rem)}
                  </span>
                )}
                <span className="timer-note">
                  {expired
                    ? isHost
                      ? 'Keep going if you need to.'
                      : 'Wrap up when you’re ready.'
                    : paused
                      ? 'Paused'
                      : hostName
                        ? `Set by ${hostName}`
                        : ''}
                </span>

                <span className="timer-grow" />

                {isHost && (
                  <div className="timer-controls">
                    <button className="timer-btn" onClick={() => onChange(addTime(timer, 60_000, Date.now()))}>
                      +1m
                    </button>
                    <button className="timer-btn" onClick={() => onChange(addTime(timer, 5 * 60_000, Date.now()))}>
                      +5m
                    </button>
                    {!expired &&
                      (paused ? (
                        <button
                          className="timer-btn timer-btn--icon"
                          aria-label="Resume timer"
                          title="Resume"
                          onClick={() => onChange(resume(timer, Date.now()))}
                        >
                          <Icon name="play" size={13} />
                        </button>
                      ) : (
                        <button
                          className="timer-btn timer-btn--icon"
                          aria-label="Pause timer"
                          title="Pause"
                          onClick={() => onChange(pause(timer, Date.now()))}
                        >
                          <Icon name="pause" size={13} />
                        </button>
                      ))}
                    <button
                      className="timer-btn timer-btn--icon"
                      aria-label="End timer"
                      title="End timebox"
                      onClick={() => onChange(IDLE_TIMER)}
                    >
                      <Icon name="stop" size={13} />
                    </button>
                  </div>
                )}

                <button
                  className="timer-btn timer-btn--icon timer-mute"
                  aria-label={muted ? 'Unmute timer sound' : 'Mute timer sound'}
                  title={muted ? 'Unmute' : 'Mute'}
                  onClick={toggleMute}
                >
                  <Icon name={muted ? 'bell-off' : 'bell'} size={14} />
                </button>
              </>
            )}
          </div>

          {timer.status !== 'idle' && (
            <div className="timer-progress">
              <div
                className="timer-progress-fill"
                style={{
                  width: `${frac * 100}%`,
                  // Freeze the fill (no ease) while paused so it doesn't drift.
                  transition: paused || reduce ? 'none' : 'width 240ms linear',
                }}
              />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function IdleControls({
  open,
  onOpen,
  onCancel,
  customMin,
  onCustomMin,
  onPreset,
  onArmCustom,
}: {
  open: boolean;
  onOpen: () => void;
  onCancel: () => void;
  customMin: string;
  onCustomMin: (v: string) => void;
  onPreset: (min: number) => void;
  onArmCustom: () => void;
}) {
  if (!open) {
    return (
      <button className="timer-start-cta" onClick={onOpen}>
        Start a timebox
      </button>
    );
  }
  return (
    <>
      <span className="timer-note">Timebox</span>
      <div className="timer-presets">
        {PRESETS_MIN.map((m) => (
          <button key={m} className="timer-preset" onClick={() => onPreset(m)}>
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
          onChange={(e) => onCustomMin(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onArmCustom();
            if (e.key === 'Escape') onCancel();
          }}
        />
        <button className="timer-btn timer-btn--go" onClick={onArmCustom} disabled={!customMin}>
          Set
        </button>
      </div>
      <span className="timer-grow" />
      <button
        className="timer-btn timer-btn--icon"
        aria-label="Cancel"
        title="Cancel"
        onClick={onCancel}
      >
        <Icon name="x" size={14} />
      </button>
    </>
  );
}
