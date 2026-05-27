import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../icons';
import { colorForName, initials, tintForName } from '../data';
import type { Card } from '../data';
import type { Profile } from '../lib/profile';
import { NoteEditor } from './NoteEditor';

export type Participant = { id: string; name: string; color: string };

export function StickyCard({
  card, profile, participants, anonMode, revealed,
  isDragging, onDragStart, onDragEnd, onDropBefore,
  onEdit, onDelete, onVote,
}: {
  card: Card;
  profile: Profile;
  participants: Participant[];
  anonMode: boolean;
  revealed: boolean;
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

  useEffect(() => { setText(card.text); }, [card.text]);

  const author = participants.find((p) => p.id === card.authorId);
  const authorName = author?.name || 'Anonymous';
  const authorColor = author?.color || colorForName(authorName);
  const isMine = card.authorId === profile.id;
  const youVoted = card.votes.includes(profile.id);

  const hidden = anonMode && !revealed && !isMine;
  const showAuthor = !anonMode || revealed || isMine;

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
      className={`sticky fade-in ${isDragging ? 'dragging' : ''} ${hidden ? 'hidden-anon' : ''}`}
      style={{
        ['--sticky-tint' as string]: `var(${tintVar})`,
        transform: isDragging ? 'rotate(0deg)' : `rotate(${rot}deg)`,
        outline: dropPos === 'before' ? '2px solid var(--color-brand)' : 'none',
        outlineOffset: 2,
      } as React.CSSProperties}>
      {!editing && !hidden && isMine && (
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
          {hidden ? ' ' : card.text}
        </div>
      )}

      <div className="sticky-foot">
        <div className="sticky-author">
          {showAuthor ? (
            <>
              <div className="avatar sm" style={{
                background: authorColor, width: 16, height: 16, fontSize: 8.5,
                borderWidth: 1.5,
              }}>
                {initials(authorName)}
              </div>
              <span>{authorName}{isMine ? ' (you)' : ''}</span>
            </>
          ) : (
            <span style={{ fontStyle: 'italic', opacity: 0.6 }}>Anonymous</span>
          )}
        </div>
        {!editing && (
          <button
            className={`sticky-vote ${youVoted ? 'voted' : ''}`}
            onClick={(e) => { e.stopPropagation(); onVote(card.id); }}
            title={youVoted ? 'Remove vote' : 'Vote'}>
            <Icon name="arrow-up" size={10} />
            {card.votes.length}
          </button>
        )}
      </div>
    </div>
  );
}
