import { useEffect, useRef, useState } from 'react';
import { Icon } from '../icons';
import { colorForName, initials } from '../data';
import { useAuth } from '../lib/auth';
import { saveProfile } from '../lib/profile';
import type { Profile } from '../lib/profile';

export function UserMenu({ profile, onProfileChange }: {
  profile: Profile | null;
  onProfileChange: (next: Profile) => void;
}) {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const fallbackName = user?.email?.split('@')[0] ?? '';
  const [editName, setEditName] = useState(profile?.name ?? '');

  useEffect(() => { setEditName(profile?.name ?? ''); }, [profile?.name]);

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

  if (!user) return null;

  const displayName = profile?.name || fallbackName;
  const avatarColor = profile?.color || colorForName(fallbackName || 'You');
  const avatarInitials = initials(displayName || '?');

  const commitName = () => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === profile?.name) return;
    const next = saveProfile({
      name: trimmed,
      color: profile?.color ?? colorForName(trimmed),
    });
    onProfileChange(next);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          height: 36, padding: '0 8px 0 4px',
          background: 'transparent', border: 0,
          borderRadius: 999, cursor: 'pointer',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
        <div className="avatar" style={{ background: avatarColor, borderColor: 'var(--color-surface)' }}>
          {avatarInitials}
        </div>
        <span style={{ fontSize: 13, color: 'var(--color-text-2)' }}>{displayName}</span>
        <Icon name="chevron-down" size={11} color="var(--color-text-muted)" />
      </button>

      {open && (
        <div
          className="surface"
          role="menu"
          style={{
            position: 'absolute', top: 42, right: 0, zIndex: 20,
            minWidth: 260, padding: 6,
            boxShadow: 'var(--shadow-lg)',
            display: 'flex', flexDirection: 'column', gap: 2,
          }}>
          <div style={{ padding: '6px 10px 8px' }}>
            <div className="tiny muted" style={{ marginBottom: 2 }}>Signed in as</div>
            <div className="mono" style={{ fontSize: 12.5, color: 'var(--color-text-2)', wordBreak: 'break-all', lineHeight: 1.35 }}>
              {user.email}
            </div>
          </div>
          <div style={{ height: 1, background: 'var(--color-divider)', margin: '2px 0' }} />
          <div style={{ padding: '6px 10px 8px' }}>
            <label htmlFor="usermenu-display" className="tiny muted" style={{ display: 'block', marginBottom: 4 }}>
              Display name
            </label>
            <div className="field-frame" style={{ padding: '4px 8px' }}>
              <input
                id="usermenu-display"
                type="text"
                className="field-input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commitName();
                    setOpen(false);
                  }
                }}
                placeholder={fallbackName || 'Your name'}
                autoComplete="off"
              />
            </div>
          </div>
          <div style={{ height: 1, background: 'var(--color-divider)', margin: '2px 0' }} />
          <button
            type="button"
            className="btn ghost"
            role="menuitem"
            onClick={async () => { setOpen(false); await signOut(); }}
            style={{ justifyContent: 'flex-start', height: 32, color: '#9c4326' }}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
