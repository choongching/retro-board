import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FORMATS } from '../data';
import type { Card, ColumnId, FormatId } from '../data';
import { loadProfile } from '../lib/profile';
import { useRetroChannel } from '../lib/useRetroChannel';
import { buildExport, downloadJson } from '../lib/retroExport';
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

  if (!code) return <Navigate to="/" replace />;
  if (!profile) return <Navigate to={`/join/${code}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`} replace />;

  const imported = (location.state as ImportedNavState | null) ?? undefined;

  return <BoardInner code={code} profile={profile} formatParam={searchParams.get('format')} imported={imported} onLeave={() => navigate('/')} onChangeProfile={() => navigate(`/join/${code}`)} />;
}

function BoardInner({
  code, profile, formatParam, imported, onLeave, onChangeProfile,
}: {
  code: string;
  profile: NonNullable<ReturnType<typeof loadProfile>>;
  formatParam: string | null;
  imported?: ImportedNavState;
  onLeave: () => void;
  onChangeProfile: () => void;
}) {
  const initialFormat: FormatId = isFormatId(formatParam) ? formatParam : 'classic';
  const initialState = useMemo(() => ({
    format: initialFormat,
    title: imported?.importedTitle ?? `Retro ${code}`,
    cards: imported?.importedCards ?? [],
  }), [initialFormat, code, imported]);

  const {
    state, users, cursors,
    addCard, editCard, deleteCard, voteCard, moveCard,
    updateSettings, sendCursor,
  } = useRetroChannel(code, profile, initialState);

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

  const handleCopyCode = useCallback(() => {
    navigator.clipboard?.writeText(code).catch(() => {});
    showToast('Copied room code');
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
        onToggleAnon={handleToggleAnon}
        onReveal={handleReveal}
        onExportMarkdown={exportMarkdown}
        onExportJson={exportJsonHandler}
        onLeave={onLeave}
        onCopyCode={handleCopyCode}
        onChangeProfile={onChangeProfile}
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
