-- Phase 2.4: relax cards_delete to match the share-link model
--
-- The original policy restricted deletes to the board owner. Combined with
-- the already-relaxed insert/update policies, this caused anonymous users
-- to fail silent deletes (UI removed the card optimistically; DB kept it;
-- reload showed it again). For the share-link trust model, anyone with the
-- room code can delete cards just like they can edit/vote.

drop policy if exists cards_delete on public.cards;

create policy cards_delete on public.cards
  for delete using (true);
