// data.ts: shared types, formats, and color helpers

export type FormatId = 'classic' | 'ssc' | 'sailboat';
export type ColumnId =
  | 'well' | 'improve' | 'action'
  | 'start' | 'stop' | 'cont'
  | 'wind' | 'anchor' | 'shark' | 'destination';

export type Column = {
  id: ColumnId;
  label: string;
  hint: string;
  accent: string;
  glyph?: string;
};

export type Format = {
  id: FormatId;
  name: string;
  desc: string;
  columns: Column[];
};

export type Card = {
  id: string;
  col: ColumnId;
  text: string;
  authorId: string;
  // Author display name snapshotted at creation time, so the card keeps its
  // author after that person leaves (presence is ephemeral; this is not).
  authorName?: string;
  votes: string[];
  createdAt: number;
};

export const PALETTE: string[] = [
  '#E0816C', // terracotta
  '#3D8B7A', // teal
  '#C77B58', // rust
  '#7C6FB0', // periwinkle
  '#D4A93C', // mustard
  '#B85C8A', // rose
  '#5C8FB8', // sky
  '#7DA350', // moss
];

export const STICKY_TINT_VARS: string[] = ['--t-1','--t-2','--t-3','--t-4','--t-5','--t-6','--t-7','--t-8'];

export function colorForName(name: string): string {
  if (!name) return PALETTE[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
export function tintForName(name: string): string {
  if (!name) return STICKY_TINT_VARS[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return STICKY_TINT_VARS[h % STICKY_TINT_VARS.length];
}
export function initials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ── Retro formats ──────────────────────────────────────
export const FORMATS: Record<FormatId, Format> = {
  ssc: {
    id: 'ssc',
    name: 'Start / Stop / Continue',
    desc: 'Decisive and lightweight. What to start, stop, or keep going.',
    columns: [
      { id: 'start', label: 'Start', hint: 'Experiments worth trying',     accent: '#3D8B7A' },
      { id: 'stop',  label: 'Stop',  hint: 'Habits no longer serving us',  accent: '#C77B58' },
      { id: 'cont',  label: 'Continue', hint: 'Worth doubling down on',    accent: '#7C6FB0' },
    ],
  },
  classic: {
    id: 'classic',
    name: 'Went Well / To Improve / Action Items',
    desc: 'Celebrate wins, surface friction, commit to next steps.',
    columns: [
      { id: 'well',    label: 'Went well',    hint: 'What energized us',     accent: '#3D8B7A' },
      { id: 'improve', label: 'To improve',   hint: 'What slowed us down',   accent: '#D4A93C' },
      { id: 'action',  label: 'Action items', hint: 'What we’ll commit to',  accent: '#7C6FB0' },
    ],
  },
  sailboat: {
    id: 'sailboat',
    name: 'Sailboat',
    desc: 'Visual metaphor. What’s moving you, slowing you, and where you’re sailing.',
    columns: [
      { id: 'wind',        label: 'Wind',        hint: 'What’s giving us momentum', accent: '#3D8B7A', glyph: 'wind' },
      { id: 'anchor',      label: 'Anchor',      hint: 'What’s weighing us down',   accent: '#C77B58', glyph: 'anchor' },
      { id: 'shark',       label: 'Shark',       hint: 'Risks on the horizon',      accent: '#B85C8A', glyph: 'shark' },
      { id: 'destination', label: 'Destination', hint: 'Where we’re headed',        accent: '#D4A93C', glyph: 'destination' },
    ],
  },
};

