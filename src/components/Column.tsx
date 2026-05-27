import { useState } from 'react';
import { Icon } from '../icons';
import { StickyCard } from './StickyCard';
import { Composer } from './Composer';
import type { Participant } from './StickyCard';
import type { Card, Column as ColumnDef, ColumnId } from '../data';
import type { Profile } from '../lib/profile';

export function Column({
  col, cards, profile, participants, anonMode, revealed,
  dragId, setDragId,
  onAdd, onEdit, onDelete, onVote, onMove,
}: {
  col: ColumnDef;
  cards: Card[];
  profile: Profile;
  participants: Participant[];
  anonMode: boolean;
  revealed: boolean;
  dragId: string | null;
  setDragId: (id: string | null) => void;
  onAdd: (col: ColumnId, text: string) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onVote: (id: string) => void;
  onMove: (id: string, col: ColumnId, beforeId?: string) => void;
}) {
  // Preserve insertion order (already createdAt-ascending from the DB / patch stream).
  // No vote-based reordering: upvoting shouldn't make a card jump positions.
  const sorted = cards;
  const [hoverEnd, setHoverEnd] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);

  return (
    <section style={{
      display: 'flex', flexDirection: 'column',
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      height: '100%',
      minHeight: 200,
      overflow: 'hidden',
    }}>
      <header style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 8px 10px 14px',
        borderBottom: '1px solid var(--color-divider)',
        background: 'var(--color-surface)',
        flexShrink: 0,
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: col.accent, flexShrink: 0,
        }} />
        <div style={{ fontWeight: 600, fontSize: 17, letterSpacing: '-0.01em' }}>{col.label}</div>
        <div className="tiny muted" style={{ marginLeft: 4 }}>{col.hint}</div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          {cards.length > 0 && (
            <span className="tiny muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {cards.length}
            </span>
          )}
          <button
            type="button"
            className="add-note-btn"
            onClick={() => setComposerOpen(true)}
            disabled={composerOpen}
            title="Add a new note"
            aria-label="Add a new note to this column"
          >
            <Icon name="plus" size={13} />
            <span>Note</span>
          </button>
        </div>
      </header>

      {composerOpen && (
        <div style={{
          padding: 12,
          borderBottom: '1px solid var(--color-divider)',
          background: 'var(--color-surface)',
          flexShrink: 0,
        }}>
          <Composer
            col={col}
            profile={profile}
            onAdd={onAdd}
            onClose={() => setComposerOpen(false)}
          />
        </div>
      )}

      <div
        onDragOver={(e) => {
          if (dragId) { e.preventDefault(); setHoverEnd(true); }
        }}
        onDragLeave={() => setHoverEnd(false)}
        onDrop={(e) => {
          e.preventDefault();
          if (dragId) onMove(dragId, col.id, undefined);
          setHoverEnd(false);
          setDragId(null);
        }}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: 12,
          display: 'flex', flexDirection: 'column', gap: 10,
          background: hoverEnd && dragId ? 'color-mix(in oklch, var(--color-brand) 6%, var(--color-surface))' : 'transparent',
          transition: 'background .12s',
        }}>
        {sorted.length === 0 ? (
          <ColumnEmptyState
            hint={col.hint}
            onAdd={() => setComposerOpen(true)}
            disabled={composerOpen}
          />
        ) : (
          sorted.map((card) => (
            <StickyCard
              key={card.id} card={card}
              profile={profile} participants={participants}
              anonMode={anonMode} revealed={revealed}
              isDragging={dragId === card.id}
              onDragStart={() => setDragId(card.id)}
              onDragEnd={() => setDragId(null)}
              onDropBefore={(beforeId) => { if (dragId) onMove(dragId, col.id, beforeId); }}
              onEdit={onEdit} onDelete={onDelete} onVote={onVote}
            />
          ))
        )}
      </div>
    </section>
  );
}

function ColumnEmptyState({
  hint, onAdd, disabled,
}: {
  hint: string;
  onAdd: () => void;
  disabled: boolean;
}) {
  return (
    <div className="column-empty">
      <svg
        className="column-empty-icon"
        width="40" height="40" viewBox="0 0 40 40"
        fill="none" stroke="currentColor" strokeWidth="1.4"
        strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M9 8 H26 L31 13 V32 H9 Z" />
        <path d="M26 8 V13 H31" />
        <line x1="14" y1="19" x2="24" y2="19" opacity="0.55" />
        <line x1="14" y1="24" x2="20" y2="24" opacity="0.55" />
      </svg>
      <div className="column-empty-title">{hint}</div>
      <p className="column-empty-body">
        Nothing here yet. Be the first to drop one in.
      </p>
      <button
        type="button"
        className="column-empty-cta"
        onClick={onAdd}
        disabled={disabled}
      >
        Drop the first note
      </button>
    </div>
  );
}
