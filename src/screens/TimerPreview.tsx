// Design options gallery for the timebox timer. Unlinked from the app nav;
// reachable at /timer-preview as a living reference for the timer treatments
// we explored (band, dial, LCD card, ring pill) and the one we shipped (Option
// F, the slim topbar LCD). Each stage is interactive.
import { useState, type ReactNode } from 'react';
import { TimerBanner } from '../components/TimerBanner';
import { TimerDial } from '../components/TimerDial';
import { TimerLcdCard } from '../components/TimerLcdCard';
import { TimerRingPill } from '../components/TimerRingPill';
import { TimerTopbarLcd } from '../components/TimerTopbarLcd';
import { IDLE_TIMER, arm, start, pause } from '../lib/timer';
import type { Timer } from '../lib/timer';

function Label({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', padding: '0 18px 6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {children}
    </div>
  );
}

function Stage({ label, isHost, initial }: { label: string; isHost: boolean; initial: Timer }) {
  const [timer, setTimer] = useState<Timer>(initial);
  return (
    <div style={{ marginBottom: 28 }}>
      <Label>{label}</Label>
      <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden', background: 'var(--color-bg)' }}>
        <TimerBanner timer={timer} isHost={isHost} hostName="Wen Bin" onChange={setTimer} />
      </div>
    </div>
  );
}

function DialStage({ label, isHost, initial }: { label: string; isHost: boolean; initial: Timer }) {
  const [timer, setTimer] = useState<Timer>(initial);
  return (
    <div style={{ marginBottom: 28 }}>
      <Label>{label}</Label>
      <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, background: 'var(--color-bg)', padding: 20 }}>
        <TimerDial timer={timer} isHost={isHost} hostName="Wen Bin" onChange={setTimer} />
      </div>
    </div>
  );
}

function LcdStage({ label, isHost, initial }: { label: string; isHost: boolean; initial: Timer }) {
  const [timer, setTimer] = useState<Timer>(initial);
  return (
    <div style={{ marginBottom: 28 }}>
      <Label>{label}</Label>
      <TimerLcdCard timer={timer} isHost={isHost} title="Pre-Estimate Discussion" onChange={setTimer} />
    </div>
  );
}

function RingStage({ label, isHost, initial }: { label: string; isHost: boolean; initial: Timer }) {
  const [timer, setTimer] = useState<Timer>(initial);
  return (
    <div style={{ marginBottom: 28 }}>
      <Label>{label}</Label>
      <TimerRingPill timer={timer} isHost={isHost} onChange={setTimer} />
    </div>
  );
}

// Renders Option F inside a faux topbar so the fit can be judged in context.
function MiniStage({ label, isHost, initial }: { label: string; isHost: boolean; initial: Timer }) {
  const [timer, setTimer] = useState<Timer>(initial);
  return (
    <div style={{ marginBottom: 20 }}>
      <Label>{label}</Label>
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 56, padding: '0 18px',
          border: '1px solid var(--color-border)', borderRadius: 12,
          background: 'var(--color-bg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-text-muted)', fontSize: 14 }}>
          <strong style={{ color: 'var(--color-text)', fontWeight: 600 }}>jomretro</strong>
          <span style={{ color: 'var(--color-text-subtle)' }}>/</span>
          <span>Sprint 42 retro</span>
        </div>
        <TimerTopbarLcd timer={timer} isHost={isHost} onChange={setTimer} />
      </div>
    </div>
  );
}

const now = Date.now();

