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
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const fallbackName = user?.email?.split('@')[0] ?? '';
  const [editName, setEditName] = useState(profile?.name ?? '');

  useEffect(() => { setEditName(profile?.name ?? ''); }, [profile?.name]);

  const close = () => {
    setOpen(false);
    setConfirmingSignOut(false);
  };

  useEffect(() => {
    if (!open) return;
    const onMouse = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
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
        className="usermenu-trigger"
        onClick={() => (open ? close() : setOpen(true))}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Account menu"
      >
        <div className="avatar" style={{ background: avatarColor, borderColor: 'var(--color-surface)' }}>
          {avatarInitials}
        </div>
        <span className="usermenu-trigger-name">{displayName}</span>
        <Icon name="chevron-down" size={11} color="var(--color-text-muted)" />
      </button>

      {open && (
        <div className="surface usermenu-pop" role="menu">
          <div className="usermenu-section">
            <div className="usermenu-label">Signed in as</div>
            <div className="usermenu-email mono">{user.email}</div>
          </div>

          <div className="usermenu-divider" />

          <div className="usermenu-section">
            <label htmlFor="usermenu-display" className="usermenu-label">Display name</label>
            <input
              id="usermenu-display"
              type="text"
              className="usermenu-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitName();
                  close();
                }
              }}
              placeholder={fallbackName || 'Your name'}
              autoComplete="off"
            />
          </div>

          <div className="usermenu-divider" />

          {confirmingSignOut ? (
            <div className="usermenu-confirm">
              <div className="usermenu-confirm-text">Sign out of JomRetro on this device?</div>
              <div className="usermenu-confirm-actions">
                <button type="button" className="btn" onClick={() => setConfirmingSignOut(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn danger"
                  onClick={async () => { close(); await signOut(); }}
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="menu-item danger usermenu-signout"
              role="menuitem"
              onClick={() => setConfirmingSignOut(true)}
            >
              <Icon name="log-out" size={15} />
              Sign out
            </button>
          )}
        </div>
      )}
    </div>
  );
}
