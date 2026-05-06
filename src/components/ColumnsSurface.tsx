import { useState } from 'react';
import { Column } from './Column';
import type { Participant } from './StickyCard';
import type { Card, ColumnId, Format } from '../data';
import type { Profile } from '../lib/profile';

export function ColumnsSurface({
  fmt, cards, profile, participants, anonMode, revealed,
  onAdd, onEdit, onDelete, onVote, onMove,
}: {
  fmt: Format;
  cards: Card[];
  profile: Profile;
  participants: Participant[];
  anonMode: boolean;
  revealed: boolean;
  onAdd: (col: ColumnId, text: string) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onVote: (id: string) => void;
  onMove: (id: string, col: ColumnId, beforeId?: string) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);

  return (
    <main
      data-board-surface
      style={{
        flex: 1, overflow: 'auto',
        padding: '20px 22px 32px',
        background: 'var(--color-bg)',
        position: 'relative',
      }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${fmt.columns.length}, minmax(0, 1fr))`,
        gap: 16,
        maxWidth: 1400, margin: '0 auto',
        minHeight: '100%',
      }}>
        {fmt.columns.map((col) => (
          <Column
            key={col.id} col={col}
            cards={cards.filter((c) => c.col === col.id)}
            profile={profile}
            participants={participants}
            anonMode={anonMode} revealed={revealed}
            dragId={dragId} setDragId={setDragId}
            onAdd={onAdd} onEdit={onEdit} onDelete={onDelete} onVote={onVote} onMove={onMove}
          />
        ))}
      </div>
    </main>
  );
}
