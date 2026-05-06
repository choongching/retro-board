import { useEffect, useRef, useState } from 'react';
import { tintForName } from '../data';
import type { ColumnId } from '../data';
import type { Profile } from '../lib/profile';

export function Composer({
  col, profile, onAdd,
}: {
  col: { id: ColumnId; accent?: string };
  profile: Profile;
  onAdd: (col: ColumnId, text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => { if (open) ref.current?.focus(); }, [open]);

  const submit = () => {
    if (text.trim()) onAdd(col.id, text);
    setText('');
    setOpen(false);
  };

  if (!open) {
    return (
      <button className="add-card-trigger" onClick={() => setOpen(true)}>
        Add a card
      </button>
    );
  }

  const tintVar = tintForName(profile.name);
  return (
    <div className="composer" style={{ ['--sticky-tint' as string]: `var(${tintVar})` } as React.CSSProperties}>
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={col.id === 'wind' ? 'What’s pushing us forward?' :
                    col.id === 'anchor' ? 'What’s holding us back?' :
                    'Type your thought…'}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
          if (e.key === 'Escape') { setText(''); setOpen(false); }
        }}
      />
      <div className="composer-actions">
        <span className="tiny muted">↵ to add</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn sm ghost" onClick={() => { setText(''); setOpen(false); }}>Cancel</button>
          <button className="btn sm accent" onClick={submit}>Add</button>
        </div>
      </div>
    </div>
  );
}
