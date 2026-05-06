import { useMemo } from 'react';
import { initials } from '../data';
import type { Participant } from './StickyCard';

export function PresenceStack({ participants }: { participants: Participant[] }) {
  const unique = useMemo(() => {
    const seen = new Map<string, Participant>();
    for (const p of participants) if (!seen.has(p.id)) seen.set(p.id, p);
    return [...seen.values()];
  }, [participants]);

  const visible = unique.slice(0, 4);
  const extra = unique.length - visible.length;
  return (
    <div className="avatar-stack">
      {visible.map((p) => (
        <div key={p.id} className="avatar" style={{ background: p.color }} title={p.name}>
          {initials(p.name)}
        </div>
      ))}
      {extra > 0 && (
        <div className="avatar" style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-2)', borderColor: 'var(--color-surface)' }}>
          +{extra}
        </div>
      )}
    </div>
  );
}
