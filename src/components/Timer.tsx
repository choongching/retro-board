import { useEffect, useRef, useState } from 'react';
import { Icon } from '../icons';
import type { Timer as TimerState } from '../lib/useRetroChannel';

const PRESETS = [3, 5, 10, 15];
const DEFAULT_DURATION = 5 * 60;

export function Timer({
  timer, onChange, isHost,
}: {
  timer: TimerState;
  onChange: (timer: TimerState) => void;
  isHost: boolean;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [lastSetDuration, setLastSetDuration] = useState(DEFAULT_DURATION);
  const [, forceTick] = useState(0);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (!timer.running) return;
    const id = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [timer.running]);

  const secs = timer.running && timer.endsAt
    ? Math.max(0, Math.ceil((timer.endsAt - Date.now()) / 1000))
    : lastSetDuration;

  useEffect(() => {
    if (timer.running && secs === 0 && !expiredRef.current) {
      expiredRef.current = true;
      if (isHost) onChange({ running: false, endsAt: null });
    }
    if (!timer.running) expiredRef.current = false;
  }, [secs, timer.running, isHost, onChange]);

  const m = Math.floor(secs / 60);
  const s = secs % 60;

  const togglePlay = () => {
    if (timer.running) {
      const remaining = timer.endsAt ? Math.max(1, Math.ceil((timer.endsAt - Date.now()) / 1000)) : lastSetDuration;
      setLastSetDuration(remaining);
      onChange({ running: false, endsAt: null });
    } else {
      const dur = (secs === 0 ? DEFAULT_DURATION : (lastSetDuration || DEFAULT_DURATION));
      onChange({ running: true, endsAt: Date.now() + dur * 1000 });
    }
  };

  const pickPreset = (min: number) => {
    setLastSetDuration(min * 60);
    onChange({ running: false, endsAt: null });
    setShowPicker(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        height: 32, padding: '0 4px 0 10px',
        background: secs <= 30 && timer.running ? 'color-mix(in oklch, #C77B58 18%, var(--color-bg))' : 'var(--color-surface-2)',
        borderRadius: 8,
        transition: 'background .2s',
      }}>
        <Icon name="clock" size={13} color="var(--color-text-muted)" />
        <button
          className="mono"
          onClick={() => setShowPicker((p) => !p)}
          style={{
            background: 'transparent', border: 0, padding: 0,
            fontSize: 13, fontWeight: 500, fontVariantNumeric: 'tabular-nums',
            cursor: 'pointer', color: 'var(--color-text)',
            minWidth: 38, textAlign: 'center',
          }}>
          {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
        </button>
        <button
          className="btn ghost icon" style={{ height: 26, width: 26 }}
          onClick={togglePlay}
          title={timer.running ? 'Pause' : 'Start'}>
          <Icon name={timer.running ? 'pause' : 'play'} size={12} />
        </button>
      </div>
      {showPicker && (
        <div className="surface" style={{
          position: 'absolute', top: 38, right: 0, zIndex: 20,
          padding: 8, display: 'flex', gap: 4,
          boxShadow: 'var(--shadow-lg)',
        }}>
          {PRESETS.map((min) => (
            <button key={min} className="btn sm" onClick={() => pickPreset(min)}>
              {min}m
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
