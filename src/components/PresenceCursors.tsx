import type { User } from '../lib/useRetroChannel';

export function PresenceCursors({
  users, cursors, selfId,
}: {
  users: User[];
  cursors: Map<string, { x: number; y: number }>;
  selfId: string;
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9000 }}>
      {users
        .filter((u) => u.id !== selfId && cursors.has(u.id))
        .map((u) => {
          const pos = cursors.get(u.id)!;
          return (
            <div key={u.id} className="live-cursor" style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}>
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M2 2 L2 14 L6 11 L8.5 16 L10.5 15 L8 10 L13 10 Z"
                      fill={u.color} stroke="#fff" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
              <div className="label" style={{ background: u.color }}>{u.name.split(' ')[0]}</div>
            </div>
          );
        })}
    </div>
  );
}
