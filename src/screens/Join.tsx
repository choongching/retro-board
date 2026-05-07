import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { colorForName } from '../data';
import { Icon } from '../icons';
import { RetroWordmark } from '../components/RetroWordmark';
import { loadProfile, saveProfile } from '../lib/profile';
import { useAuth } from '../lib/auth';
import { getBoardByCode } from '../lib/boardsApi';

export function Join() {
  const existing = loadProfile();
  const navigate = useNavigate();
  const params = useParams<{ code?: string }>();
  const [searchParams] = useSearchParams();
  const formatFromUrl = searchParams.get('format');
  const { user } = useAuth();

  const [name, setName] = useState(existing?.name || '');
  const [code, setCode] = useState((params.code || '').toUpperCase());
  const [codeError, setCodeError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const codeRef = useRef<HTMLInputElement | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    (params.code ? null : nameRef.current)?.focus();
  }, [params.code]);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedName) { nameRef.current?.focus(); return; }
    if (!trimmedCode) { codeRef.current?.focus(); return; }
    setSubmitting(true);
    setCodeError(null);
    const board = await getBoardByCode(trimmedCode);
    setSubmitting(false);
    if (!board) {
      setCodeError("We couldn't find a retro with that code. Double-check it with your teammate.");
      return;
    }
    saveProfile({ name: trimmedName, color: existing?.color || colorForName(trimmedName) });
    const formatSuffix = formatFromUrl ? `?format=${formatFromUrl}` : '';
    navigate(`/r/${trimmedCode}${formatSuffix}`);
  };

  const onBack = existing?.name ? () => navigate('/') : null;

  return (
    <div className="app-shell join-screen">
      <header className="topbar">
        <div className="brand"><RetroWordmark /></div>
        {onBack && (
          <button className="btn ghost" onClick={onBack}>
            <Icon name="arrow-left" /> Back
          </button>
        )}
      </header>

      <main style={{
        flex: 1,
        display: 'grid',
        placeItems: 'center',
        padding: '24px 24px 80px',
      }}>
        <div style={{ width: 420, maxWidth: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={{ margin: 0, fontSize: 30, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              Join a retro
            </h1>
            <div className="muted" style={{ marginTop: 6 }}>
              Just your name and the room code.
            </div>
          </div>

          <form onSubmit={submit} className="surface join-card" style={{ padding: '24px 24px 22px' }}>
            <div className="field-group">
              <label className="field-label" htmlFor="join-name">Your name</label>
              <div className="field-frame">
                <input
                  id="join-name"
                  ref={nameRef}
                  className="field-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Casey Lin"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="join-code">Room code</label>
              <div className="field-frame" style={codeError ? { borderColor: '#c77b58' } : undefined}>
                <input
                  id="join-code"
                  ref={codeRef}
                  className="field-input mono code-input"
                  value={code}
                  onChange={(e) => { setCode(e.target.value.toUpperCase()); if (codeError) setCodeError(null); }}
                  placeholder="ABC-1234"
                  autoComplete="off"
                  spellCheck="false"
                  aria-invalid={!!codeError}
                />
              </div>
              {codeError && <div className="tiny" style={{ color: '#9c4326', marginTop: 4 }}>{codeError}</div>}
            </div>

            <button
              type="submit"
              className="btn accent lg join-submit"
              disabled={submitting || !name.trim() || !code.trim()}>
              {submitting ? 'Looking up…' : 'Join'}
            </button>
          </form>

          {!user && (
            <div className="tiny muted" style={{ marginTop: 14, textAlign: 'center' }}>
              Want to save retros across sessions?{' '}
              <button
                type="button"
                className="quiet-link"
                onClick={() => {
                  const next = params.code ? `/r/${params.code}` : '/';
                  navigate(`/signin?next=${encodeURIComponent(next)}`);
                }}>
                Sign in
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
