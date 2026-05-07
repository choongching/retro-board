import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FORMATS, MOCK_WORKSPACES } from '../data';
import type { FormatId } from '../data';
import { Icon } from '../icons';
import { RetroWordmark } from '../components/RetroWordmark';
import { ProfilePill } from '../components/ProfilePill';
import { AuthPill } from '../components/AuthPill';
import { FormatGlyph } from '../components/FormatGlyph';
import { loadProfile } from '../lib/profile';
import { parseAndValidate, stripAuthorsAndVotes } from '../lib/retroExport';
import { useAuth } from '../lib/auth';
import { bulkInsertCards, createBoard, deleteBoard, getMyBoards } from '../lib/boardsApi';
import type { Board } from '../lib/boardsApi';

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
  const profile = loadProfile();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeWs, setActiveWs] = useState(MOCK_WORKSPACES[0].id);
  const ws = MOCK_WORKSPACES.find((w) => w.id === activeWs)!;

  const onJoin = (codeOrEvent?: string | unknown) => {
    const code = typeof codeOrEvent === 'string' ? codeOrEvent : '';
    navigate(code ? `/join/${code}` : '/join');
  };
  const onCreate = async (_wsId: string, formatId: FormatId = 'classic') => {
    const code = makeCode();
    if (user) {
      await createBoard({
        code,
        title: `Retro ${code}`,
        format: formatId,
        ownerId: user.id,
      });
    }
    if (!profile?.name) {
      navigate(`/join/${code}?format=${formatId}`);
    } else {
      navigate(`/r/${code}?format=${formatId}`);
    }
  };
  const onSetProfile = () => navigate('/join');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [myBoards, setMyBoards] = useState<Board[] | null>(null);

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
      <header className="topbar">
        <div className="brand">
          <RetroWordmark />
          <span className="muted" style={{ marginLeft: 4 }}>·</span>
          <select
            value={activeWs}
            onChange={(e) => setActiveWs(e.target.value)}
            style={{
              border: 0, background: 'transparent', font: 'inherit', color: 'var(--color-text-2)',
              padding: '4px 4px', borderRadius: 6, cursor: 'pointer',
            }}>
            {MOCK_WORKSPACES.map((w) => (
              <option key={w.id} value={w.id}>{w.name} workspace</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AuthPill />
          <ProfilePill profile={profile} onClick={onSetProfile} />
        </div>
      </header>

      <main style={{ flex: 1, overflow: 'auto', padding: '36px 0 60px' }}>
        <div style={{ maxWidth: 920, margin: '0 auto', padding: '0 32px' }}>
          {/* Hero */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <div className="tiny muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                {ws.name} · {ws.members} members
              </div>
              <h1 style={{ margin: 0, fontSize: 30, letterSpacing: '-0.02em', fontWeight: 600 }}>
                Retros
              </h1>
              <div className="muted" style={{ marginTop: 6 }}>Run a quick retrospective with your team. No setup.</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" onClick={onImportClick} title="Start a new retro from a JSON file">
                <Icon name="download" /> Import JSON
              </button>
              <button className="btn" onClick={() => onJoin()}>
                <Icon name="key" /> Join with code
              </button>
              <button className="btn accent" onClick={() => onCreate(ws.id)}>
                <Icon name="plus" /> New retro
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleImportFile}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {importError && (
            <div className="surface" style={{
              marginBottom: 20, padding: '10px 14px',
              background: 'color-mix(in oklch, #C77B58 12%, var(--color-bg))',
              borderColor: 'color-mix(in oklch, #C77B58 28%, var(--color-border))',
            }}>
              <div style={{ fontWeight: 500, fontSize: 13, color: '#9c4326' }}>Import failed</div>
              <div className="tiny muted" style={{ marginTop: 2 }}>{importError}</div>
            </div>
          )}

          {/* Quick start cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 36 }}>
            {Object.values(FORMATS).map((f) => (
              <button
                key={f.id}
                onClick={() => onCreate(ws.id, f.id)}
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

          {/* My boards (signed-in only) */}
          {user ? (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--color-text-2)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
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
            <div className="muted tiny" style={{ marginTop: 18, textAlign: 'center' }}>
              Sign in to save your retros and revisit them later.
            </div>
          )}
        </div>
      </main>
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
