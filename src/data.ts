// data.ts — shared mock data, helpers, formats, and presence

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
  votes: string[];
  createdAt: number;
};

export type Retro = {
  id: string;
  code: string;
  title: string;
  format: FormatId;
  date: string;
  status: 'live' | 'closed';
  participants: number;
};

export type Workspace = {
  id: string;
  name: string;
  members: number;
  retros: Retro[];
};

export type Other = { id: string; name: string };

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
    desc: 'Lightweight, action-oriented.',
    columns: [
      { id: 'start', label: 'Start', hint: 'New things to try',     accent: '#3D8B7A' },
      { id: 'stop',  label: 'Stop',  hint: 'Things to leave behind', accent: '#C77B58' },
      { id: 'cont',  label: 'Continue', hint: 'Keep doing this',     accent: '#7C6FB0' },
    ],
  },
  classic: {
    id: 'classic',
    name: 'Went Well / To Improve / Actions',
    desc: 'The standard end-of-sprint retro.',
    columns: [
      { id: 'well',    label: 'Went well',  hint: 'What worked',    accent: '#3D8B7A' },
      { id: 'improve', label: 'To improve', hint: 'What didn’t', accent: '#D4A93C' },
      { id: 'action',  label: 'Action items', hint: 'What we’ll do', accent: '#7C6FB0' },
    ],
  },
  sailboat: {
    id: 'sailboat',
    name: 'Sailboat',
    desc: 'A metaphor for what’s pushing or holding the team.',
    columns: [
      { id: 'wind',        label: 'Wind',        hint: 'What’s moving us forward?',   accent: '#3D8B7A', glyph: 'wind' },
      { id: 'anchor',      label: 'Anchor',      hint: 'What’s holding us back?',     accent: '#C77B58', glyph: 'anchor' },
      { id: 'shark',       label: 'Shark',       hint: 'What are the risks ahead?',        accent: '#B85C8A', glyph: 'shark' },
      { id: 'destination', label: 'Destination', hint: 'What are we working toward?',      accent: '#D4A93C', glyph: 'destination' },
    ],
  },
};

// ── Mock workspaces (decoration only — used by Home) ───
export const MOCK_WORKSPACES: Workspace[] = [
  {
    id: 'ws-orbit',
    name: 'Orbit',
    members: 8,
    retros: [
      { id: 'r-301', code: 'OAK-7421', title: 'Sprint 24 — Onboarding revamp', format: 'classic', date: 'Apr 28', status: 'live', participants: 6 },
      { id: 'r-298', code: 'PNE-3318', title: 'Sprint 23 — Auth migration',     format: 'ssc',     date: 'Apr 14', status: 'closed', participants: 7 },
      { id: 'r-289', code: 'BIR-1107', title: 'Q1 Team retro',                       format: 'sailboat',date: 'Mar 31', status: 'closed', participants: 9 },
      { id: 'r-280', code: 'WIL-9904', title: 'Sprint 22 — Search ranking',     format: 'classic', date: 'Mar 17', status: 'closed', participants: 6 },
    ],
  },
  {
    id: 'ws-meridian',
    name: 'Meridian',
    members: 5,
    retros: [
      { id: 'r-104', code: 'CDR-8821', title: 'Sprint 9 — Billing flow',  format: 'ssc',      date: 'Apr 21', status: 'live', participants: 4 },
      { id: 'r-099', code: 'FIR-2207', title: 'Incident review — 04/12', format: 'sailboat', date: 'Apr 13', status: 'closed', participants: 5 },
    ],
  },
];

// ── Mock other participants (decoration; real presence comes from Supabase) ─
export const MOCK_OTHERS: Other[] = [
  { id: 'u-mara',  name: 'Mara Quinn' },
  { id: 'u-jules', name: 'Jules Park' },
  { id: 'u-rafa',  name: 'Rafa Okafor' },
  { id: 'u-noor',  name: 'Noor Mehta' },
  { id: 'u-theo',  name: 'Theo Lin' },
];

