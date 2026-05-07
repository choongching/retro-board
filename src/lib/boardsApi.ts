import { supabase } from './supabase';
import type { Card, ColumnId, FormatId } from '../data';

export type Board = {
  id: string;
  code: string;
  title: string;
  format: FormatId;
  owner_id: string;
  created_at: string;
  last_active_at: string;
};

export async function createBoard(input: {
  code: string;
  title: string;
  format: FormatId;
  ownerId: string;
}): Promise<Board | null> {
  const { data, error } = await supabase
    .from('boards')
    .insert({
      code: input.code,
      title: input.title,
      format: input.format,
      owner_id: input.ownerId,
    })
    .select()
    .single();
  if (error) {
    console.error('createBoard failed', error);
    return null;
  }
  return data as Board;
}

export async function getBoardByCode(code: string): Promise<Board | null> {
  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .eq('code', code)
    .maybeSingle();
  if (error) {
    console.error('getBoardByCode failed', error);
    return null;
  }
  return (data as Board | null) ?? null;
}

export async function getMyBoards(ownerId: string): Promise<Board[]> {
  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .eq('owner_id', ownerId)
    .order('last_active_at', { ascending: false });
  if (error) {
    console.error('getMyBoards failed', error);
    return [];
  }
  return (data as Board[]) ?? [];
}

export async function deleteBoard(boardId: string): Promise<void> {
  const { error } = await supabase.from('boards').delete().eq('id', boardId);
  if (error) console.error('deleteBoard failed', error);
}

export async function updateBoardTitle(boardId: string, title: string): Promise<void> {
  const { error } = await supabase.from('boards').update({ title }).eq('id', boardId);
  if (error) console.error('updateBoardTitle failed', error);
}

export async function updateBoardLastActive(boardId: string): Promise<void> {
  const { error } = await supabase
    .from('boards')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', boardId);
  if (error) console.error('updateBoardLastActive failed', error);
}

type CardRow = {
  id: string;
  col: string;
  text: string;
  author_id: string | null;
  votes: string[];
  created_at: string;
};

export async function getCardsForBoard(boardId: string): Promise<Card[]> {
  const { data, error } = await supabase
    .from('cards')
    .select('id, col, text, author_id, votes, created_at')
    .eq('board_id', boardId)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('getCardsForBoard failed', error);
    return [];
  }
  return (data as CardRow[]).map((r) => ({
    id: r.id,
    col: r.col as ColumnId,
    text: r.text,
    authorId: r.author_id ?? '',
    votes: r.votes ?? [],
    createdAt: new Date(r.created_at).getTime(),
  }));
}

export async function insertCard(
  boardId: string,
  card: Card,
  authorName: string,
): Promise<void> {
  const { error } = await supabase.from('cards').upsert(
    {
      id: card.id,
      board_id: boardId,
      col: card.col,
      text: card.text,
      author_id: card.authorId,
      author_name: authorName,
      votes: card.votes,
      created_at: new Date(card.createdAt).toISOString(),
    },
    { onConflict: 'id' },
  );
  if (error) console.error('insertCard failed', error);
}

export async function updateCardText(cardId: string, text: string): Promise<void> {
  const { error } = await supabase.from('cards').update({ text }).eq('id', cardId);
  if (error) console.error('updateCardText failed', error);
}

export async function updateCardCol(cardId: string, col: ColumnId): Promise<void> {
  const { error } = await supabase.from('cards').update({ col }).eq('id', cardId);
  if (error) console.error('updateCardCol failed', error);
}

export async function setCardVotes(cardId: string, votes: string[]): Promise<void> {
  const { error } = await supabase.from('cards').update({ votes }).eq('id', cardId);
  if (error) console.error('setCardVotes failed', error);
}

export async function deleteCardById(cardId: string): Promise<void> {
  const { error } = await supabase.from('cards').delete().eq('id', cardId);
  if (error) console.error('deleteCardById failed', error);
}

export async function bulkInsertCards(boardId: string, cards: Card[]): Promise<void> {
  if (cards.length === 0) return;
  const rows = cards.map((c) => ({
    id: c.id,
    board_id: boardId,
    col: c.col,
    text: c.text,
    author_id: c.authorId || null,
    author_name: null,
    votes: c.votes,
    created_at: new Date(c.createdAt).toISOString(),
  }));
  const { error } = await supabase.from('cards').insert(rows);
  if (error) console.error('bulkInsertCards failed', error);
}
