import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Icon } from '../icons';
import { CursorArrow } from '../components/CursorArrow';
import { RetroWordmark } from '../components/RetroWordmark';
import { useAuth } from '../lib/auth';
import { getBoardByCode } from '../lib/boardsApi';
import { loadProfile, saveProfile } from '../lib/profile';
import { colorForName } from '../data';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export function Landing() {
  const [expanded, setExpanded] = useState(false);
  const reduce = useReducedMotion();

  return (
    <div className={`landing-stage${expanded ? ' is-expanded' : ''}`}>
      <CursorSwarm dismissed={expanded} />

      <motion.button
        type="button"
        className="landing-stage-mark"
        onClick={() => setExpanded(true)}
        initial={false}
        animate={expanded ? 'small' : 'big'}
        variants={{
          big:   { top: '50%', x: '-50%', y: '-50%', scale: 1 },
          small: { top: '8vh', x: '-50%', y: '0%',   scale: 0.42 },
        }}
        transition={reduce ? { duration: 0 } : { duration: 0.7, ease: EASE }}
        aria-label={expanded ? 'JomRetro' : 'Open JomRetro'}
        disabled={expanded}
      >
        <RetroWordmark size="lg" />
      </motion.button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            key="card"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
            transition={reduce ? { duration: 0.2 } : { duration: 0.55, delay: 0.28, ease: EASE }}
            className="landing-stage-card"
          >
            <SignInPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Sign-in panel (Join / Host segmented) ────────────── */

function SignInPanel() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const profile = loadProfile();
  const [mode, setMode] = useState<'join' | 'host'>('join');

  const [joinName, setJoinName] = useState(profile?.name ?? '');
  const [joinCode, setJoinCode] = useState('');
  const [joinNameError, setJoinNameError] = useState<string | null>(null);
  const [joinCodeError, setJoinCodeError] = useState<string | null>(null);
  const [joinSubmitting, setJoinSubmitting] = useState(false);

  const [hostEmail, setHostEmail] = useState('');
  const [hostEmailError, setHostEmailError] = useState<string | null>(null);
  const [hostSubmitting, setHostSubmitting] = useState(false);
  const [hostSentTo, setHostSentTo] = useState<string | null>(null);
  const [hostError, setHostError] = useState<string | null>(null);

  const validateName = (v: string) => v.trim() ? null : 'Please enter your name.';
  const validateCode = (v: string) => {
    const t = v.trim().toUpperCase();
    if (!t) return 'Enter the room code your teammate sent you.';
    if (!/^[A-Z]{3}-\d{4}$/.test(t)) return 'Should look like ABC-1234.';
    return null;
  };
  const validateEmail = (v: string) => {
    const t = v.trim();
    if (!t) return 'Please enter your email.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return "That doesn't look like a valid email.";
    return null;
  };

  const onJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameErr = validateName(joinName);
    const codeErr = validateCode(joinCode);
    setJoinNameError(nameErr);
    setJoinCodeError(codeErr);
    if (nameErr || codeErr) return;
    const trimmedName = joinName.trim();
    const code = joinCode.trim().toUpperCase();
    setJoinSubmitting(true);
    const board = await getBoardByCode(code);
    setJoinSubmitting(false);
    if (!board) {
      setJoinCodeError("We couldn't find a retro with that code. Double-check it with your teammate.");
      return;
    }
    saveProfile({
      name: trimmedName,
      color: profile?.color ?? colorForName(trimmedName),
    });
    navigate(`/r/${code}`);
  };

  const onHostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = validateEmail(hostEmail);
    setHostEmailError(emailErr);
    if (emailErr) return;
    setHostSubmitting(true);
    setHostError(null);
    const { error } = await signIn(hostEmail.trim());
    setHostSubmitting(false);
    if (error) setHostError(error.message);
    else setHostSentTo(hostEmail.trim());
  };

  return (
    <>
      <div role="tablist" aria-label="Landing mode" className="landing-modetabs">
        <ModeTab active={mode === 'join'} onClick={() => setMode('join')}>I'm joining</ModeTab>
        <ModeTab active={mode === 'host'} onClick={() => setMode('host')}>I'm hosting</ModeTab>
      </div>

      {mode === 'join' ? (
        <form className="surface landing-card" noValidate onSubmit={onJoinSubmit}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Hop into a retro</h2>
            <div className="muted tiny" style={{ marginTop: 4 }}>
              Got a code from a teammate? Pop your name in and you're in.
            </div>
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="home-join-name">Your name</label>
            <div className="field-frame" style={joinNameError ? { borderColor: '#c77b58' } : undefined}>
              <input
                id="home-join-name"
                className="field-input"
                placeholder="Casey Lin"
                value={joinName}
                onChange={(e) => { setJoinName(e.target.value); if (joinNameError) setJoinNameError(null); }}
                onBlur={(e) => setJoinNameError(validateName(e.target.value))}
                autoComplete="off"
                aria-invalid={!!joinNameError}
              />
            </div>
            {joinNameError && <div className="tiny" style={{ color: 'var(--color-danger)', marginTop: 4 }}>{joinNameError}</div>}
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="home-join-code">Room code</label>
            <div className="field-frame" style={joinCodeError ? { borderColor: '#c77b58' } : undefined}>
              <input
                id="home-join-code"
                className="field-input mono code-input"
                placeholder="ABC-1234"
                value={joinCode}
                onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); if (joinCodeError) setJoinCodeError(null); }}
                onBlur={(e) => setJoinCodeError(validateCode(e.target.value))}
                autoComplete="off"
                spellCheck="false"
                aria-invalid={!!joinCodeError}
              />
            </div>
            {joinCodeError && <div className="tiny" style={{ color: 'var(--color-danger)', marginTop: 4 }}>{joinCodeError}</div>}
          </div>
          <button
            type="submit"
            className="btn accent lg"
            disabled={joinSubmitting}
          >
            {joinSubmitting ? 'Looking up…' : "Let's go"}
          </button>
          <div className="tiny muted" style={{ textAlign: 'center' }}>
            No account, no signup. Just retro.
          </div>
        </form>
      ) : (
        <div className="surface landing-card">
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Run your own retro</h2>
            <div className="muted tiny" style={{ marginTop: 4 }}>
              Spin up boards, keep them around, come back whenever.
            </div>
          </div>

          {hostSentTo ? (
            <div style={{
              textAlign: 'center',
              padding: '20px 16px',
              background: 'var(--color-surface-2)',
              borderRadius: 12,
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 'var(--radius-pill)', margin: '0 auto 12px',
                background: 'color-mix(in oklch, #16a34a 14%, var(--color-bg))',
                color: '#15803d',
                display: 'grid', placeItems: 'center',
              }}>
                <Icon name="check" size={14} />
              </div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Link's in your inbox</div>
              <div className="muted" style={{ fontSize: 13.5 }}>
                Click the link in <span className="mono">{hostSentTo}</span> to start your retro.
              </div>
              <button
                type="button"
                className="quiet-link"
                style={{ marginTop: 12, fontSize: 12.5 }}
                onClick={() => { setHostSentTo(null); setHostEmail(''); }}
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={onHostSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="field-group">
                <label className="field-label" htmlFor="host-email">Email</label>
                <div className="field-frame" style={hostEmailError ? { borderColor: '#c77b58' } : undefined}>
                  <input
                    id="host-email"
                    type="email"
                    className="field-input"
                    placeholder="you@company.com"
                    value={hostEmail}
                    onChange={(e) => { setHostEmail(e.target.value); if (hostEmailError) setHostEmailError(null); }}
                    onBlur={(e) => setHostEmailError(validateEmail(e.target.value))}
                    autoComplete="email"
                    aria-invalid={!!hostEmailError}
                  />
                </div>
                {hostEmailError && <div className="tiny" style={{ color: 'var(--color-danger)', marginTop: 4 }}>{hostEmailError}</div>}
              </div>
              {hostError && <div className="tiny" style={{ color: 'var(--color-danger)' }}>{hostError}</div>}
              <button
                type="submit"
                className="btn accent lg"
                disabled={hostSubmitting}
              >
                {hostSubmitting ? 'Sending…' : 'Send magic link'}
              </button>
            </form>
          )}

          <div className="tiny muted" style={{ textAlign: 'center' }}>
            Free. We email you a link, no passwords.
          </div>
        </div>
      )}
    </>
  );
}

