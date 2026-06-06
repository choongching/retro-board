import { CursorArrow } from './CursorArrow';
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
          const isHost = u.isHost === true;
          return (
            <div key={u.id} className="live-cursor" style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}>
              <CursorArrow color={u.color} size={18} />
              <div className="label" style={{ background: u.color }}>
                {u.name.split(' ')[0]}
                {isHost && <span className="label-host" aria-label="Host">host</span>}
              </div>
            </div>
          );
        })}
    </div>
  );
}
