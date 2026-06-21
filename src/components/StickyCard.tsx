import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'motion/react';
import { Icon } from '../icons';
import { colorForName, initials, tintForName } from '../data';
import type { Card } from '../data';
import type { Profile } from '../lib/profile';
import { celebrateVote } from '../lib/voteDelight';
import { AnimatedCount } from './AnimatedCount';
import { NoteEditor } from './NoteEditor';

export type Participant = { id: string; name: string; color: string; isHost?: boolean };

export function StickyCard({
  card, profile, participants,
  isDragging, onDragStart, onDragEnd, onDropBefore,
  onEdit, onDelete, onVote,
}: {
  card: Card;
  profile: Profile;
  participants: Participant[];
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDropBefore: (beforeId: string) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onVote: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(card.text);
  const [dropPos, setDropPos] = useState<'before' | null>(null);
  const [pings, setPings] = useState<number[]>([]);
  const pingId = useRef(0);
  const voteRef = useRef<HTMLButtonElement | null>(null);
  const voteControls = useAnimationControls();
  const reduce = useReducedMotion();

  useEffect(() => { setText(card.text); }, [card.text]);

  const author = participants.find((p) => p.id === card.authorId);
  // Prefer the name snapshotted on the card so it survives the author leaving;
  // fall back to live presence (keeps their session color) only if absent.
  const authorName = card.authorName || author?.name || 'Anonymous';
  const authorColor = author?.color || colorForName(authorName);
  const isMine = card.authorId === profile.id;
  const youVoted = card.votes.includes(profile.id);

  const rot = useMemo(() => {
    let h = 0; for (let i = 0; i < card.id.length; i++) h = (h * 17 + card.id.charCodeAt(i)) >>> 0;
    return ((h % 21) - 10) / 14;
  }, [card.id]);

  const tintVar = tintForName(authorName);

  const finishEdit = () => {
    const trimmed = text.trim();
    if (trimmed && trimmed !== card.text) onEdit(card.id, trimmed);
    if (!trimmed) setText(card.text);
    setEditing(false);
  };

  const cancelEdit = () => {
    setText(card.text);
    setEditing(false);
  };

  const handleVoteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const votingOn = !youVoted;
    onVote(card.id);
    if (!votingOn) return; // delight is vote-on only; nothing on un-vote

    if (!reduce) {
      voteControls.start({
        scale: [1, 1.28, 1],
        transition: { duration: 0.35, times: [0, 0.4, 1] },
      });
      const id = pingId.current++;
      setPings((p) => [...p, id]);
    }
    if ('vibrate' in navigator) navigator.vibrate(8); // Android only; no-op elsewhere
    if (voteRef.current) celebrateVote(voteRef.current, card.col, card.votes.length + 1);
  };

  return (
    <div
      draggable={!editing}
      onDragStart={(e) => {
        if (editing) { e.preventDefault(); return; }
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', card.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDropPos('before'); }}
      onDragLeave={() => setDropPos(null)}
      onDrop={(e) => {
        e.preventDefault(); e.stopPropagation();
        onDropBefore(card.id);
        setDropPos(null);
      }}
      className={`sticky fade-in ${isDragging ? 'dragging' : ''}`}
      style={{
        ['--sticky-tint' as string]: `var(${tintVar})`,
        transform: isDragging ? 'rotate(0deg)' : `rotate(${rot}deg)`,
        outline: dropPos === 'before' ? '2px solid var(--color-brand)' : 'none',
        outlineOffset: 2,
      } as React.CSSProperties}>
      {!editing && isMine && (
        <div className="sticky-actions">
          <button onClick={() => setEditing(true)} title="Edit"><Icon name="edit" size={11} /></button>
          <button onClick={() => onDelete(card.id)} title="Delete"><Icon name="trash" size={11} /></button>
        </div>
      )}

      {editing ? (
        <NoteEditor
          value={text}
          onChange={setText}
          onSubmit={finishEdit}
          onCancel={cancelEdit}
          placeholder="Type your thought…"
          submitLabel="Save"
          cancelLabel="Cancel"
          hintVerb="save"
        />
      ) : (
        <div className="sticky-text" onDoubleClick={() => isMine && setEditing(true)}>
          {card.text}
        </div>
      )}

      <div className="sticky-foot">
        <div className="sticky-author">
          <div className="avatar xs" style={{ background: authorColor }}>
            {initials(authorName)}
          </div>
          <span>{authorName}{isMine ? ' (you)' : ''}</span>
        </div>
        {!editing && (
          <div className="vote-wrap">
            <motion.button
              ref={voteRef}
              className={`sticky-vote ${youVoted ? 'voted' : ''}`}
              onClick={handleVoteClick}
              title={youVoted ? 'Remove vote' : 'Vote'}
              animate={voteControls}
              whileTap={reduce ? undefined : { scale: 0.92 }}
              whileHover={reduce ? undefined : { scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
              <Icon name="arrow-up" size={10} />
              <AnimatedCount value={card.votes.length} />
            </motion.button>
            <AnimatePresence>
              {pings.map((id) => (
                <motion.span
                  key={id}
                  className="vote-ping"
                  initial={{ opacity: 0, y: 0, scale: 0.7 }}
                  animate={{ opacity: [0, 1, 0], y: -22, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  onAnimationComplete={() => setPings((p) => p.filter((x) => x !== id))}>
                  +1
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
