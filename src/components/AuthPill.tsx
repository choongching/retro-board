import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '../icons';
import { useAuth } from '../lib/auth';

export function AuthPill() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', escHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', escHandler);
    };
  }, [open]);

  if (loading) return null;

  if (!user) {
    return (
      <button
        className="btn sm"
        onClick={() => navigate(`/signin?next=${encodeURIComponent(location.pathname + location.search)}`)}>
        Sign in
      </button>
    );
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="btn sm ghost"
        onClick={() => setOpen((v) => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className="mono" style={{ fontSize: 11.5, color: 'var(--color-text-2)' }}>
          {user.email}
        </span>
        <Icon name="chevron-down" size={11} color="var(--color-text-muted)" />
      </button>
      {open && (
        <div className="surface" role="menu" style={{
          position: 'absolute', top: 32, right: 0, zIndex: 20,
          padding: 4, minWidth: 160,
          boxShadow: 'var(--shadow-lg)',
          display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          <button
            className="btn ghost"
            role="menuitem"
            onClick={async () => { setOpen(false); await signOut(); }}
            style={{ justifyContent: 'flex-start', height: 32 }}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
