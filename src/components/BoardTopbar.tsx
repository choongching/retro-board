import { useEffect, useRef, useState } from 'react';
import { Icon } from '../icons';
import { PresenceStack } from './PresenceStack';
import { ProfilePill } from './ProfilePill';
import { UserMenu } from './UserMenu';
import type { Participant } from './StickyCard';
import type { Format } from '../data';
import { useAuth } from '../lib/auth';
import type { Profile } from '../lib/profile';

export function BoardTopbar({
  code, title, fmt, profile, participants, anonMode, revealed,
  isOwner, onTitleChange,
  onToggleAnon, onReveal, onExportMarkdown, onExportJson, onLeave, onCopyCode, onCopyInviteLink, onChangeProfile, onProfileChange,
  onOpenRecap,
}: {
  code: string;
  title: string;
  fmt: Format;
  profile: Profile;
  participants: Participant[];
  anonMode: boolean;
  revealed: boolean;
  isOwner: boolean;
  onTitleChange: (next: string) => void;
  onToggleAnon: () => void;
  onReveal: () => void;
  onExportMarkdown: () => void;
  onExportJson: () => void;
  onLeave: () => void;
  onCopyCode: () => void;
  onCopyInviteLink: () => void;
  onChangeProfile: () => void;
  onProfileChange: (next: Profile) => void;
  onOpenRecap: () => void;
}) {
  void fmt;
  const { user } = useAuth();
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const [titleEditing, setTitleEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(title);
  const [titleHover, setTitleHover] = useState(false);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!titleEditing) setTitleDraft(title);
  }, [title, titleEditing]);

  useEffect(() => {
    if (titleEditing) titleInputRef.current?.select();
  }, [titleEditing]);

  const commitTitle = () => {
    setTitleEditing(false);
    onTitleChange(titleDraft);
  };
  const cancelTitle = () => {
    setTitleDraft(title);
    setTitleEditing(false);
  };

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
        {isOwner && (
          <button className="btn ghost icon" onClick={onLeave} title="Back to my boards">
            <Icon name="arrow-left" />
          </button>
        )}
        {titleEditing ? (
          <input
            ref={titleInputRef}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); commitTitle(); }
              else if (e.key === 'Escape') { e.preventDefault(); cancelTitle(); }
            }}
            style={{
              fontWeight: 600, fontSize: 15, letterSpacing: '-0.005em',
              padding: '4px 8px', minWidth: 200, maxWidth: 420,
              border: '1px solid var(--color-brand-line)',
              borderRadius: 6,
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              outline: 'none',
            }}
          />
        ) : (
          <div
            className="here"
            onMouseEnter={() => setTitleHover(true)}
            onMouseLeave={() => setTitleHover(false)}
            onClick={() => { if (isOwner) setTitleEditing(true); }}
            title={isOwner ? 'Click to rename' : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontWeight: 600, fontSize: 15,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              letterSpacing: '-0.005em',
              padding: '4px 8px', borderRadius: 6,
              cursor: isOwner ? 'text' : 'default',
              background: isOwner && titleHover ? 'var(--color-surface-2)' : 'transparent',
            }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
            {isOwner && titleHover && (
              <Icon name="edit" size={11} color="var(--color-text-muted)" />
            )}
          </div>
        )}
        <button className="btn sm" onClick={onCopyCode} title="Copy room code"
          style={{ marginLeft: 4, background: 'var(--color-surface-2)', borderColor: 'transparent' }}>
          <span className="mono" style={{ letterSpacing: '0.06em', color: 'var(--color-text-2)' }}>{code}</span>
        </button>
        <button className="btn icon sm" onClick={onCopyInviteLink} title="Copy invite link. Recipients enter their name before the board loads.">
          <Icon name="share" size={12} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {isOwner && anonMode && !revealed && (
          <button className="btn sm accent" onClick={onReveal}>
            <Icon name="eye" size={12} /> Reveal
          </button>
        )}

        {isOwner && (
          <button className="btn icon" onClick={onToggleAnon}
            title={anonMode ? 'Anonymous mode is on' : 'Anonymous mode is off'}
            style={anonMode ? { background: 'var(--color-brand-subtle)', borderColor: 'var(--color-brand-line)', color: 'var(--color-brand)' } : undefined}>
            <Icon name={anonMode ? 'eye-off' : 'eye'} size={13} />
          </button>
        )}

        {isOwner && (
          <button className="btn icon" onClick={onOpenRecap}
            title="Recap a previous session">
            <Icon name="history" size={13} />
          </button>
        )}

        {isOwner && (
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
                  title="Download a human-readable .md summary"
                  style={{ justifyContent: 'flex-start', height: 32 }}>
                  Markdown (.md)
                </button>
                <button className="btn ghost" role="menuitem"
                  onClick={() => { setExportOpen(false); onExportJson(); }}
                  title="Download the full board as JSON (can be re-imported)"
                  style={{ justifyContent: 'flex-start', height: 32 }}>
                  JSON (.json)
                </button>
              </div>
            )}
          </div>
        )}

        <PresenceStack participants={participants} selfId={profile.id} />
        {user ? (
          <UserMenu profile={profile} onProfileChange={onProfileChange} />
        ) : (
          <ProfilePill profile={profile} onClick={onChangeProfile} />
        )}
      </div>
    </header>
  );
}
