import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Card, ColumnId, FormatId } from '../data';
import type { Profile } from './profile';

export type Timer = { running: boolean; endsAt: number | null };

export type RoomState = {
  format: FormatId;
  title: string;
  cards: Card[];
  anonMode: boolean;
  revealed: boolean;
  timer: Timer;
};

export type User = {
  id: string;
  name: string;
  color: string;
  joinedAt: number;
  cursor?: { x: number; y: number };
};

type CardMovePatch = { kind: 'card:move'; id: string; col: ColumnId; beforeId?: string };
type Patch =
  | { kind: 'card:add'; card: Card }
  | { kind: 'card:edit'; id: string; text: string }
  | { kind: 'card:delete'; id: string }
  | { kind: 'card:vote'; id: string; userId: string }
  | CardMovePatch
  | { kind: 'settings'; patch: Partial<RoomState> }
  | { kind: 'timer'; timer: Timer };

const EMPTY: RoomState = {
  format: 'classic',
  title: 'Untitled retro',
  cards: [],
  anonMode: false,
  revealed: true,
  timer: { running: false, endsAt: null },
};

export function useRetroChannel(
  roomCode: string,
  profile: Profile,
  initialState?: Partial<RoomState>,
) {
  const [state, setState] = useState<RoomState>({ ...EMPTY, ...initialState });
  const [users, setUsers] = useState<User[]>([]);
  const [cursors, setCursors] = useState<Map<string, { x: number; y: number }>>(new Map());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const stateRef = useRef<RoomState>(state);
  stateRef.current = state;

  useEffect(() => {
    const channel = supabase.channel(`retro:${roomCode}`, {
      config: { presence: { key: profile.id } },
    });
    channelRef.current = channel;

    // ---- Presence (who's here) ----
    channel.on('presence', { event: 'sync' }, () => {
      const presence = channel.presenceState<User>();
      // Dedupe by id (StrictMode + reconnects can leave stale entries under the same key)
      const seen = new Map<string, User>();
      for (const entry of Object.values(presence).flat() as User[]) {
        const prev = seen.get(entry.id);
        if (!prev || entry.joinedAt < prev.joinedAt) seen.set(entry.id, entry);
      }
      const list = [...seen.values()].sort((a, b) => a.joinedAt - b.joinedAt);
      setUsers(list);
    });

    // ---- Cursor broadcast (separate from presence to keep payload tiny) ----
    channel.on('broadcast', { event: 'cursor:move' }, ({ payload }) => {
      const { id, x, y } = payload as { id: string; x: number; y: number };
      if (id === profile.id) return;
      setCursors((prev) => {
        const next = new Map(prev);
        next.set(id, { x, y });
        return next;
      });
    });

    // When someone new joins, the oldest connected user replies with state.
    // This is how late joiners get current cards (Broadcast itself is ephemeral).
    channel.on('presence', { event: 'join' }, ({ key }) => {
      if (key === profile.id) return;
      const all = (Object.values(channel.presenceState<User>()).flat() as User[]).slice();
      all.sort((a, b) => a.joinedAt - b.joinedAt);
      if (all[0]?.id === profile.id) {
        channel.send({
          type: 'broadcast',
          event: 'state:sync',
          payload: { to: key, state: stateRef.current },
        });
      }
    });

    // ---- Broadcast (state changes) ----
    channel.on('broadcast', { event: 'state:sync' }, ({ payload }) => {
      if (payload.to === profile.id) setState(payload.state as RoomState);
    });

    channel.on('broadcast', { event: 'state:patch' }, ({ payload }) => {
      setState((prev) => applyPatch(prev, payload as Patch));
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          id: profile.id,
          name: profile.name,
          color: profile.color,
          joinedAt: Date.now(),
        });
      }
    });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [roomCode, profile.id, profile.name, profile.color]);

  // Helper: send a patch AND apply it locally (optimistic).
  const sendPatch = useCallback((patch: Patch) => {
    setState((prev) => applyPatch(prev, patch));
    channelRef.current?.send({
      type: 'broadcast',
      event: 'state:patch',
      payload: patch,
    });
  }, []);

  const addCard = useCallback(
    (card: Omit<Card, 'id' | 'votes' | 'createdAt'>) =>
      sendPatch({
        kind: 'card:add',
        card: { ...card, id: crypto.randomUUID(), votes: [], createdAt: Date.now() },
      }),
    [sendPatch],
  );
  const editCard = useCallback(
    (id: string, text: string) => sendPatch({ kind: 'card:edit', id, text }),
    [sendPatch],
  );
  const deleteCard = useCallback(
    (id: string) => sendPatch({ kind: 'card:delete', id }),
    [sendPatch],
  );
  const voteCard = useCallback(
    (id: string, userId: string) => sendPatch({ kind: 'card:vote', id, userId }),
    [sendPatch],
  );
  const moveCard = useCallback(
    (id: string, col: ColumnId, beforeId?: string) =>
      sendPatch({ kind: 'card:move', id, col, beforeId }),
    [sendPatch],
  );
  const updateSettings = useCallback(
    (patch: Partial<RoomState>) => sendPatch({ kind: 'settings', patch }),
    [sendPatch],
  );
  const setTimer = useCallback(
    (timer: Timer) => sendPatch({ kind: 'timer', timer }),
    [sendPatch],
  );

  // Cursor broadcast — ephemeral; never re-track() (which accumulates presence entries).
  const sendCursor = useCallback(
    (x: number, y: number) => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'cursor:move',
        payload: { id: profile.id, x, y },
      });
    },
    [profile.id],
  );

  return {
    state,
    users,
    cursors,
    addCard,
    editCard,
    deleteCard,
    voteCard,
    moveCard,
    updateSettings,
    setTimer,
    sendCursor,
  };
}

function applyPatch(s: RoomState, p: Patch): RoomState {
  switch (p.kind) {
    case 'card:add':
      return { ...s, cards: [...s.cards, p.card] };
    case 'card:edit':
      return { ...s, cards: s.cards.map((c) => (c.id === p.id ? { ...c, text: p.text } : c)) };
    case 'card:delete':
      return { ...s, cards: s.cards.filter((c) => c.id !== p.id) };
    case 'card:vote':
      return {
        ...s,
        cards: s.cards.map((c) => {
          if (c.id !== p.id) return c;
          const has = c.votes.includes(p.userId);
          return { ...c, votes: has ? c.votes.filter((v) => v !== p.userId) : [...c.votes, p.userId] };
        }),
      };
    case 'card:move': {
      const card = s.cards.find((c) => c.id === p.id);
      if (!card) return s;
      const without = s.cards.filter((c) => c.id !== p.id);
      const updated: Card = { ...card, col: p.col };
      if (!p.beforeId) return { ...s, cards: [...without, updated] };
      const idx = without.findIndex((c) => c.id === p.beforeId);
      if (idx < 0) return { ...s, cards: [...without, updated] };
      return { ...s, cards: [...without.slice(0, idx), updated, ...without.slice(idx)] };
    }
    case 'settings':
      return { ...s, ...p.patch };
    case 'timer':
      return { ...s, timer: p.timer };
    default:
      return s;
  }
}
