import { useState } from 'react';
import { StickyCard } from './StickyCard';
import { Composer } from './Composer';
import type { Participant } from './StickyCard';
import type { Card, ColumnId } from '../data';
import type { Profile } from '../lib/profile';

type Corner = 'tl' | 'tr' | 'bl' | 'br';
export type SailboatZoneDef = {
  label: string;
  hint: string;
  accent: string;
  glyph: 'wind' | 'anchor' | 'shark' | 'destination';
  corner: Corner;
};

function ZoneGlyph({ kind, color }: { kind: SailboatZoneDef['glyph']; color: string }) {
  const props = {
    width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
    style: { flexShrink: 0, marginTop: 2 },
  };
  if (kind === 'wind') return (
    <svg {...props}><path d="M3 8h12a3 3 0 100-6"/><path d="M3 14h16a3 3 0 110 6"/><path d="M3 11h7"/></svg>
  );
  if (kind === 'anchor') return (
    <svg {...props}><circle cx="12" cy="5" r="2"/><line x1="12" y1="7" x2="12" y2="22"/><path d="M5 16a7 7 0 0014 0"/><line x1="8" y1="10" x2="16" y2="10"/></svg>
  );
  if (kind === 'shark') return (
    <svg {...props}>
      <path d="M4 17 Q 10 5 14 17 Z"/>
      <path d="M2 20h20" strokeDasharray="2 2"/>
    </svg>
  );
  if (kind === 'destination') return (
    <svg {...props}>
      <path d="M6 20 Q 12 16 18 20"/>
      <line x1="12" y1="20" x2="12" y2="6"/>
      <path d="M12 6 L20 9 L12 12 Z"/>
    </svg>
  );
  return null;
}

export function SailboatZone({
  zoneId, zone, cards, profile, participants, anonMode, revealed,
  dragId, setDragId,
  onAdd, onEdit, onDelete, onVote, onMove,
}: {
  zoneId: ColumnId;
  zone: SailboatZoneDef;
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
  const [hover, setHover] = useState(false);
  const corner = zone.corner;

  const headerStyle: React.CSSProperties = {
    position: 'absolute', zIndex: 3,
    display: 'flex', alignItems: 'flex-start', gap: 10,
  };
  if (corner === 'tl') Object.assign(headerStyle, { top: 18, left: 20 });
  if (corner === 'tr') Object.assign(headerStyle, { top: 18, right: 20, textAlign: 'right', flexDirection: 'row-reverse' });
  if (corner === 'bl') Object.assign(headerStyle, { bottom: 18, left: 20 });
  if (corner === 'br') Object.assign(headerStyle, { bottom: 18, right: 20, textAlign: 'right', flexDirection: 'row-reverse' });

  const cardsContainerStyle: React.CSSProperties = {
    position: 'absolute', zIndex: 2,
    display: 'flex', flexDirection: 'column', gap: 8,
    width: 'calc(50% + 8px)', maxWidth: 280, padding: 4,
  };
  if (corner === 'tl') Object.assign(cardsContainerStyle, { top: 64, left: 20 });
  if (corner === 'tr') Object.assign(cardsContainerStyle, { top: 64, right: 20 });
  if (corner === 'bl') Object.assign(cardsContainerStyle, { bottom: 64, left: 20 });
  if (corner === 'br') Object.assign(cardsContainerStyle, { bottom: 64, right: 20 });

  return (
    <section
      onDragOver={(e) => { if (dragId) { e.preventDefault(); setHover(true); } }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault();
        if (dragId) onMove(dragId, zoneId, undefined);
        setHover(false); setDragId(null);
      }}
      style={{
        position: 'relative',
        minHeight: 360,
        background: hover && dragId
          ? 'color-mix(in oklch, var(--color-brand) 6%, transparent)'
          : 'transparent',
        transition: 'background .12s',
      }}>
      <div style={headerStyle}>
        <ZoneGlyph kind={zone.glyph} color={zone.accent} />
        <div style={{ textAlign: corner === 'tr' || corner === 'br' ? 'right' : 'left' }}>
          <div style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.005em' }}>{zone.label}</div>
          {cards.length === 0 && (
            <div className="tiny muted" style={{ marginTop: 2, maxWidth: 220 }}>{zone.hint}</div>
          )}
        </div>
      </div>

      <div style={cardsContainerStyle}>
        {sorted.map((card) => (
          <StickyCard
            key={card.id} card={card}
            profile={profile} participants={participants}
            anonMode={anonMode} revealed={revealed}
            isDragging={dragId === card.id}
            onDragStart={() => setDragId(card.id)}
            onDragEnd={() => setDragId(null)}
            onDropBefore={(beforeId) => { if (dragId) onMove(dragId, zoneId, beforeId); }}
            onEdit={onEdit} onDelete={onDelete} onVote={onVote}
          />
        ))}
        <Composer col={{ id: zoneId, accent: zone.accent }} profile={profile} onAdd={onAdd} />
      </div>
    </section>
  );
}