export function TimerPreview() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 0 80px' }}>
      <h1 style={{ padding: '0 18px', fontSize: 22, fontWeight: 600, letterSpacing: '-0.015em' }}>
        Timebox timer — states
      </h1>
      <p style={{ padding: '0 18px 24px', color: 'var(--color-text-muted)', fontSize: 14 }}>
        Interactive. Host stages have working controls. Live banners tick down in real time —
        the 5-second one will hit the warning + expiry chime if your sound is on.
      </p>

      <Stage label="Host — idle (click “Start a timebox”)" isHost initial={IDLE_TIMER} />
      <Stage label="Host — armed/ready (neutral, awaiting Start)" isHost initial={arm(10 * 60_000)} />
      <Stage label="Host — running (10 min)" isHost initial={start(10 * 60_000, now)} />
      <Stage label="Host — ending soon (45s, amber→red + pulse)" isHost initial={start(45_000, now)} />
      <Stage label="Host — about to expire (5s, listen for chimes)" isHost initial={start(5_000, now)} />
      <Stage label="Host — paused" isHost initial={pause(start(8 * 60_000, now - 2 * 60_000), now)} />
      <Stage label="Host — expired (already past)" isHost initial={start(60_000, now - 90_000)} />

      <div style={{ height: 1, background: 'var(--color-divider)', margin: '12px 18px 28px' }} />

      <Stage label="Participant — running (read-only, no controls)" isHost={false} initial={start(10 * 60_000, now)} />
      <Stage label="Participant — paused" isHost={false} initial={pause(start(8 * 60_000, now - 2 * 60_000), now)} />
      <Stage label="Participant — expired" isHost={false} initial={start(60_000, now - 90_000)} />
      <Stage label="Participant — idle (renders nothing, by design)" isHost={false} initial={IDLE_TIMER} />

      <div style={{ height: 1, background: 'var(--color-divider)', margin: '20px 18px 28px' }} />
      <h2 style={{ padding: '0 18px', fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>
        Circular dial — pie that sweeps like a clock
      </h2>
      <p style={{ padding: '0 18px 24px', color: 'var(--color-text-muted)', fontSize: 14 }}>
        The remaining wedge depletes clockwise from 12 while the hand sweeps. Same urgency colors,
        chimes, and controls as the band.
      </p>

      <DialStage label="Host — idle" isHost initial={IDLE_TIMER} />
      <DialStage label="Host — armed/ready (full neutral pie)" isHost initial={arm(10 * 60_000)} />
      <DialStage label="Host — running (10 min)" isHost initial={start(10 * 60_000, now)} />
      <DialStage label="Host — ending soon (45s, amber→red + ring pulse)" isHost initial={start(45_000, now)} />
      <DialStage label="Host — about to expire (5s, chimes)" isHost initial={start(5_000, now)} />
      <DialStage label="Host — paused" isHost initial={pause(start(8 * 60_000, now - 2 * 60_000), now)} />
      <DialStage label="Host — expired" isHost initial={start(60_000, now - 90_000)} />
      <DialStage label="Participant — running (read-only)" isHost={false} initial={start(10 * 60_000, now)} />
      <DialStage label="Participant — expired" isHost={false} initial={start(60_000, now - 90_000)} />

      <div style={{ height: 1, background: 'var(--color-divider)', margin: '20px 18px 28px' }} />
      <h2 style={{ padding: '0 18px', fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>
        Option D — LCD agenda card (mimics screenshot 1)
      </h2>
      <p style={{ padding: '0 18px 24px', color: 'var(--color-text-muted)', fontSize: 14 }}>
        Seven-segment DSEG7 readout with a ghost-segment backplate; green panel shifts to amber then
        red. Centered pause / +1m / restart, “End” in the ⋮ menu.
      </p>
      <div style={{ padding: '0 18px' }}>
        <LcdStage label="Host — idle (pick a duration)" isHost initial={IDLE_TIMER} />
        <LcdStage label="Host — armed/ready (neutral, Change / Start)" isHost initial={arm(90 * 60_000)} />
        <LcdStage label="Host — running (1 hr 30 min)" isHost initial={start(90 * 60_000, now)} />
        <LcdStage label="Host — ending soon (40s)" isHost initial={start(40_000, now)} />
        <LcdStage label="Host — paused" isHost initial={pause(start(30 * 60_000, now - 5 * 60_000), now)} />
        <LcdStage label="Host — expired" isHost initial={start(60_000, now - 90_000)} />
        <LcdStage label="Participant — running (read-only)" isHost={false} initial={start(45 * 60_000, now)} />
      </div>

      <div style={{ height: 1, background: 'var(--color-divider)', margin: '20px 18px 28px' }} />
      <h2 style={{ padding: '0 18px', fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>
        Option E — expiration ring pill (mimics screenshot 2)
      </h2>
      <p style={{ padding: '0 18px 24px', color: 'var(--color-text-muted)', fontSize: 14 }}>
        Rounded-cap SVG ring depletes clockwise; label + HH:MM:SS; “Extend it” adds 5 minutes.
      </p>
      <div style={{ padding: '0 18px' }}>
        <RingStage label="Host — idle" isHost initial={IDLE_TIMER} />
        <RingStage label="Host — armed/ready (neutral ring, Start)" isHost initial={arm(30 * 60_000)} />
        <RingStage label="Host — running (30 min)" isHost initial={start(30 * 60_000, now)} />
        <RingStage label="Host — ending soon (40s)" isHost initial={start(40_000, now)} />
        <RingStage label="Host — paused" isHost initial={pause(start(20 * 60_000, now - 5 * 60_000), now)} />
        <RingStage label="Host — expired" isHost initial={start(60_000, now - 90_000)} />
        <RingStage label="Participant — running (read-only)" isHost={false} initial={start(30 * 60_000, now)} />
      </div>

      <div style={{ height: 1, background: 'var(--color-divider)', margin: '20px 18px 28px' }} />
      <h2 style={{ padding: '0 18px', fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>
        Option F — slim topbar LCD (shown inside a mock topbar)
      </h2>
      <p style={{ padding: '0 18px 24px', color: 'var(--color-text-muted)', fontSize: 14 }}>
        The Option D readout trimmed to a wide strip: green seven-segment pill + minimal pause /
        extend / end. No title, chip, or subtitle. Participants see only the readout.
      </p>
      <div style={{ padding: '0 18px' }}>
        <MiniStage label="Host — idle (Set timer → presets)" isHost initial={IDLE_TIMER} />
        <MiniStage label="Host — armed/ready (neutral pill, Start)" isHost initial={arm(90 * 60_000)} />
        <MiniStage label="Host — running (1 hr 30 min)" isHost initial={start(90 * 60_000, now)} />
        <MiniStage label="Host — ending soon (40s, red)" isHost initial={start(40_000, now)} />
        <MiniStage label="Host — paused" isHost initial={pause(start(30 * 60_000, now - 5 * 60_000), now)} />
        <MiniStage label="Host — expired" isHost initial={start(60_000, now - 90_000)} />
        <MiniStage label="Participant — running (read-only)" isHost={false} initial={start(45 * 60_000, now)} />
      </div>
    </div>
  );
}