function ModeTab({ active, onClick, children }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`landing-modetab${active ? ' is-active' : ''}`}
    >
      {children}
    </button>
  );
}

/* ── Cursor swarm ─────────────────────────────────────── */

type Waypoint = { x: number; y: number };
type Persona = {
  name: string;
  color: string;
  seed: Waypoint;
  speed: number;
  delay: number;
};

const PERSONAS: Persona[] = [
  { name: 'Maya',   color: '#3D8B7A', seed: { x: 22, y: 30 }, speed: 3.2, delay: 0 },
  { name: 'Alex',   color: '#C77B58', seed: { x: 76, y: 30 }, speed: 2.6, delay: 600 },
  { name: 'Priya',  color: '#7C6FB0', seed: { x: 28, y: 70 }, speed: 3.8, delay: 1200 },
  { name: 'Jordan', color: '#D4A93C', seed: { x: 72, y: 70 }, speed: 3.0, delay: 400 },
  { name: 'Sam',    color: '#5C8FB8', seed: { x: 50, y: 18 }, speed: 2.4, delay: 1800 },
];

const X_MIN = 8, X_MAX = 92;
const Y_MIN = 12, Y_MAX = 84;
const MAX_STEP = 32;

function nextPos(current: Waypoint): Waypoint {
  const dx = (Math.random() - 0.5) * 2 * MAX_STEP;
  const dy = (Math.random() - 0.5) * 2 * MAX_STEP;
  return {
    x: clamp(current.x + dx, X_MIN, X_MAX),
    y: clamp(current.y + dy, Y_MIN, Y_MAX),
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function CursorSwarm({ dismissed }: { dismissed: boolean }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <div className={`cursor-swarm${dismissed ? ' is-dismissed' : ''}`} aria-hidden="true">
      {PERSONAS.map((p) => <Cursor key={p.name} persona={p} dismissed={dismissed} />)}
    </div>
  );
}

function nearestEdgePos(target: Waypoint): Waypoint {
  // pick the nearest edge to `target` and overshoot it
  const distances: Array<[string, number]> = [
    ['left',   target.x],
    ['right',  100 - target.x],
    ['top',    target.y],
    ['bottom', 100 - target.y],
  ];
  distances.sort((a, b) => a[1] - b[1]);
  const nearest = distances[0][0];
  switch (nearest) {
    case 'left':   return { x: -18, y: target.y };
    case 'right':  return { x: 118, y: target.y };
    case 'top':    return { x: target.x, y: -18 };
    case 'bottom': return { x: target.x, y: 118 };
    default:       return target;
  }
}

function randomEdgePos(seed: Waypoint): Waypoint {
  // pick a random side (not always the nearest) so entries don't look uniform
  const side = ['left', 'right', 'top', 'bottom'][Math.floor(Math.random() * 4)];
  switch (side) {
    case 'left':   return { x: -18, y: seed.y };
    case 'right':  return { x: 118, y: seed.y };
    case 'top':    return { x: seed.x, y: -18 };
    case 'bottom': return { x: seed.x, y: 118 };
    default:       return seed;
  }
}

type Phase = 'pre' | 'entering' | 'wandering' | 'leaving';
const ENTRY_DURATION = 1.1;   // seconds
const EXIT_DURATION = 1.05;

function Cursor({ persona, dismissed }: { persona: Persona; dismissed: boolean }) {
  const [pos, setPos] = useState<Waypoint>(() => randomEdgePos(persona.seed));
  const [phase, setPhase] = useState<Phase>('pre');

  // pre → entering after staggered delay
  useEffect(() => {
    if (phase !== 'pre') return;
    const t = setTimeout(() => {
      setPhase('entering');
      setPos(persona.seed);
    }, persona.delay);
    return () => clearTimeout(t);
  }, [phase, persona]);

  // entering → wandering once the slide-in completes
  useEffect(() => {
    if (phase !== 'entering') return;
    const t = setTimeout(() => setPhase('wandering'), ENTRY_DURATION * 1000);
    return () => clearTimeout(t);
  }, [phase]);

  // wandering loop
  useEffect(() => {
    if (phase !== 'wandering') return;
    const dwell = persona.speed * 1000 + Math.random() * 1200;
    const t = setTimeout(() => setPos((p) => nextPos(p)), dwell);
    return () => clearTimeout(t);
  }, [phase, pos, persona]);

  // dismissal: fly to nearest edge, stay there
  useEffect(() => {
    if (!dismissed || phase === 'leaving') return;
    setPhase('leaving');
    setPos((p) => nearestEdgePos(p));
  }, [dismissed, phase]);

  const duration =
    phase === 'entering' ? ENTRY_DURATION :
    phase === 'leaving'  ? EXIT_DURATION :
    persona.speed;

  return (
    <div
      className="landing-cursor"
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transitionDuration: `${duration}s`,
        transitionTimingFunction:
          phase === 'entering' ? 'cubic-bezier(0.22, 1, 0.36, 1)' :
          phase === 'leaving'  ? 'cubic-bezier(0.32, 0, 0.68, 1)' :
          undefined,
      }}
    >
      <CursorPointer color={persona.color} />
      <span className="landing-cursor-label" style={{ background: persona.color }}>
        {persona.name}
      </span>
    </div>
  );
}

function CursorPointer({ color }: { color: string }) {
  return <CursorArrow color={color} size={20} />;
}
