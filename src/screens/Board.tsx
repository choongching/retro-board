import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { toast } from 'sonner';
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
import { CursorPublisher } from '../components/CursorPublisher';
import { RecapModal } from '../components/RecapModal';
import { IcebreakerModal } from '../components/IcebreakerModal';
import { LobbyScreen } from '../components/LobbyScreen';
import { RetroWordmark } from '../components/RetroWordmark';
import { useIcebreakerTrigger } from '../lib/useIcebreakerTrigger';

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

  if (!lookup.board && !imported) {
    return <BoardNotFound code={code} onGoHome={() => navigate('/')} />;
  }

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
    startedAt: dbBoard?.started_at ? new Date(dbBoard.started_at).getTime() : null,
  }), [initialFormat, code, imported, dbBoard, dbCards]);

  useEffect(() => {
    if (!dbBoard) return;
    updateBoardLastActive(dbBoard.id);
    const id = window.setInterval(() => updateBoardLastActive(dbBoard.id), 60_000);
    return () => window.clearInterval(id);
  }, [dbBoard]);

  const { user } = useAuth();
  const isOwner = !dbBoard || dbBoard.owner_id === user?.id;
  const [recapOpen, setRecapOpen] = useState(false);

  const {
    state, users, cursors,
    addCard, editCard, deleteCard, voteCard, moveCard,
    updateSettings, setTimer, sendCursor,
  } = useRetroChannel(code, profile, initialState, dbBoard?.id, isOwner);

  const fmt = FORMATS[state.format];
  const participants = useMemo(() => {
    const seen = new Map<string, { id: string; name: string; color: string; isHost: boolean }>();
    for (const u of users) {
      const prev = seen.get(u.id);
      // Preserve the host flag if any presence entry under this id has it.
      const isHost = u.isHost === true || prev?.isHost === true;
      seen.set(u.id, { id: u.id, name: u.name, color: u.color, isHost });
    }
    return [...seen.values()];
  }, [users]);

  const myJoinedAt = useMemo(() => users.find((u) => u.id === profile.id)?.joinedAt, [users, profile.id]);
  const icebreaker = useIcebreakerTrigger({
    cards: state.cards,
    participants,
    profileId: profile.id,
    anonMode: state.anonMode,
    revealed: state.revealed,
    myJoinedAt,
    startedAt: state.startedAt,
  });

  const reduce = useReducedMotion();
  const handleStart = useCallback(() => {
    updateSettings({ startedAt: Date.now() });
  }, [updateSettings]);

  const showToast = useCallback((msg: string) => { toast(msg); }, []);

  // Card mutations: wrappers preserve the prototype's prop signatures
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
    showToast('Room code copied');
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
        lines.push(`- (${c.votes.length} votes) ${c.text}  _${author}_`);
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

  const fadeTransition = reduce ? { duration: 0 } : { duration: 0.2 };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {state.startedAt == null ? (
        <motion.div
          key="lobby"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={fadeTransition}
        >
          <LobbyScreen
            code={code}
            title={state.title}
            format={state.format}
            participants={participants}
            isOwner={isOwner}
            onStart={handleStart}
            onTitleChange={handleTitleChange}
            onCopyInviteLink={handleCopyInviteLink}
            onLeave={onLeave}
          />
        </motion.div>
      ) : (
        <motion.div
          key="live"
          className="app-shell"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={fadeTransition}
        >
          <BoardTopbar
            code={code}
            title={state.title}
            fmt={fmt}
            profile={profile}
            participants={participants}
            anonMode={state.anonMode}
            revealed={state.revealed}
            isOwner={isOwner}
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
            onOpenRecap={() => setRecapOpen(true)}
            timer={state.timer}
            onTimerChange={setTimer}
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

          <PresenceCursors
            users={users}
            cursors={cursors}
            selfId={profile.id}
          />
          <CursorPublisher sendCursor={sendCursor} />

          {isOwner && user && (
            <RecapModal
              open={recapOpen}
              onClose={() => setRecapOpen(false)}
              ownerId={user.id}
              currentBoardId={dbBoard?.id ?? null}
            />
          )}

          <IcebreakerModal
            open={icebreaker.shouldOpen}
            onClose={icebreaker.dismiss}
            format={state.format}
            onSubmit={(text, col) => {
              addCard({ col, text, authorId: profile.id });
              icebreaker.dismiss();
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function BoardNotFound({ code, onGoHome }: { code: string; onGoHome: () => void }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><RetroWordmark /></div>
      </header>
      <main style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 380 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.015em' }}>
            We couldn't find that retro
          </h1>
          <div className="muted" style={{ marginTop: 8, fontSize: 14 }}>
            No retro exists with the code{' '}
            <span className="mono" style={{ color: 'var(--color-text-2)' }}>{code}</span>.
            It may have been deleted, or the link might be wrong.
          </div>
          <button className="btn accent" style={{ marginTop: 18 }} onClick={onGoHome}>
            Back home
          </button>
        </div>
      </main>
    </div>
  );
}
