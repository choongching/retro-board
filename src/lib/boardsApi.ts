import { supabase } from './supabase';
import type { FormatId } from '../data';

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

export async function updateBoardLastActive(boardId: string): Promise<void> {
  const { error } = await supabase
    .from('boards')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', boardId);
  if (error) console.error('updateBoardLastActive failed', error);
}
