import { useEffect, useRef } from 'react';

/**
 * Mounts inside the live board branch and publishes the local cursor
 * position over the realtime channel. Lives in its own component so its
 * effect runs after [data-board-surface] is actually in the DOM (a
 * transition from lobby → live can otherwise leave the listener detached).
 */
export function CursorPublisher({
  sendCursor,
}: {
  sendCursor: (x: number, y: number) => void;
}) {
  const lastSentRef = useRef(0);
  const pendingRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const surface = document.querySelector<HTMLElement>('[data-board-surface]');
    if (!surface) return;

    const flush = () => {
      rafRef.current = null;
      const p = pendingRef.current;
      if (!p) return;
      const now = Date.now();
      if (now - lastSentRef.current < 100) {
        rafRef.current = requestAnimationFrame(flush);
        return;
      }
      lastSentRef.current = now;
      pendingRef.current = null;
      sendCursor(p.x, p.y);
    };

    const handler = (e: MouseEvent) => {
      if (document.activeElement?.tagName === 'TEXTAREA') return;
      const rect = surface.getBoundingClientRect();
      pendingRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(flush);
    };

    surface.addEventListener('mousemove', handler);
    return () => {
      surface.removeEventListener('mousemove', handler);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [sendCursor]);

  return null;
}
