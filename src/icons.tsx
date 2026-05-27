// icons.tsx: minimal stroke icons

export type IconName =
  | 'plus' | 'x' | 'check'
  | 'chevron-down' | 'chevron-right'
  | 'arrow-left' | 'arrow-up'
  | 'edit' | 'trash'
  | 'eye' | 'eye-off'
  | 'users' | 'key' | 'clock' | 'history'
  | 'play' | 'pause'
  | 'download' | 'copy' | 'share'
  | 'sparkle' | 'shuffle';

export type IconProps = {
  name: IconName | string;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function Icon({ name, size = 14, color = 'currentColor', strokeWidth = 1.6 }: IconProps) {
  const props = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
    style: { display: 'inline-block', flexShrink: 0 },
  };
  switch (name) {
    case 'plus':         return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>;
    case 'x':            return <svg {...props}><path d="M6 6l12 12M18 6L6 18"/></svg>;
    case 'check':        return <svg {...props}><path d="M5 13l4 4L19 7"/></svg>;
    case 'chevron-down': return <svg {...props}><path d="M6 9l6 6 6-6"/></svg>;
    case 'chevron-right':return <svg {...props}><path d="M9 6l6 6-6 6"/></svg>;
    case 'arrow-left':   return <svg {...props}><path d="M19 12H5M11 18l-6-6 6-6"/></svg>;
    case 'arrow-up':     return <svg {...props}><path d="M12 19V5M5 12l7-7 7 7"/></svg>;
    case 'edit':         return <svg {...props}><path d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>;
    case 'trash':        return <svg {...props}><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>;
    case 'eye':          return <svg {...props}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'eye-off':      return <svg {...props}><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M14.12 14.12A3 3 0 119.88 9.88M1 1l22 22"/></svg>;
    case 'users':        return <svg {...props}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>;
    case 'key':          return <svg {...props}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>;
    case 'clock':        return <svg {...props}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>;
    case 'history':      return <svg {...props}><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></svg>;
    case 'play':         return <svg {...props}><path d="M5 3l14 9-14 9V3z" fill={color}/></svg>;
    case 'pause':        return <svg {...props}><rect x="6" y="4" width="4" height="16" fill={color}/><rect x="14" y="4" width="4" height="16" fill={color}/></svg>;
    case 'download':     return <svg {...props}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>;
    case 'copy':         return <svg {...props}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>;
    case 'share':        return <svg {...props}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>;
    case 'sparkle':      return <svg {...props}><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/></svg>;
    case 'shuffle':      return <svg {...props}><path d="M16 3h5v5M4 20l17-17M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>;
    default:             return <svg {...props}><circle cx="12" cy="12" r="9"/></svg>;
  }
}
