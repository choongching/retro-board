import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../icons';
import { FORMATS } from '../data';
import type { ColumnId, FormatId } from '../data';
import { pickQuestion } from '../lib/icebreakerQuestions';
import { Modal } from './Modal';

export function IcebreakerModal({
  open, onClose, format, onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  format: FormatId;
  onSubmit: (text: string, col: ColumnId) => void;
}) {
  const fmt = FORMATS[format];
  const defaultCol = fmt.columns[0].id;

  // Lock the question for the lifetime of an open instance.
  const question = useMemo(() => pickQuestion(), [open]);

  const [text, setText] = useState('');
  const [col, setCol] = useState<ColumnId>(defaultCol);

  useEffect(() => {
    if (open) {
      setText('');
      setCol(defaultCol);
    }
  }, [open, defaultCol]);

  const canSubmit = text.trim().length > 0;
  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(text.trim(), col);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width="min(440px, calc(100vw - 48px))"
      surfaceStyle={{
        padding: '26px 24px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <button
        type="button"
        className="btn ghost icon"
        onClick={onClose}
        aria-label="Close"
        style={{ position: 'absolute', top: 10, right: 10 }}
      >
        <Icon name="x" />
      </button>

      <h2 style={{
        margin: '0 28px 0 0',
        fontSize: 18, fontWeight: 600,
        letterSpacing: '-0.01em',
        lineHeight: 1.35,
      }}>
        {question}
      </h2>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a sentence or two..."
        autoFocus
        style={{
          width: '100%',
          minHeight: 88,
          padding: '10px 12px',
          resize: 'vertical',
          font: 'inherit',
          fontSize: 14.5,
          lineHeight: 1.5,
          color: 'var(--color-text)',
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          outline: 'none',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <label htmlFor="icebreaker-col" className="tiny muted" style={{ flexShrink: 0 }}>
          Post to:
        </label>
        <select
          id="icebreaker-col"
          value={col}
          onChange={(e) => setCol(e.target.value as ColumnId)}
          style={{
            font: 'inherit', fontSize: 13.5,
            padding: '6px 10px',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            cursor: 'pointer',
          }}
        >
          {fmt.columns.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, marginTop: 4,
      }}>
        <button
          type="button"
          className="quiet-link"
          onClick={onClose}
          style={{ fontSize: 13 }}
        >
          Maybe later
        </button>
        <button
          type="button"
          className="btn accent"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          Drop it in
        </button>
      </div>
    </Modal>
  );
}
