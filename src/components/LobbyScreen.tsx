import { useEffect, useMemo, useRef, useState } from 'react';
import { FORMATS } from '../data';
import type { FormatId } from '../data';
import { Icon } from '../icons';
import { RetroWordmark } from './RetroWordmark';

type Participant = { id: string; name: string; color: string; isHost?: boolean };

type Props = {
  code: string;
  title: string;
  format: FormatId;
  participants: Participant[];
  isOwner: boolean;
  onStart: () => void;
  onTitleChange: (next: string) => void;
  onCopyInviteLink: () => void;
  onLeave: () => void;
};

export function LobbyScreen({
  code, title, format, participants, isOwner,
  onStart, onTitleChange, onCopyInviteLink, onLeave,
}: Props) {
  const fmt = FORMATS[format];
  const hostName = useMemo(
    () => participants.find((p) => p.isHost)?.name ?? null,
    [participants],
  );

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Focus + select when entering edit mode (DOM side-effect, not state sync).
  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const startEdit = () => {
    setDraft(title);
    setEditing(true);
  };
  const commitTitle = () => {
    setEditing(false);
    const next = draft.trim();
    if (next && next !== title) onTitleChange(next);
  };
  const cancelTitle = () => {
    setDraft(title);
    setEditing(false);
  };

  const alone = participants.length <= 1;
  const peopleLabel = `${participants.length} ${participants.length === 1 ? 'person' : 'people'} in the room`;
  const waitingCopy = hostName
    ? `Waiting for ${hostName} to start the retro...`
    : 'Waiting for the host to start...';

  return (
    <div className="lobby-shell">
      <header className="lobby-topbar">
        <RetroWordmark />
        <div className="lobby-topbar-actions">
          <button
            type="button"
            className="btn"
            onClick={onCopyInviteLink}
            title="Copy the join link to share with teammates"
          >
            Copy invite link
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={onLeave}
            title="Leave this retro (the board stays open for others)"
          >
            Leave
          </button>
        </div>
      </header>

      <main className="lobby-main">
        <div className="surface lobby-card">
          <div className="lobby-header">
            {isOwner && editing ? (
              <input
                ref={inputRef}
                className="lobby-title-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); commitTitle(); }
                  else if (e.key === 'Escape') { e.preventDefault(); cancelTitle(); }
                }}
                maxLength={80}
                aria-label="Retro title"
              />
            ) : isOwner ? (
              <div
                className="lobby-title-edit"
                role="button"
                tabIndex={0}
                onClick={startEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit(); }
                }}
                title="Click to rename this retro"
              >
                <h1 className="lobby-title">{title}</h1>
                <Icon name="edit" size={13} className="lobby-title-pencil" />
              </div>
            ) : (
              <h1 className="lobby-title">{title}</h1>
            )}
            <div className="lobby-subtitle">
              {fmt.name} · {fmt.columns.length} columns · <span className="mono">{code}</span>
            </div>
          </div>

          <div className="lobby-rule" />

          <section className="lobby-section">
            <div className="lobby-section-label">{peopleLabel}</div>
            <div className="lobby-chips">
              {participants.map((p) => (
                <span key={p.id} className="lobby-chip">
                  <span
                    className="lobby-chip-dot"
                    style={{ background: p.color }}
                    aria-hidden="true"
                  />
                  <span className="lobby-chip-name">{p.name}</span>
                  {p.isHost && (
                    <span className="lobby-chip-host" title="Host">host</span>
                  )}
                </span>
              ))}
            </div>
            {alone && isOwner && (
              <p className="lobby-empty">
                Just you so far. Share the room link to bring the team in.
              </p>
            )}
          </section>

          <div className="lobby-rule" />

          <div className="lobby-actions">
            {isOwner ? (
              <>
                <button
                  type="button"
                  className="btn accent lg block"
                  onClick={onStart}
                  title="Begin the session for everyone in the room"
                >
                  Start retro
                </button>
                <button
                  type="button"
                  className="btn lg block"
                  onClick={onCopyInviteLink}
                  title="Copy the room link to share with teammates"
                >
                  <Icon name="copy" size={15} />
                  Copy room link
                </button>
              </>
            ) : (
              <div className="lobby-waiting">
                <span className="lobby-waiting-dot" aria-hidden="true" />
                <span>{waitingCopy}</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
