// Export / import retro state as JSON.
// Author IDs are stripped on import; they're meaningless in a new room.
// Votes are also stripped to avoid orphaned vote IDs.

import type { Card, FormatId } from '../data';

const SCHEMA_VERSION = 1 as const;
const FORMAT_IDS: ReadonlyArray<FormatId> = ['classic', 'ssc', 'sailboat'];

export type RetroExport = {
  schemaVersion: typeof SCHEMA_VERSION;
  code: string;
  title: string;
  format: FormatId;
  cards: Card[];
  exportedAt: number;
  exportedBy: string;
};

export function buildExport(args: {
  code: string;
  title: string;
  format: FormatId;
  cards: Card[];
  exportedBy: string;
}): RetroExport {
  return {
    schemaVersion: SCHEMA_VERSION,
    code: args.code,
    title: args.title,
    format: args.format,
    cards: args.cards,
    exportedAt: Date.now(),
    exportedBy: args.exportedBy,
  };
}

export function downloadJson(data: RetroExport, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

type ParseResult =
  | { ok: true; data: RetroExport }
  | { ok: false; error: string };

export function parseAndValidate(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'File is not valid JSON.' };
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Expected a JSON object at the top level.' };
  }
  const d = raw as Record<string, unknown>;

  if (d.schemaVersion !== SCHEMA_VERSION) {
    return { ok: false, error: `Unsupported schema version: ${String(d.schemaVersion)}.` };
  }
  if (typeof d.title !== 'string') return { ok: false, error: 'Missing or invalid "title".' };
  if (typeof d.code !== 'string') return { ok: false, error: 'Missing or invalid "code".' };
  if (typeof d.format !== 'string' || !FORMAT_IDS.includes(d.format as FormatId)) {
    return { ok: false, error: `"format" must be one of: ${FORMAT_IDS.join(', ')}.` };
  }
  if (!Array.isArray(d.cards)) return { ok: false, error: 'Missing or invalid "cards" array.' };

  const cards: Card[] = [];
  for (let i = 0; i < d.cards.length; i++) {
    const c = d.cards[i];
    if (!c || typeof c !== 'object') return { ok: false, error: `cards[${i}] is not an object.` };
    const cc = c as Record<string, unknown>;
    if (typeof cc.id !== 'string') return { ok: false, error: `cards[${i}].id missing.` };
    if (typeof cc.text !== 'string') return { ok: false, error: `cards[${i}].text missing.` };
    if (typeof cc.col !== 'string') return { ok: false, error: `cards[${i}].col missing.` };
    cards.push({
      id: cc.id,
      text: cc.text,
      col: cc.col as Card['col'],
      authorId: typeof cc.authorId === 'string' ? cc.authorId : '',
      votes: Array.isArray(cc.votes) ? cc.votes.filter((v): v is string => typeof v === 'string') : [],
      createdAt: typeof cc.createdAt === 'number' ? cc.createdAt : Date.now(),
    });
  }

  return {
    ok: true,
    data: {
      schemaVersion: SCHEMA_VERSION,
      code: d.code,
      title: d.title,
      format: d.format as FormatId,
      cards,
      exportedAt: typeof d.exportedAt === 'number' ? d.exportedAt : Date.now(),
      exportedBy: typeof d.exportedBy === 'string' ? d.exportedBy : 'unknown',
    },
  };
}

// Anonymize on import: author IDs and votes belong to the source room.
// Cards keep their text/col so the structure is reproducible.
export function stripAuthorsAndVotes(cards: Card[]): Card[] {
  return cards.map((c) => ({
    ...c,
    id: crypto.randomUUID(),
    authorId: '',
    votes: [],
  }));
}
