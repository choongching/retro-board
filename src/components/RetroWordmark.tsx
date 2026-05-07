// Minimal wordmark — type only, no gradient
export function RetroWordmark({ size = 'sm', tooltip }: {
  size?: 'sm' | 'lg';
  tooltip?: string;
}) {
  return (
    <div
      className={`retro-wordmark${size === 'lg' ? ' retro-wordmark--lg' : ''}`}
      title={tooltip}
      style={tooltip ? { cursor: 'help' } : undefined}>
      <span>JomRetro</span>
      <span className="retro-dot" aria-hidden="true" />
    </div>
  );
}
