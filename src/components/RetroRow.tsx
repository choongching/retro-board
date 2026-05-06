import { Icon } from '../icons';
import { FORMATS, MOCK_OTHERS, colorForName, initials } from '../data';
import type { Retro } from '../data';

export function RetroRow({ retro, isLast, onJoin }: { retro: Retro; isLast: boolean; onJoin: () => void }) {
  const fmt = FORMATS[retro.format];
  const isLive = retro.status === 'live';
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto auto auto auto',
      gap: 18, alignItems: 'center',
      padding: '14px 18px',
      borderBottom: isLast ? 0 : '1px solid var(--color-divider)',
      cursor: 'pointer',
    }}
    onClick={onJoin}
    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')}
    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isLive && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 11, fontWeight: 600, color: '#3D8B7A',
              padding: '2px 8px', background: 'color-mix(in oklch, #3D8B7A 14%, var(--color-bg))',
              borderRadius: 999,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3D8B7A' }} />
              LIVE
            </span>
          )}
          <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {retro.title}
          </div>
        </div>
        <div className="tiny muted" style={{ marginTop: 3 }}>
          {fmt.name} · {retro.date}
        </div>
      </div>
      <div className="mono tiny muted">{retro.code}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--color-text-muted)', fontSize: 12 }}>
        <Icon name="users" /> {retro.participants}
      </div>
      <div className="avatar-stack">
        {Array.from({ length: Math.min(3, retro.participants) }).map((_, i) => {
          const name = MOCK_OTHERS[i].name;
          return (
            <div key={i} className="avatar sm" style={{ background: colorForName(name) }}>
              {initials(name)}
            </div>
          );
        })}
      </div>
      <Icon name="chevron-right" color="var(--color-text-subtle)" />
    </div>
  );
}
