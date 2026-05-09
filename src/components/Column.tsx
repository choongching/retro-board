import { useState } from 'react';
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
  const sorted = [...cards].sort((a, b) => (b.votes.length - a.votes.length) || (a.createdAt - b.createdAt));
  const [hoverEnd, setHoverEnd] = useState(false);

  return (
    <section style={{
      display: 'flex', flexDirection: 'column',
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      minHeight: 200,
      overflow: 'hidden',
    }}>
      <header style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 14px',
        borderBottom: '1px solid var(--color-divider)',
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: col.accent, flexShrink: 0,
        }} />
        <div style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.005em' }}>{col.label}</div>
        {cards.length === 0 && (
          <div className="tiny muted" style={{ marginLeft: 4 }}>{col.hint}</div>
        )}
      </header>

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
          padding: 12,
          display: 'flex', flexDirection: 'column', gap: 10,
          background: hoverEnd && dragId ? 'color-mix(in oklch, var(--color-brand) 6%, var(--color-surface))' : 'transparent',
          transition: 'background .12s',
          minHeight: 60,
        }}>
        {sorted.map((card) => (
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
        ))}
        <Composer col={col} profile={profile} onAdd={onAdd} />
      </div>
    </section>
  );
}
