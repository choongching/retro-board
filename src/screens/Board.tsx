import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FORMATS } from '../data';
import type { Card, ColumnId, FormatId } from '../data';
import { loadProfile } from '../lib/profile';
import type { Profile } from '../lib/profile';
import { useAuth } from '../lib/auth';
import { useRetroChannel } from '../lib/useRetroChannel';
import { buildExport, downloadJson } from '../lib/retroExport';
import { getBoardByCode, getCardsForBoard, updateBoardLastActive } from '../lib/boardsApi';
import type { Board as DbBoard } from '../lib/boardsApi';
import { BoardTopbar } from '../components/BoardTopbar';
import { BoardSurface } from '../components/BoardSurface';
import { PresenceCursors } from '../components/PresenceCursors';

type ImportedNavState = { importedTitle?: string; importedCards?: Card[] };

function isFormatId(v: string | null): v is FormatId {
  return v === 'classic' || v === 'ssc' || v === 'sailboat';
}

export function Board() {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const profile = loadProfile();
  const [lookup, setLookup] = useState<
    | { status: 'loading' }
    | { status: 'resolved'; board: DbBoard | null; cards: Card[] }
  >({ status: 'loading' });

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    (async () => {
      const board = await getBoardByCode(code);
      const cards = board ? await getCardsForBoard(board.id) : [];
      if (!cancelled) setLookup({ status: 'resolved', board, cards });
    })();
    return () => { cancelled = true; };
  }, [code]);

  if (!code) return <Navigate to="/" replace />;
  if (!profile) return <Navigate to={`/join/${code}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`} replace />;
  if (lookup.status === 'loading') return null;

  const imported = (location.state as ImportedNavState | null) ?? undefined;

  return (
    <BoardInner
      code={code}
      profile={profile}
      formatParam={searchParams.get('format')}
      imported={imported}
      dbBoard={lookup.board}
      dbCards={lookup.cards}
      onLeave={() => navigate('/')}
      onChangeProfile={() => navigate(`/join/${code}`)}
    />
  );
}

