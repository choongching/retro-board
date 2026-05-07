import { useEffect, useRef, useState } from 'react';
import { Icon } from '../icons';
import { PresenceStack } from './PresenceStack';
import { ProfilePill } from './ProfilePill';
import type { Participant } from './StickyCard';
import type { Format } from '../data';
import type { Profile } from '../lib/profile';

export function BoardTopbar({
  code, title, fmt, profile, participants, anonMode, revealed,
  onToggleAnon, onReveal, onExportMarkdown, onExportJson, onLeave, onCopyCode, onChangeProfile,
}: {
  code: string;
  title: string;
  fmt: Format;
  profile: Profile;
  participants: Participant[];
  anonMode: boolean;
  revealed: boolean;
  onToggleAnon: () => void;
  onReveal: () => void;
  onExportMarkdown: () => void;
  onExportJson: () => void;
  onLeave: () => void;
  onCopyCode: () => void;
  onChangeProfile: () => void;
}) {
  void fmt;
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!exportOpen) return;
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExportOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', escHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', escHandler);
    };
  }, [exportOpen]);

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <button className="btn ghost icon" onClick={onLeave} title="Leave">
          <Icon name="arrow-left" />
        </button>
        <div className="here" style={{
          fontWeight: 600, fontSize: 14,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          letterSpacing: '-0.01em',
        }}>
          {title}
        </div>
        <button className="btn sm" onClick={onCopyCode} title="Copy room code"
          style={{ marginLeft: 4, background: 'var(--color-surface-2)', borderColor: 'transparent' }}>
          <span className="mono" style={{ letterSpacing: '0.06em', color: 'var(--color-text-2)' }}>{code}</span>
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {anonMode && !revealed && (
          <button className="btn sm accent" onClick={onReveal}>
            <Icon name="eye" size={12} /> Reveal
          </button>
        )}

        <button className="btn icon" onClick={onToggleAnon}
          title={anonMode ? 'Anonymous mode is on' : 'Anonymous mode is off'}
          style={anonMode ? { background: 'var(--color-brand-subtle)', borderColor: 'var(--color-brand-line)', color: 'var(--color-brand)' } : undefined}>
          <Icon name={anonMode ? 'eye-off' : 'eye'} size={13} />
        </button>

        <div ref={exportRef} style={{ position: 'relative' }}>
          <button className="btn icon" onClick={() => setExportOpen((v) => !v)} title="Export retro">
            <Icon name="download" size={13} />
          </button>
          {exportOpen && (
            <div className="surface" role="menu" style={{
              position: 'absolute', top: 38, right: 0, zIndex: 20,
              padding: 4, minWidth: 160,
              boxShadow: 'var(--shadow-lg)',
              display: 'flex', flexDirection: 'column', gap: 2,
            }}>
              <button className="btn ghost" role="menuitem"
                onClick={() => { setExportOpen(false); onExportMarkdown(); }}
                style={{ justifyContent: 'flex-start', height: 32 }}>
                Markdown (.md)
              </button>
              <button className="btn ghost" role="menuitem"
                onClick={() => { setExportOpen(false); onExportJson(); }}
                style={{ justifyContent: 'flex-start', height: 32 }}>
                JSON (.json)
              </button>
            </div>
          )}
        </div>

        <PresenceStack participants={participants} />
        <ProfilePill profile={profile} onClick={onChangeProfile} />
      </div>
    </header>
  );
}
