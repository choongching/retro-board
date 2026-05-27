import { useMemo } from 'react';
import { FORMATS } from '../data';
import type { FormatId } from '../data';
import { RetroWordmark } from './RetroWordmark';

type Participant = { id: string; name: string; color: string; isHost?: boolean };

type Props = {
  code: string;
  title: string;
  format: FormatId;
  participants: Participant[];
  isOwner: boolean;
  onStart: () => void;
  onCopyInviteLink: () => void;
  onLeave: () => void;
};

export function LobbyScreen({
  code, title, format, participants, isOwner,
  onStart, onCopyInviteLink, onLeave,
}: Props) {
  const fmt = FORMATS[format];
  const hostName = useMemo(
    () => participants.find((p) => p.isHost)?.name ?? null,
    [participants],
  );

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
            className="btn lobby-invite"
            onClick={onCopyInviteLink}
            title="Copy the join link to share with teammates"
          >
            Copy invite link
          </button>
          <button
            type="button"
            className="btn ghost lobby-leave"
            onClick={onLeave}
            title="Leave this retro (the board stays open for others)"
          >
            Leave
          </button>
        </div>
      </header>

      <main className="lobby-main">
        <div className="lobby-card">
          <div className="lobby-header">
            <h1 className="lobby-title">{title}</h1>
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
                Just you so far. Share the invite link above to bring the team in.
              </p>
            )}
          </section>

          <div className="lobby-rule" />

          <div className="lobby-actions">
            {isOwner ? (
              <button
                type="button"
                className="btn accent lobby-primary"
                onClick={onStart}
                title="Begin the session for everyone in the room"
              >
                Start retro
              </button>
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