function BoardInner({
  code, profile: initialProfile, formatParam, imported, dbBoard, dbCards, onLeave, onChangeProfile,
}: {
  code: string;
  profile: NonNullable<ReturnType<typeof loadProfile>>;
  formatParam: string | null;
  imported?: ImportedNavState;
  dbBoard: DbBoard | null;
  dbCards: Card[];
  onLeave: () => void;
  onChangeProfile: () => void;
}) {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const initialFormat: FormatId = dbBoard?.format ?? (isFormatId(formatParam) ? formatParam : 'classic');
  const initialState = useMemo(() => ({
    format: initialFormat,
    title: dbBoard?.title ?? imported?.importedTitle ?? `Retro ${code}`,
    cards: dbBoard ? dbCards : (imported?.importedCards ?? []),
  }), [initialFormat, code, imported, dbBoard, dbCards]);

  useEffect(() => {
    if (!dbBoard) return;
    updateBoardLastActive(dbBoard.id);
    const id = window.setInterval(() => updateBoardLastActive(dbBoard.id), 60_000);
    return () => window.clearInterval(id);
  }, [dbBoard]);

  const { user } = useAuth();
  const canEditTitle = !dbBoard || dbBoard.owner_id === user?.id;

  const {
    state, users, cursors,
    addCard, editCard, deleteCard, voteCard, moveCard,
    updateSettings, sendCursor,
  } = useRetroChannel(code, profile, initialState, dbBoard?.id);

  const fmt = FORMATS[state.format];
  const participants = useMemo(() => {
    const seen = new Map<string, { id: string; name: string; color: string }>();
    for (const u of users) {
      if (!seen.has(u.id)) seen.set(u.id, { id: u.id, name: u.name, color: u.color });
    }
    return [...seen.values()];
  }, [users]);

  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 1800);
  }, []);

  // Card mutations — wrappers preserve the prototype's prop signatures
  const handleAdd = useCallback((col: ColumnId, text: string) => {
    if (!text.trim()) return;
    addCard({ col, text: text.trim(), authorId: profile.id });
  }, [addCard, profile.id]);

  const handleVote = useCallback((id: string) => voteCard(id, profile.id), [voteCard, profile.id]);

  const handleToggleAnon = useCallback(() => {
    updateSettings({ anonMode: !state.anonMode, revealed: state.anonMode ? state.revealed : false });
  }, [updateSettings, state.anonMode, state.revealed]);

  const handleReveal = useCallback(() => {
    updateSettings({ revealed: true });
    showToast('Cards revealed');
  }, [updateSettings, showToast]);

  const handleTitleChange = useCallback((next: string) => {
    const trimmed = next.trim();
    if (!trimmed || trimmed === state.title) return;
    updateSettings({ title: trimmed });
  }, [updateSettings, state.title]);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard?.writeText(code).catch(() => {});
    showToast('Copied room code');
  }, [code, showToast]);

  const handleCopyInviteLink = useCallback(() => {
    const url = `${window.location.origin}/join/${code}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    showToast('Invite link copied');
  }, [code, showToast]);

  const exportMarkdown = useCallback(() => {
    const lines: string[] = [];
    lines.push(`# ${state.title}`);
    lines.push(`Code: ${code} · ${fmt.name} · ${new Date().toLocaleDateString()}`);
    lines.push('');
    fmt.columns.forEach((col) => {
      const inCol = state.cards
        .filter((c) => c.col === col.id)
        .sort((a, b) => b.votes.length - a.votes.length);
      lines.push(`## ${col.label}`);
      if (inCol.length === 0) lines.push('_(empty)_');
      inCol.forEach((c) => {
        const author = participants.find((p) => p.id === c.authorId)?.name || 'Anonymous';
        lines.push(`- (${c.votes.length} votes) ${c.text}  — _${author}_`);
      });
      lines.push('');
    });
    const md = lines.join('\n');
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${code}-retro.md`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    showToast('Exported as Markdown');
  }, [state.title, state.cards, code, fmt, participants, showToast]);

  const exportJsonHandler = useCallback(() => {
    const data = buildExport({
      code,
      title: state.title,
      format: state.format,
      cards: state.cards,
      exportedBy: profile.name,
    });
    downloadJson(data, `${code}-retro.json`);
    showToast('Exported as JSON');
  }, [code, state.title, state.format, state.cards, profile.name, showToast]);

  // Cursor publishing — throttled to ~10 Hz; suppressed while typing in a textarea
  const surfaceRef = useRef<HTMLElement | null>(null);
  const lastSentRef = useRef(0);
  const pendingRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const surface = document.querySelector<HTMLElement>('[data-board-surface]');
    surfaceRef.current = surface;
    if (!surface) return;

    const flush = () => {
      rafRef.current = null;
      const p = pendingRef.current;
      if (!p) return;
      const now = Date.now();
      if (now - lastSentRef.current < 100) {
        rafRef.current = requestAnimationFrame(flush);
        return;
      }
      lastSentRef.current = now;
      pendingRef.current = null;
      sendCursor(p.x, p.y);
    };

    const handler = (e: MouseEvent) => {
      if (document.activeElement?.tagName === 'TEXTAREA') return;
      const rect = surface.getBoundingClientRect();
      pendingRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(flush);
    };

    surface.addEventListener('mousemove', handler);
    return () => {
      surface.removeEventListener('mousemove', handler);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [sendCursor, state.format]);

  return (
    <div className="app-shell">
      <BoardTopbar
        code={code}
        title={state.title}
        fmt={fmt}
        profile={profile}
        participants={participants}
        anonMode={state.anonMode}
        revealed={state.revealed}
        canEditTitle={canEditTitle}
        onTitleChange={handleTitleChange}
        onToggleAnon={handleToggleAnon}
        onReveal={handleReveal}
        onExportMarkdown={exportMarkdown}
        onExportJson={exportJsonHandler}
        onLeave={onLeave}
        onCopyCode={handleCopyCode}
        onCopyInviteLink={handleCopyInviteLink}
        onChangeProfile={onChangeProfile}
        onProfileChange={setProfile}
      />

      <BoardSurface
        fmt={fmt}
        cards={state.cards}
        profile={profile}
        participants={participants}
        anonMode={state.anonMode}
        revealed={state.revealed}
        onAdd={handleAdd}
        onEdit={editCard}
        onDelete={deleteCard}
        onVote={handleVote}
        onMove={moveCard}
      />

      <PresenceCursors users={users} cursors={cursors} selfId={profile.id} />

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