// ── Mock seed cards per format (kept for dev/screenshots; not called at runtime) ─
export function seedCardsFor(formatId: FormatId): Card[] {
  const now = Date.now();
  const t = (mins: number) => now - mins * 60_000;

  if (formatId === 'classic') {
    return [
      { id: 'c1', col: 'well',    text: 'Pairing rotation actually stuck this sprint — fewer review bottlenecks.', authorId: 'u-mara',  votes: ['u-jules','u-theo'], createdAt: t(34) },
      { id: 'c2', col: 'well',    text: 'Demo went smoothly. Stakeholders had specific, useful feedback.',             authorId: 'u-rafa',  votes: ['u-mara'],            createdAt: t(28) },
      { id: 'c3', col: 'well',    text: 'On-call was quiet. Runbook updates from last retro paid off.',                authorId: 'u-noor',  votes: [],                    createdAt: t(22) },
      { id: 'c4', col: 'improve', text: 'Story estimation was way off again on the migration tickets.',                authorId: 'u-jules', votes: ['u-mara','u-rafa','u-noor'], createdAt: t(40) },
      { id: 'c5', col: 'improve', text: 'Standup is creeping past 15min. We’re solving in standup.',              authorId: 'u-theo',  votes: ['u-rafa'],            createdAt: t(31) },
      { id: 'c6', col: 'improve', text: 'Design handoff arrived after dev had already started.',                       authorId: 'u-mara',  votes: ['u-jules'],           createdAt: t(18) },
      { id: 'c7', col: 'action',  text: 'Mara to draft an estimation guide for migration-style work.',                  authorId: 'u-mara',  votes: ['u-rafa'],            createdAt: t(8) },
      { id: 'c8', col: 'action',  text: 'Hard-stop standup at 15min; park items in a thread.',                          authorId: 'u-jules', votes: ['u-theo','u-noor'],   createdAt: t(5) },
    ];
  }
  if (formatId === 'ssc') {
    return [
      { id: 's1', col: 'start', text: 'Writing a one-line goal for each PR.',              authorId: 'u-mara',  votes: ['u-rafa','u-jules'], createdAt: t(38) },
      { id: 's2', col: 'start', text: 'Async standup on Mondays — try for 2 weeks.',  authorId: 'u-noor',  votes: ['u-theo'],           createdAt: t(26) },
      { id: 's3', col: 'stop',  text: 'Reviewing PRs without context; require a Loom or note.', authorId: 'u-jules', votes: ['u-mara','u-rafa'], createdAt: t(20) },
      { id: 's4', col: 'stop',  text: 'Booking 30-min meetings that should be 15.',         authorId: 'u-theo',  votes: ['u-noor'],           createdAt: t(14) },
      { id: 's5', col: 'cont',  text: 'Friday demos. Even small wins.',                      authorId: 'u-rafa',  votes: ['u-mara','u-jules','u-noor'], createdAt: t(10) },
      { id: 's6', col: 'cont',  text: 'Pairing on tricky tickets first thing in the morning.', authorId: 'u-mara', votes: ['u-theo'],          createdAt: t(6) },
    ];
  }
  if (formatId === 'sailboat') {
    return [
      { id: 'b1', col: 'wind',        text: 'Clear product priorities from Casey — less context-switching.', authorId: 'u-mara',  votes: ['u-jules','u-rafa'], createdAt: t(36) },
      { id: 'b2', col: 'wind',        text: 'CI got 4x faster. Real time saved.',                                 authorId: 'u-theo',  votes: ['u-mara','u-noor'],   createdAt: t(28) },
      { id: 'b3', col: 'anchor',      text: 'Two devs blocked waiting on infra access for a week.',               authorId: 'u-jules', votes: ['u-rafa','u-noor','u-theo'], createdAt: t(22) },
      { id: 'b4', col: 'anchor',      text: 'Legacy auth code we keep tiptoeing around.',                          authorId: 'u-rafa',  votes: ['u-mara'],            createdAt: t(15) },
      { id: 'b5', col: 'shark',       text: 'Re-org rumors are pulling focus.',                                    authorId: 'u-noor',  votes: ['u-jules'],           createdAt: t(11) },
      { id: 'b6', col: 'shark',       text: 'New billing vendor switchover lands mid-sprint.',                     authorId: 'u-mara',  votes: ['u-theo'],            createdAt: t(7) },
      { id: 'b7', col: 'destination', text: 'Self-serve onboarding by end of Q2 — no human handholding.',     authorId: 'u-jules', votes: ['u-mara','u-rafa','u-noor','u-theo'], createdAt: t(3) },
    ];
  }
  return [];
}
