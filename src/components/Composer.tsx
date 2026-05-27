import { useState } from 'react';
import { tintForName } from '../data';
import type { ColumnId } from '../data';
import type { Profile } from '../lib/profile';
import { NoteEditor } from './NoteEditor';

function placeholderFor(col: ColumnId): string {
  if (col === 'wind') return 'What’s pushing us forward?';
  if (col === 'anchor') return 'What’s holding us back?';
  return 'Type your thought…';
}

/**
 * Always-open editor. The parent (Column) decides when to mount/unmount this,
 * via its own "+" trigger in the header. Submit posts the note and closes.
 */
export function Composer({
  col, profile, onAdd, onClose,
}: {
  col: { id: ColumnId; accent?: string };
  profile: Profile;
  onAdd: (col: ColumnId, text: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState('');

  const submit = () => {
    const trimmed = text.trim();
    if (trimmed) onAdd(col.id, trimmed);
    setText('');
    onClose();
  };

  const cancel = () => {
    setText('');
    onClose();
  };

  const tintVar = tintForName(profile.name);
  return (
    <div
      className="composer"
      style={{ ['--sticky-tint' as string]: `var(${tintVar})` } as React.CSSProperties}
    >
      <NoteEditor
        value={text}
        onChange={setText}
        onSubmit={submit}
        onCancel={cancel}
        placeholder={placeholderFor(col.id)}
        submitLabel="Drop in"
        cancelLabel="Cancel"
        hintVerb="drop"
      />
    </div>
  );
}
