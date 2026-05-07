import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { RetroWordmark } from '../components/RetroWordmark';

export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const next = searchParams.get('next') || '/';
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error_description') || searchParams.get('error');

    if (errorParam) {
      setError(errorParam);
      return;
    }

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setError(error.message);
        } else {
          navigate(next, { replace: true });
        }
      });
      return;
    }

    // Hash-based fallback (older Supabase flow): session is parsed automatically
    // by the client; just wait one tick then check
    const t = window.setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) navigate(next, { replace: true });
      else setError('No code in callback URL.');
    }, 500);
    return () => window.clearTimeout(t);
  }, [searchParams, navigate]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><RetroWordmark /></div>
      </header>
      <main style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 380 }}>
          {error ? (
            <>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Sign-in failed</div>
              <div className="muted tiny">{error}</div>
              <button className="btn" style={{ marginTop: 16 }} onClick={() => navigate('/signin')}>
                Try again
              </button>
            </>
          ) : (
            <div className="muted">Signing you in…</div>
          )}
        </div>
      </main>
    </div>
  );
}
