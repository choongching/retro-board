import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { FORMATS, colorForName } from '../data';
import type { FormatId } from '../data';
import { Icon } from '../icons';
import { RetroWordmark } from '../components/RetroWordmark';
import { UserMenu } from '../components/UserMenu';
import { FormatGlyph } from '../components/FormatGlyph';
import { loadProfile, saveProfile } from '../lib/profile';
import type { Profile } from '../lib/profile';
import { parseAndValidate, stripAuthorsAndVotes } from '../lib/retroExport';
import { useAuth } from '../lib/auth';
import { bulkInsertCards, createBoard, deleteBoard, getBoardByCode, getMyBoards } from '../lib/boardsApi';
import type { Board } from '../lib/boardsApi';

const landingStagger = {
  hidden: { opacity: 1 },
  show:   { opacity: 1, transition: { staggerChildren: 0.14, delayChildren: 0.1 } },
};
const fadeUpVisible = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};
const wordmarkAppear = {
  hidden: { opacity: 0, y: -10, scale: 0.9 },
  show:   { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};
const fadeUpStill = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.25 } },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function makeCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const part = (n: number) => Array.from({ length: n }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
  const num = () => String(Math.floor(1000 + Math.random() * 9000));
  return `${part(3)}-${num()}`;
}

export function Home() {
  const [profile, setProfile] = useState<Profile | null>(loadProfile());
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const reduceMotion = useReducedMotion();
  const fadeVariant = reduceMotion ? fadeUpStill : fadeUpVisible;

  const onJoin = (codeOrEvent?: string | unknown) => {
    const code = typeof codeOrEvent === 'string' ? codeOrEvent : '';
    navigate(code ? `/join/${code}` : '/join');
  };
  const onCreate = async (formatId: FormatId = 'classic') => {
    if (!user) return;
    const code = makeCode();
    await createBoard({
      code,
      title: `Retro ${code}`,
      format: formatId,
      ownerId: user.id,
    });
    if (!profile?.name) {
      navigate(`/join/${code}?format=${formatId}`);
    } else {
      navigate(`/r/${code}?format=${formatId}`);
    }
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [myBoards, setMyBoards] = useState<Board[] | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState(profile?.name ?? '');
  const [landingMode, setLandingMode] = useState<'join' | 'host'>('join');
  const [hostEmail, setHostEmail] = useState('');
  const [hostSubmitting, setHostSubmitting] = useState(false);
  const [hostSentTo, setHostSentTo] = useState<string | null>(null);
  const [hostError, setHostError] = useState<string | null>(null);

  const [joinNameError, setJoinNameError] = useState<string | null>(null);
  const [joinCodeError, setJoinCodeError] = useState<string | null>(null);
  const [joinSubmitting, setJoinSubmitting] = useState(false);
  const [hostEmailError, setHostEmailError] = useState<string | null>(null);

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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return 'That doesn’t look like a valid email.';
    return null;
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

  useEffect(() => {
    if (!user) { setMyBoards(null); return; }
    let cancelled = false;
    getMyBoards(user.id).then((rows) => {
      if (!cancelled) setMyBoards(rows);
    });
    return () => { cancelled = true; };
  }, [user]);

  const onDeleteBoard = async (board: Board) => {
    const ok = window.confirm(`Delete "${board.title}"? This also removes its cards. This cannot be undone.`);
    if (!ok) return;
    await deleteBoard(board.id);
    setMyBoards((prev) => prev?.filter((b) => b.id !== board.id) ?? prev);
  };

  const onImportClick = () => {
    setImportError(null);
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const text = await file.text();
    const result = parseAndValidate(text);
    if (!result.ok) { setImportError(result.error); return; }
    const newCode = makeCode();
    const cards = stripAuthorsAndVotes(result.data.cards);
    const navState = { importedTitle: result.data.title, importedCards: cards };
    if (user) {
      const board = await createBoard({
        code: newCode,
        title: result.data.title,
        format: result.data.format,
        ownerId: user.id,
      });
      if (board && cards.length) await bulkInsertCards(board.id, cards);
    }
    if (!profile?.name) {
      navigate(`/join/${newCode}?format=${result.data.format}`, { state: navState });
    } else {
      navigate(`/r/${newCode}?format=${result.data.format}`, { state: navState });
    }
  };

  return (
    <div className="app-shell">
      {user && (
        <header className="topbar">
          <div className="brand">
            <RetroWordmark size="sm" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserMenu profile={profile} onProfileChange={setProfile} />
          </div>
        </header>
      )}

      <main style={{ flex: 1, overflow: 'auto', padding: user ? '36px 0 60px' : '80px 0 64px' }}>
        <div style={{ maxWidth: 920, margin: '0 auto', padding: '0 32px' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            style={{ display: 'none' }}
          />

          {user ? (
            <>
              {/* Hero */}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: 30, letterSpacing: '-0.015em', fontWeight: 600 }}>Retros</h1>
                  <div className="muted" style={{ marginTop: 6 }}>
                    Run a quick retrospective with your team. No setup.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn" onClick={onImportClick} title="Start a new retro from a JSON file">
                    <Icon name="download" /> Import JSON
                  </button>
                  <button className="btn" onClick={() => onJoin()}>
                    <Icon name="key" /> Join with code
                  </button>
                  <button className="btn accent" onClick={() => onCreate()}>
                    <Icon name="plus" /> New retro
                  </button>
                </div>
              </div>

              {importError && <ImportErrorCard message={importError} />}

              {/* Quick start cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 36 }}>
                {Object.values(FORMATS).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => onCreate(f.id)}
                    className="surface"
                    style={{
                      textAlign: 'left', padding: 16,
                      cursor: 'pointer', background: 'var(--color-surface)',
                      display: 'flex', flexDirection: 'column', gap: 10,
                      minHeight: 120, transition: 'border-color .12s, transform .08s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-brand-line)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}>
                    <FormatGlyph format={f.id} />
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>{f.name}</div>
                      <div className="tiny muted">{f.desc}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 'auto' }}>
                      {f.columns.map((c) => (
                        <div key={c.id} style={{
                          flex: 1, height: 4, borderRadius: 999,
                          background: c.accent, opacity: 0.5,
                        }} />
                      ))}
                    </div>
                  </button>
                ))}
              </div>

              {/* My boards */}
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--color-text-2)', letterSpacing: '0.025em', textTransform: 'uppercase' }}>
                  My boards
                </h2>
                {myBoards && <span className="tiny muted">{myBoards.length} {myBoards.length === 1 ? 'retro' : 'retros'}</span>}
              </div>
              {myBoards === null ? (
                <div className="muted tiny" style={{ padding: 24, textAlign: 'center' }}>Loading…</div>
              ) : myBoards.length === 0 ? (
                <div className="surface" style={{ padding: 24, textAlign: 'center' }}>
                  <div className="muted">No retros yet — click "New retro" to start one.</div>
                </div>
              ) : (
                <div className="surface" style={{ padding: 0, overflow: 'hidden' }}>
                  {myBoards.map((b, i) => (
                    <MyBoardRow
                      key={b.id}
                      board={b}
                      isLast={i === myBoards.length - 1}
                      onJoin={() => navigate(profile?.name ? `/r/${b.code}` : `/join/${b.code}`)}
                      onDelete={() => onDeleteBoard(b)}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <motion.div initial="hidden" animate="show" variants={landingStagger}>
              {/* Wordmark — appears first, scales in */}
              <motion.div
                variants={reduceMotion ? fadeUpStill : wordmarkAppear}
                style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
                <RetroWordmark size="lg" tooltip="Designed and created by CC, Teo" />
              </motion.div>

              {/* Headline + deck — second */}
              <motion.div variants={fadeVariant} style={{ textAlign: 'center', marginBottom: 36 }}>
                <h1 style={{
                  margin: 0,
                  fontSize: 36,
                  fontWeight: 600,
                  letterSpacing: '-0.025em',
                  lineHeight: 1.08,
                }}>
                  Retros that don't drag.
                </h1>
                <div className="muted" style={{
                  margin: '10px auto 0',
                  fontSize: 16,
                  lineHeight: 1.5,
                  maxWidth: 440,
                }}>
                  Spin up a board, share the link, get to the good stuff.
                </div>
              </motion.div>

              {/* Mode toggle (Join / Host) */}
              <motion.div variants={fadeVariant} style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                <div role="tablist" aria-label="Landing mode" style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  width: 440, maxWidth: '100%',
                  padding: 4, borderRadius: 'var(--radius-pill)',
                  background: 'var(--color-surface-2)',
                }}>
                  <ModeTab active={landingMode === 'join'} onClick={() => setLandingMode('join')}>I'm joining</ModeTab>
                  <ModeTab active={landingMode === 'host'} onClick={() => setLandingMode('host')}>I'm hosting</ModeTab>
                </div>
              </motion.div>

              <motion.div variants={fadeVariant} style={{ display: 'flex', justifyContent: 'center' }}>
                {landingMode === 'join' ? (
                  <form
                    className="surface"
                    noValidate
                    onSubmit={async (e) => {
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
                    }}
                    style={{ width: 440, maxWidth: '100%', padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                      {joinNameError && <div className="tiny" style={{ color: '#9c4326', marginTop: 4 }}>{joinNameError}</div>}
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
                      {joinCodeError && <div className="tiny" style={{ color: '#9c4326', marginTop: 4 }}>{joinCodeError}</div>}
                    </div>
                    <button
                      type="submit"
                      className="btn accent lg"
                      style={{ justifyContent: 'center' }}
                      disabled={joinSubmitting}>
                      {joinSubmitting ? 'Looking up…' : "Let's go"}
                    </button>
                    <div className="tiny muted" style={{ textAlign: 'center' }}>
                      No account, no signup. Just retro.
                    </div>
                  </form>
                ) : (
                  <div className="surface" style={{ width: 440, maxWidth: '100%', padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                        background: 'color-mix(in oklch, var(--color-surface-2) 40%, var(--color-bg))',
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
                          onClick={() => { setHostSentTo(null); setHostEmail(''); }}>
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
                          {hostEmailError && <div className="tiny" style={{ color: '#9c4326', marginTop: 4 }}>{hostEmailError}</div>}
                        </div>
                        {hostError && (
                          <div className="tiny" style={{ color: '#9c4326' }}>{hostError}</div>
                        )}
                        <button
                          type="submit"
                          className="btn accent lg"
                          style={{ justifyContent: 'center' }}
                          disabled={hostSubmitting}>
                          {hostSubmitting ? 'Sending…' : 'Send magic link'}
                        </button>
                      </form>
                    )}

                    <div className="tiny muted" style={{ textAlign: 'center' }}>
                      Free. We email you a link — no passwords.
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
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
      style={{
        flex: 1, height: 36, padding: '0 12px',
        borderRadius: 'var(--radius-pill)', border: 0, cursor: 'pointer',
        fontSize: 13, fontWeight: 500,
        background: active ? 'var(--color-surface)' : 'transparent',
        color: active ? 'var(--color-text)' : 'var(--color-text-muted)',
        boxShadow: active ? 'var(--shadow-sm)' : 'none',
        transition: 'background .15s, color .15s, box-shadow .15s',
      }}>
      {children}
    </button>
  );
}

function ImportErrorCard({ message }: { message: string }) {
  return (
    <div className="surface" style={{
      marginBottom: 20, padding: '10px 14px',
      background: 'color-mix(in oklch, #C77B58 12%, var(--color-bg))',
      borderColor: 'color-mix(in oklch, #C77B58 28%, var(--color-border))',
    }}>
      <div style={{ fontWeight: 500, fontSize: 13, color: '#9c4326' }}>Import failed</div>
      <div className="tiny muted" style={{ marginTop: 2 }}>{message}</div>
    </div>
  );
}

function MyBoardRow({
  board, isLast, onJoin, onDelete,
}: {
  board: Board;
  isLast: boolean;
  onJoin: () => void;
  onDelete: () => void;
}) {
  const fmt = FORMATS[board.format];
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto auto auto',
        gap: 18, alignItems: 'center',
        padding: '14px 18px',
        borderBottom: isLast ? 0 : '1px solid var(--color-divider)',
        background: hovered ? 'var(--color-surface-2)' : 'transparent',
        cursor: 'pointer',
      }}
      onClick={onJoin}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {board.title}
        </div>
        <div className="tiny muted" style={{ marginTop: 3 }}>
          {fmt.name} · {relativeTime(board.last_active_at)}
        </div>
      </div>
      <div className="mono tiny muted">{board.code}</div>
      <button
        type="button"
        className="btn ghost sm"
        title="Delete board"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        style={{ visibility: hovered ? 'visible' : 'hidden', padding: '4px 8px' }}>
        <Icon name="trash" />
      </button>
      <Icon name="chevron-right" color="var(--color-text-subtle)" />
    </div>
  );
}
