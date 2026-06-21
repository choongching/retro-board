// Personal, client-side-only celebration when you upvote a card. Nothing here
// is broadcast; only the clicker sees it. Fires on vote-ON only (never un-vote).
// Every vote pairs the floating "+1" with one randomly chosen burst pattern (so
// it stays fresh), and crossing a vote milestone upgrades to a bigger two-stage
// celebration. canvas-confetti renders into a fixed <body> canvas, so the burst
// escapes the rotated, overflow:hidden sticky card without a portal of our own.
import confetti from 'canvas-confetti';
import type { Options } from 'canvas-confetti';
import type { ColumnId } from '../data';

type Origin = { x: number; y: number };

// Column-aware emoji so one of the patterns carries the column's personality.
const COLUMN_EMOJI: Record<ColumnId, string[]> = {
  well: ['✨', '💚', '🌟'],
  improve: ['🔧', '💡', '📈'],
  action: ['✅', '🚀', '⚡'],
  start: ['🚀', '🌱', '✨'],
  stop: ['🛑', '🍂', '✋'],
  cont: ['🔁', '💪', '✨'],
  wind: ['💨', '⛵', '✨'],
  anchor: ['⚓', '🪨', '💤'],
  shark: ['🦈', '🌊', '⚠️'],
  destination: ['🎯', '🏝️', '✨'],
};
const FALLBACK_EMOJI = ['✨', '🎉', '💛'];
const WARM = ['#E0816C', '#3D8B7A', '#D4A93C', '#B85C8A', '#5C8FB8', '#7DA350'];

const MILESTONES = [10, 25, 50];

function originFrom(el: HTMLElement): Origin {
  const r = el.getBoundingClientRect();
  return {
    x: (r.left + r.width / 2) / window.innerWidth,
    y: (r.top + r.height / 2) / window.innerHeight,
  };
}

function emojiShapes(texts: string[]) {
  return texts.map((text) => confetti.shapeFromText({ text, scalar: 2 }));
}

function fire(origin: Origin, opts: Options) {
  confetti({ origin, ticks: 100, disableForReducedMotion: true, ...opts });
}

// ── Burst patterns (each small + quick, so firing one per vote stays tasteful) ──
const PATTERNS: Array<(origin: Origin, col: ColumnId) => void> = [
  // Hearts (Twitter / Instagram canonical)
  (o) => fire(o, { particleCount: 10, spread: 60, startVelocity: 26, gravity: 0.6, scalar: 1.6, ticks: 130, shapes: emojiShapes(['❤️', '💖', '💛']) }),
  // Warm confetti
  (o) => fire(o, { particleCount: 18, spread: 62, startVelocity: 26, scalar: 0.9, colors: WARM }),
  // Gold sparkle stars
  (o) => fire(o, { particleCount: 14, spread: 70, startVelocity: 26, scalar: 1.1, ticks: 110, shapes: ['star'], colors: ['#FFD45C', '#FFB23E', '#FFF1C2'] }),
  // Column-aware emoji
  (o, col) => fire(o, { particleCount: 12, spread: 55, startVelocity: 24, scalar: 1.2, ticks: 90, shapes: emojiShapes(COLUMN_EMOJI[col] ?? FALLBACK_EMOJI) }),
  // Upward fountain
  (o) => fire(o, { particleCount: 16, angle: 90, spread: 32, startVelocity: 34, scalar: 0.95, ticks: 110, colors: WARM }),
  // Emoji pop
  (o) => fire(o, { particleCount: 10, spread: 65, startVelocity: 26, scalar: 1.5, ticks: 120, shapes: emojiShapes(['🎉', '🥳', '👏', '🔥', '💯']) }),
];

// Avoid repeating the pattern we just showed, so variety reads as intentional.
let lastPattern = -1;
function pickPattern() {
  let i = Math.floor(Math.random() * PATTERNS.length);
  if (i === lastPattern) i = (i + 1) % PATTERNS.length;
  lastPattern = i;
  return PATTERNS[i];
}

function burstMilestone(origin: Origin, col: ColumnId) {
  const shapes = emojiShapes(COLUMN_EMOJI[col] ?? FALLBACK_EMOJI);
  fire(origin, { particleCount: 40, spread: 100, startVelocity: 38, scalar: 1.6, ticks: 160, shapes });
  // A second, softer pop a beat later makes the milestone feel richer.
  window.setTimeout(
    () => fire(origin, { particleCount: 24, spread: 120, startVelocity: 24, scalar: 1.3, ticks: 140, shapes }),
    140,
  );
}

// Call on vote-ON. `newCount` is the card's vote total after this vote.
export function celebrateVote(el: HTMLElement, col: ColumnId, newCount: number) {
  const origin = originFrom(el);
  if (MILESTONES.includes(newCount)) burstMilestone(origin, col);
  else pickPattern()(origin, col);
}
