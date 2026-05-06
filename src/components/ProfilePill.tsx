import { initials } from '../data';
import type { Profile } from '../lib/profile';

export function ProfilePill({ profile, onClick }: { profile: Profile | null; onClick?: () => void }) {
  if (!profile?.name) return null;
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        height: 36, padding: '0 4px 0 4px',
        background: 'transparent', border: 0,
        borderRadius: 999, cursor: 'pointer',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
      <span style={{ fontSize: 13, color: 'var(--color-text-2)' }}>{profile.name}</span>
      <div className="avatar" style={{ background: profile.color, borderColor: 'var(--color-surface)' }}>
        {initials(profile.name)}
      </div>
    </button>
  );
}
