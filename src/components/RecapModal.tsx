import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Icon } from '../icons';
import { FORMATS } from '../data';
import type { Card } from '../data';
import { getMyBoards, getCardsForBoard } from '../lib/boardsApi';
import type { Board } from '../lib/boardsApi';
import { relativeTime } from '../lib/time';

type State =
  | { kind: 'picker' }
  | { kind: 'snapshot'; boardId: string };

type CardsCacheValue = Card[] | 'loading' | 'error';

export function RecapModal({
  open, onClose, ownerId, currentBoardId,
}: {
  open: boolean;
  onClose: () => void;
  ownerId: string;
  currentBoardId: string | null;
}) {
  const reduce = useReducedMotion();
  const [state, setState] = useState<State>({ kind: 'picker' });
  const [boards, setBoards] = useState<Board[] | null>(null);
  const [cardsCache, setCardsCache] = useState<Record<string, CardsCacheValue>>({});

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getMyBoards(ownerId).then((rows) => {
      if (cancelled) return;
      setBoards(rows.filter((b) => b.id !== currentBoardId));
    });
    return () => { cancelled = true; };
  }, [open, ownerId, currentBoardId]);

  useEffect(() => {
    if (!open) setState({ kind: 'picker' });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (state.kind === 'snapshot') setState({ kind: 'picker' });
      else onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, state, onClose]);

  useEffect(() => {
    if (state.kind !== 'snapshot') return;
    if (cardsCache[state.boardId]) return;
    const id = state.boardId;
    setCardsCache((prev) => ({ ...prev, [id]: 'loading' }));
    getCardsForBoard(id)
      .then((cards) => setCardsCache((prev) => ({ ...prev, [id]: cards })))
      .catch(() => setCardsCache((prev) => ({ ...prev, [id]: 'error' })));
  }, [state, cardsCache]);

  const selectedBoard = useMemo(() => {
    if (state.kind !== 'snapshot') return null;
    return boards?.find((b) => b.id === state.boardId) ?? null;
  }, [state, boards]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'grid', placeItems: 'center',
            padding: 24,
          }}
        >
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: 'var(--color-surface)',
              borderRadius: 14,
              boxShadow: 'var(--shadow-lg)',
              width: 'min(1240px, calc(100vw - 48px))',
              maxHeight: 'calc(100vh - 80px)',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <header style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '18px 22px',
              borderBottom: '1px solid var(--color-divider)',
            }}>
              {state.kind === 'snapshot' && (
                <button
                  type="button"
                  className="btn ghost icon"
                  onClick={() => setState({ kind: 'picker' })}
                  title="Back to list"
                  style={{ marginLeft: -6 }}
                >
                  <Icon name="arrow-left" />
                </button>
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                {state.kind === 'picker' ? (
                  <>
                    <div style={{ fontWeight: 600, fontSize: 17, letterSpacing: '-0.005em' }}>
                      Recap a previous session
                    </div>
                    <div className="tiny muted" style={{ marginTop: 2 }}>
                      A read-only snapshot — pick a past retro to review action items and themes
                    </div>
                  </>
                ) : selectedBoard ? (
                  <>
                    <div style={{
                      fontWeight: 600, fontSize: 17, letterSpacing: '-0.005em',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {selectedBoard.title}
                    </div>
                    <div className="tiny muted" style={{ marginTop: 2 }}>
                      {FORMATS[selectedBoard.format].name} · {relativeTime(selectedBoard.last_active_at)}
                    </div>
                  </>
                ) : (
                  <div className="muted">Loading…</div>
                )}
              </div>
              <button
                type="button"
                className="btn ghost icon"
                onClick={onClose}
                title="Close (Esc)"
              >
                <Icon name="x" />
              </button>
            </header>

            <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
              {state.kind === 'picker' ? (
                <PickerView
                  boards={boards}
                  onPick={(boardId) => setState({ kind: 'snapshot', boardId })}
                />
              ) : selectedBoard ? (
                <SnapshotView
                  board={selectedBoard}
                  cards={cardsCache[state.boardId]}
                  onRetry={() => {
                    setCardsCache((prev) => {
                      const next = { ...prev };
                      delete next[state.boardId];
                      return next;
                    });
                  }}
                />
              ) : (
                <div className="muted" style={{ textAlign: 'center', padding: 48 }}>
                  Loading board…
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PickerView({
  boards, onPick,
}: {
  boards: Board[] | null;
  onPick: (boardId: string) => void;
}) {
  if (boards === null) {
    return <div className="muted" style={{ textAlign: 'center', padding: 48 }}>Loading…</div>;
  }
  if (boards.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>No previous retros yet</div>
        <div className="muted" style={{ fontSize: 14 }}>
          Once you've run another retro, it'll show up here for quick reference.
        </div>
      </div>
    );
  }
  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <div className="surface" style={{ padding: 0, overflow: 'hidden' }}>
        {boards.map((b, i) => (
          <button
            key={b.id}
            type="button"
            onClick={() => onPick(b.id)}
            style={{
              width: '100%',
              display: 'grid', gridTemplateColumns: '1fr auto', gap: 18,
              alignItems: 'center',
              padding: '14px 18px', minHeight: 56,
              background: 'transparent', border: 0,
              borderBottom: i === boards.length - 1 ? 0 : '1px solid var(--color-divider)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background .12s',
              color: 'inherit',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{
              fontWeight: 500, fontSize: 15,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {b.title}
            </div>
            <div className="tiny muted" style={{ whiteSpace: 'nowrap' }}>
              {FORMATS[b.format].name} · {relativeTime(b.last_active_at)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function SnapshotView({
  board, cards, onRetry,
}: {
  board: Board;
  cards: CardsCacheValue | undefined;
  onRetry: () => void;
}) {
  if (cards === undefined || cards === 'loading') {
    return <div className="muted" style={{ textAlign: 'center', padding: 48 }}>Loading cards…</div>;
  }
  if (cards === 'error') {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <div className="muted" style={{ marginBottom: 12 }}>Couldn't load this session.</div>
        <button type="button" className="btn" onClick={onRetry}>Try again</button>
      </div>
    );
  }

  const fmt = FORMATS[board.format];
  const isSailboat = board.format === 'sailboat';

  const gridStyle: React.CSSProperties = isSailboat
    ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 16 }
    : { display: 'grid', gridTemplateColumns: `repeat(${fmt.columns.length}, minmax(0, 1fr))`, gap: 16 };

  return (
    <div style={gridStyle}>
      {fmt.columns.map((col) => {
        const inCol = cards
          .filter((c) => c.col === col.id)
          .sort((a, b) => b.votes.length - a.votes.length);
        return (
          <div
            key={col.id}
            className="surface"
            style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}
          >
            <header style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 14px',
              borderBottom: '1px solid var(--color-divider)',
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: col.accent, flexShrink: 0,
              }} />
              <div style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.005em' }}>
                {col.label}
              </div>
              {inCol.length > 0 && (
                <span className="tiny muted" style={{ marginLeft: 'auto' }}>
                  {inCol.length}
                </span>
              )}
            </header>
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {inCol.length === 0 ? (
                <div className="tiny muted" style={{ padding: '8px 4px' }}>Empty</div>
              ) : (
                inCol.map((card, idx) => (
                  <RecapCard key={card.id} card={card} tintIdx={idx} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RecapCard({ card, tintIdx }: { card: Card; tintIdx: number }) {
  const tintVar = `var(--t-${(tintIdx % 8) + 1})`;
  return (
    <div
      style={{
        background: `color-mix(in oklch, ${tintVar} 55%, var(--color-bg))`,
        border: `1px solid color-mix(in oklch, ${tintVar} 28%, var(--color-border))`,
        borderRadius: 8,
        padding: '10px 12px 8px',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}
    >
      <div style={{
        fontSize: 14, lineHeight: 1.45,
        color: 'var(--color-text-2)',
        whiteSpace: 'pre-wrap', wordWrap: 'break-word',
        letterSpacing: '0.01em',
      }}>
        {card.text}
      </div>
      {card.votes.length > 0 && (
        <div style={{
          alignSelf: 'flex-end',
          fontSize: 12, fontVariantNumeric: 'tabular-nums', fontWeight: 500,
          color: 'var(--color-text-muted)',
          background: 'rgba(255,255,255,0.45)',
          padding: '2px 8px', borderRadius: 999,
        }}>
          {card.votes.length}
        </div>
      )}
    </div>
  );
}
