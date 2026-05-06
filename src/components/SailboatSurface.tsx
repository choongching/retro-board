import { useState } from 'react';
import { SailboatZone } from './SailboatZone';
import type { SailboatZoneDef } from './SailboatZone';
import type { Participant } from './StickyCard';
import type { Card, ColumnId, Format } from '../data';
import type { Profile } from '../lib/profile';

const ZONE_DEFS: Record<'destination' | 'wind' | 'shark' | 'anchor', SailboatZoneDef> = {
  destination: { label: 'Destination', hint: 'What’s our goal? What are we working towards?', accent: '#D4A93C', glyph: 'destination', corner: 'tl' },
  wind:        { label: 'Wind',        hint: 'What’s moving us forward? What’s helping?', accent: '#3D8B7A', glyph: 'wind',        corner: 'tr' },
  shark:       { label: 'Shark',       hint: 'What are the risks? What should we be cautious of?', accent: '#B85C8A', glyph: 'shark',       corner: 'bl' },
  anchor:      { label: 'Anchor',      hint: 'What’s holding us back? What’s causing delay?', accent: '#C77B58', glyph: 'anchor',      corner: 'br' },
};

function SailboatHeroIllustration() {
  return (
    <svg
      viewBox="0 0 600 600"
      preserveAspectRatio="xMidYMid meet"
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 1,
      }}>
      <defs>
        <linearGradient id="sail-shade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#9aa1ad"/>
          <stop offset="1" stopColor="#6f7785"/>
        </linearGradient>
        <linearGradient id="hull-shade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#7a8290"/>
          <stop offset="1" stopColor="#535b69"/>
        </linearGradient>
      </defs>

      <line x1="300" y1="170" x2="300" y2="350" stroke="#3a3f4a" strokeWidth="3" strokeLinecap="round"/>
      <path d="M302 175 Q 360 220 380 320 L 302 348 Z" fill="url(#sail-shade)" stroke="#3a3f4a" strokeWidth="2.5" strokeLinejoin="round"/>
      <path d="M298 200 Q 252 260 230 340 L 298 348 Z" fill="#b8bdc7" stroke="#3a3f4a" strokeWidth="2.5" strokeLinejoin="round"/>
      <path d="M200 348 L 410 348 Q 400 395 360 405 L 250 405 Q 215 395 200 348 Z"
            fill="url(#hull-shade)" stroke="#2c313b" strokeWidth="2.5" strokeLinejoin="round"/>
      <path d="M210 365 Q 305 380 400 365" stroke="#2c313b" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      <path d="M340 405 Q 360 470 410 510 Q 460 540 470 568"
            stroke="#3a3f4a" strokeWidth="2" strokeLinecap="round" fill="none"
            strokeDasharray="1 4"/>
      <path d="M120 420 Q 200 414 290 420 T 480 422" stroke="#9aa1ad" strokeWidth="1.4" fill="none" opacity="0.5"/>
      <path d="M90 440 Q 200 434 300 440 T 510 442" stroke="#9aa1ad" strokeWidth="1.2" fill="none" opacity="0.4"/>
    </svg>
  );
}

const ZONE_ORDER: ('destination' | 'wind' | 'shark' | 'anchor')[] = ['destination', 'wind', 'shark', 'anchor'];

export function SailboatSurface({
  cards, profile, participants, anonMode, revealed,
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
        padding: '16px 18px 24px',
        background: 'var(--color-bg)',
        position: 'relative',
      }}>
      <div style={{
        position: 'relative',
        maxWidth: 1400, margin: '0 auto',
        background:
          'repeating-linear-gradient(0deg, transparent 0 23px, color-mix(in oklch, var(--color-text) 4%, transparent) 23px 24px),' +
          'repeating-linear-gradient(90deg, transparent 0 23px, color-mix(in oklch, var(--color-text) 4%, transparent) 23px 24px),' +
          'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        minHeight: 'calc(100% - 4px)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        }}>
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'color-mix(in oklch, var(--color-text) 12%, transparent)' }} />
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'color-mix(in oklch, var(--color-text) 12%, transparent)' }} />
        </div>

        <SailboatHeroIllustration />

        <div style={{
          position: 'relative', zIndex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          minHeight: 720,
        }}>
          {ZONE_ORDER.map((zoneId) => (
            <SailboatZone
              key={zoneId} zoneId={zoneId} zone={ZONE_DEFS[zoneId]}
              cards={cards.filter((c) => c.col === zoneId)}
              profile={profile} participants={participants}
              anonMode={anonMode} revealed={revealed}
              dragId={dragId} setDragId={setDragId}
              onAdd={onAdd} onEdit={onEdit} onDelete={onDelete} onVote={onVote} onMove={onMove}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
