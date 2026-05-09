import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '../icons';
import { RetroWordmark } from '../components/RetroWordmark';
import { useAuth } from '../lib/auth';

export function SignIn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signIn, session } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const next = searchParams.get('next') || '/';

  // Already signed in — bounce them
  if (session) {
    navigate(next, { replace: true });
    return null;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);
    const { error } = await signIn(trimmed, next);
    setSubmitting(false);
    if (error) setError(error.message);
    else setSentTo(trimmed);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><RetroWordmark /></div>
        <button className="btn ghost" onClick={() => navigate('/')}>
          <Icon name="arrow-left" /> Back
        </button>
      </header>

      <main style={{
        flex: 1,
        display: 'grid',
        placeItems: 'center',
        padding: '24px 24px 80px',
      }}>
        <div style={{ width: 420, maxWidth: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={{ margin: 0, fontSize: 30, fontWeight: 600, letterSpacing: '-0.015em', lineHeight: 1.15 }}>
              Sign in
            </h1>
            <div className="muted" style={{ marginTop: 6 }}>
              We'll email you a magic link. No passwords.
            </div>
          </div>

          {sentTo ? (
            <div className="surface" style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 'var(--radius-pill)', margin: '0 auto 16px',
                background: 'var(--color-brand-subtle)', color: 'var(--color-brand)',
                display: 'grid', placeItems: 'center',
              }}>
                <Icon name="check" size={20} />
              </div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Check your email</div>
              <div className="muted" style={{ fontSize: 13.5 }}>
                We sent a magic link to <span className="mono">{sentTo}</span>.<br />
                Open it in this browser to sign in.
              </div>
              <button
                type="button"
                className="quiet-link"
                onClick={() => { setSentTo(null); setEmail(''); }}
                style={{ marginTop: 16, fontSize: 12.5 }}>
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="surface" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="field-group">
                <label className="field-label" htmlFor="signin-email">Email address</label>
                <div className="field-frame">
                  <input
                    id="signin-email"
                    type="email"
                    className="field-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    autoComplete="email"
                    autoFocus
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="tiny" style={{ color: '#9c4326' }}>{error}</div>
              )}

              <button
                type="submit"
                className="btn accent lg"
                disabled={submitting || !email.trim()}
                style={{ justifyContent: 'center', width: '100%' }}>
                {submitting ? 'Sending…' : 'Send magic link'}
              </button>

              <div className="tiny muted" style={{ textAlign: 'center', marginTop: 4 }}>
                Just want to join? <button type="button" className="quiet-link" onClick={() => navigate('/join')}>Use a room code</button> instead.
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
