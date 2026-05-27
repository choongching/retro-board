import { useEffect, useRef, useState } from 'react';
import type { Card } from '../data';

const MIN_DURATION_MS = 3 * 60 * 1000;
const MIN_OTHER_PARTICIPANTS = 3;
const MIN_OTHER_CARDS = 5;
const TICK_INTERVAL_MS = 15 * 1000;

export function useIcebreakerTrigger({
  cards,
  participants,
  profileId,
  anonMode,
  revealed,
  myJoinedAt,
  startedAt,
}: {
  cards: Card[];
  participants: Array<{ id: string }>;
  profileId: string;
  anonMode: boolean;
  revealed: boolean;
  myJoinedAt: number | undefined;
  startedAt?: number | null;
}): { shouldOpen: boolean; dismiss: () => void } {
  const [shouldOpen, setShouldOpen] = useState(false);
  const openedRef = useRef(false);
  const dismissedRef = useRef(false);

  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), TICK_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (openedRef.current || dismissedRef.current) return;
    if (!myJoinedAt) return;

    // Clock starts from whichever is later: when I joined, or when the retro started.
    // Keeps the icebreaker from firing for someone who waited in the lobby for a while.
    const clockStart = Math.max(myJoinedAt, startedAt ?? 0);
    const dwellMs = Date.now() - clockStart;
    if (dwellMs < MIN_DURATION_MS) return;

    const otherParticipants = participants.filter((p) => p.id !== profileId).length;
    if (otherParticipants < MIN_OTHER_PARTICIPANTS) return;

    const otherCards = cards.filter((c) => c.authorId !== profileId).length;
    if (otherCards < MIN_OTHER_CARDS) return;

    const myCards = cards.filter((c) => c.authorId === profileId).length;
    if (myCards > 0) return;

    if (anonMode && !revealed) return;

    openedRef.current = true;
    setShouldOpen(true);
  });

  // If the participant posts a card (via any path) while the modal is open, close it.
  useEffect(() => {
    if (!shouldOpen) return;
    const myCards = cards.filter((c) => c.authorId === profileId).length;
    if (myCards > 0) setShouldOpen(false);
  }, [cards, profileId, shouldOpen]);

  const dismiss = () => {
    dismissedRef.current = true;
    openedRef.current = true;
    setShouldOpen(false);
  };

  return { shouldOpen, dismiss };
}
