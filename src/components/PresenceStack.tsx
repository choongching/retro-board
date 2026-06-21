import { useEffect, useMemo, useRef, useState } from 'react';
import { initials } from '../data';
import type { Participant } from './StickyCard';

// At most this many circles in the collapsed stack (incl. the +N chip).
const STACK_CAP = 5;

export function PresenceStack({ participants, selfId }: { participants: Participant[]; selfId?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // Everyone, deduped — used for the full roster popover (includes self).
  const everyone = useMemo(() => {
    const seen = new Map<string, Participant>();
    for (const p of participants) if (!seen.has(p.id)) seen.set(p.id, p);
    return [...seen.values()];
  }, [participants]);

  // The collapsed stack shows others only (self already appears in the topbar
  // account menu), so it stays consistent with the previous behaviour.
  const others = useMemo(
    () => everyone.filter((p) => !selfId || p.id !== selfId),
    [everyone, selfId],
  );

  // Roster sort: you first, then facilitators, then everyone else (alpha).
  const roster = useMemo(() => {
    const rank = (p: Participant) => (p.id === selfId ? 0 : p.isHost ? 1 : 2);
    return [...everyone].sort(
      (a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name),
    );
  }, [everyone, selfId]);

  useEffect(() => {
    if (!open) return;
    const onMouse = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouse);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (others.length === 0) return null;

  const overflow = others.length > STACK_CAP;
  const visible = overflow ? others.slice(0, STACK_CAP - 1) : others;
  const extra = others.length - visible.length;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="avatar-stack"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`View all ${roster.length} participants`}
        title={`${others.length} other${others.length === 1 ? '' : 's'} here`}
      >
        {visible.map((p) => (
          <div key={p.id} className="avatar" style={{ background: p.color }}>
            {initials(p.name)}
          </div>
        ))}
        {extra > 0 && (
          <div
            className="avatar"
            style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-2)', borderColor: 'var(--color-surface)' }}>
            +{extra}
          </div>
        )}
      </button>

      {open && (
        <div className="surface roster-pop" role="dialog" aria-label="Participants">
          <div className="roster-head">
            Participants<span className="roster-count">{roster.length}</span>
          </div>
          <ul className="roster-list" role="list">
            {roster.map((p) => (
              <li key={p.id} className="roster-row">
                <div className="avatar sm" style={{ background: p.color }}>
                  {initials(p.name)}
                </div>
                <span className="roster-name">{p.name}</span>
                {p.id === selfId && <span className="roster-you">(you)</span>}
                {p.isHost && <span className="roster-badge">host</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
