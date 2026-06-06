import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal } from './Modal';
import { Icon } from '../icons';

const INLINE_MIN_HEIGHT = 88;   // ~3 lines
const INLINE_MAX_HEIGHT = 320;  // ~12 lines
const MODAL_MIN_HEIGHT = 220;   // ~8 lines

const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform);

type Props = {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  /** Verb for the keyboard hint, e.g. "drop" → "⌘↵ to drop". */
  hintVerb?: string;
};

/**
 * Shared editable text surface for creating and editing notes.
 * Auto-grows up to a cap, then scrolls. An expand button promotes the editor
 * into a centered modal with a larger writing surface; content is preserved.
 * Cmd/Ctrl+Enter submits, Esc cancels (or closes the modal back to inline).
 */
export function NoteEditor({
  value, onChange, onSubmit, onCancel,
  placeholder = 'Type your thought…',
  autoFocus = true,
  submitLabel = 'Drop in',
  cancelLabel = 'Cancel',
  hintVerb = 'drop',
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const inlineRef = useRef<HTMLTextAreaElement | null>(null);
  const modalRef = useRef<HTMLTextAreaElement | null>(null);

  const autosize = useCallback((el: HTMLTextAreaElement | null, max: number) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
  }, []);

  useEffect(() => {
    if (expanded) {
      autosize(modalRef.current, Math.round(window.innerHeight * 0.6));
    } else {
      autosize(inlineRef.current, INLINE_MAX_HEIGHT);
    }
  }, [value, expanded, autosize]);

  useEffect(() => {
    if (!autoFocus || expanded) return;
    const el = inlineRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [autoFocus, expanded]);

  useEffect(() => {
    if (!expanded) return;
    const el = modalRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [expanded]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSubmit();
      return;
    }
    if (e.key === 'Escape') {
      if (expanded) {
        e.preventDefault();
        setExpanded(false);
      } else {
        onCancel();
      }
    }
  };

  const hint = `${IS_MAC ? '⌘↵' : 'Ctrl+↵'} to ${hintVerb}`;

  return (
    <div className="note-editor">
      <button
        type="button"
        className="note-editor-expand"
        onClick={() => setExpanded(true)}
        title="Open in editor"
        aria-label="Open in larger editor"
      >
        <Icon name="maximize" size={14} />
      </button>

      <textarea
        ref={inlineRef}
        className="note-editor-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={handleKeyDown}
        style={{ minHeight: INLINE_MIN_HEIGHT, maxHeight: INLINE_MAX_HEIGHT }}
      />

      <div className="note-editor-actions">
        <span className="tiny muted">{hint}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="btn sm ghost"
            onClick={onCancel}
            title="Discard (Esc)"
          >
            {cancelLabel}
          </button>
          <button
            className="btn sm accent"
            onClick={onSubmit}
            title={`${submitLabel} (${IS_MAC ? '⌘↵' : 'Ctrl+↵'})`}
          >
            {submitLabel}
          </button>
        </div>
      </div>

      <Modal
        open={expanded}
        onClose={() => setExpanded(false)}
        width="min(640px, calc(100vw - 48px))"
        surfaceStyle={{
          padding: 18,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}
      >
        <textarea
          ref={modalRef}
          className="composer-modal-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          style={{ minHeight: MODAL_MIN_HEIGHT, maxHeight: '60vh' }}
        />
        <div className="note-editor-actions">
          <span className="tiny muted">{hint}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn sm ghost"
              onClick={() => setExpanded(false)}
              title="Back to inline editor (Esc)"
            >
              Close editor
            </button>
            <button
              className="btn sm accent"
              onClick={onSubmit}
              title={`${submitLabel} (${IS_MAC ? '⌘↵' : 'Ctrl+↵'})`}
            >
              {submitLabel}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
