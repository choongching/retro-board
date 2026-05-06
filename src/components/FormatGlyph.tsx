import type { FormatId } from '../data';

export function FormatGlyph({ format }: { format: FormatId }) {
  const sty: React.CSSProperties = {
    width: 36, height: 36, borderRadius: 8, display: 'grid', placeItems: 'center', flexShrink: 0,
  };
  if (format === 'classic') {
    return (
      <div style={{ ...sty, background: 'color-mix(in oklch, #3D8B7A 14%, var(--color-bg))' }}>
        <svg width="20" height="20" viewBox="0 0 20 20"><path fill="none" stroke="#3D8B7A" strokeWidth="1.6" strokeLinecap="round" d="M3 7l3 3 6-6"/><path stroke="#3D8B7A" strokeWidth="1.6" strokeLinecap="round" d="M3 14h14M3 17h9"/></svg>
      </div>
    );
  }
  if (format === 'ssc') {
    return (
      <div style={{ ...sty, background: 'color-mix(in oklch, #7C6FB0 14%, var(--color-bg))' }}>
        <svg width="22" height="22" viewBox="0 0 22 22">
          <circle cx="6" cy="11" r="3" fill="#3D8B7A"/>
          <rect x="9.5" y="8" width="6" height="6" fill="#C77B58"/>
          <polygon points="18,8 21,11 18,14 15,11" fill="#7C6FB0"/>
        </svg>
      </div>
    );
  }
  if (format === 'sailboat') {
    return (
      <div style={{ ...sty, background: 'color-mix(in oklch, #5C8FB8 14%, var(--color-bg))' }}>
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path d="M12 4 L12 14" stroke="#29261b" strokeWidth="1.4"/>
          <path d="M12 5 L18 13 L12 13 Z" fill="#D4A93C"/>
          <path d="M5 16 L19 16 L17 19 L7 19 Z" fill="#3D8B7A"/>
          <path d="M3 20 Q 6 18 12 20 T 21 20" stroke="#5C8FB8" strokeWidth="1.2" fill="none"/>
        </svg>
      </div>
    );
  }
  return <div style={sty} />;
}
