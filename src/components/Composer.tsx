import { useState } from 'react';
import type { ColumnId } from '../data';
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
  col, onAdd, onClose,
}: {
  col: { id: ColumnId; accent?: string };
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

  return (
    <div className="composer">
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
