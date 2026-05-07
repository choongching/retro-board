import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PALETTE, colorForName, initials } from '../data';
import type { FormatId } from '../data';
import { Icon } from '../icons';
import { RetroWordmark } from '../components/RetroWordmark';
import { loadProfile, saveProfile } from '../lib/profile';
import { useAuth } from '../lib/auth';

const FORMAT_CHOICES: { value: FormatId; label: string }[] = [
  { value: 'classic',  label: 'Classic' },
  { value: 'ssc',      label: 'Start/Stop/Continue' },
  { value: 'sailboat', label: 'Sailboat' },
];

function isFormatId(v: string | null): v is FormatId {
  return v === 'classic' || v === 'ssc' || v === 'sailboat';
}

export function Join() {
  const existing = loadProfile();
  const navigate = useNavigate();
  const params = useParams<{ code?: string }>();
  const [searchParams] = useSearchParams();
  const formatFromUrl = searchParams.get('format');
  const { user } = useAuth();

  const [name, setName] = useState(existing?.name || '');
  const [code, setCode] = useState((params.code || '').toUpperCase());
  const [color, setColor] = useState(existing?.color || colorForName(existing?.name || 'You'));
  const [colorTouched, setColorTouched] = useState(!!existing?.color);
  const [format, setFormat] = useState<FormatId>(isFormatId(formatFromUrl) ? formatFromUrl : 'classic');

  const codeRef = useRef<HTMLInputElement | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => { (params.code ? null : nameRef.current)?.focus(); }, [params.code]);

  useEffect(() => {
    if (!colorTouched) setColor(colorForName(name || 'You'));
  }, [name, colorTouched]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) { nameRef.current?.focus(); return; }
    if (!code.trim()) { codeRef.current?.focus(); return; }
    saveProfile({ name: name.trim(), color });
    navigate(`/r/${code.trim().toUpperCase()}?format=${format}`);
  };

  const shuffleColor = () => {
    const others = PALETTE.filter((c) => c !== color);
    setColor(others[Math.floor(Math.random() * others.length)]);
    setColorTouched(true);
  };

  const onBack = existing?.name ? () => navigate('/') : null;

  return (
    <div className="app-shell join-screen" style={{ background: 'var(--color-bg)' }}>
      <header className="topbar" style={{ borderBottomColor: 'transparent', background: 'transparent' }}>
        <RetroWordmark />
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
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.15 }}>
              Join a retrospective
            </h1>
            <div className="muted" style={{ marginTop: 8, fontSize: 14 }}>
              No account needed — just your name and a room code.
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
              <div className="field-label-row">
                <label className="field-label">Avatar</label>
                <button type="button" className="field-aux" onClick={shuffleColor} title="Pick a random color">
                  <Icon name="shuffle" size={11} /> Shuffle
                </button>
              </div>
              <div className="avatar-picker">
                <div className="avatar-preview" style={{ background: color }} aria-hidden="true">
                  {initials(name || '?')}
                </div>
                <div className="swatches" role="radiogroup" aria-label="Avatar color">
                  {PALETTE.map((c) => {
                    const selected = color === c;
                    return (
                      <button
                        key={c} type="button" role="radio" aria-checked={selected}
                        className={'swatch' + (selected ? ' is-selected' : '')}
                        onClick={() => { setColor(c); setColorTouched(true); }}
                        style={{ ['--swatch-color' as string]: c } as React.CSSProperties}
                        aria-label={`Color ${c}`}>
                        {selected && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="join-code">Room code</label>
              <div className="field-frame">
                <input
                  id="join-code"
                  ref={codeRef}
                  className="field-input mono code-input"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ABC-1234"
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">Format</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {FORMAT_CHOICES.map((f) => {
                  const selected = format === f.value;
                  return (
                    <button
                      key={f.value} type="button"
                      onClick={() => setFormat(f.value)}
                      className={'btn sm' + (selected ? ' accent' : '')}
                      style={{ flex: 1 }}>
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button type="submit" className="btn accent lg join-submit" disabled={!name.trim() || !code.trim()}>
              Join session
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
