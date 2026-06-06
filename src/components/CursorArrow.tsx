// CursorArrow: the single source for the user-cursor shape. Shared by the live
// presence cursors on the board and the drifting cursors on the landing stage,
// so a "someone's cursor" always looks the same across the app. It is filled
// with the user's colour and outlined in white for contrast, so it lives here
// rather than in the monochrome icon set.
export function CursorArrow({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" style={{ display: 'block' }} aria-hidden>
      <path
        d="M2 2 L2 14 L6 11 L8.5 16 L10.5 15 L8 10 L13 10 Z"
        fill={color}
        stroke="#fff"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
