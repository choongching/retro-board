import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

type Props = {
  open: boolean;
  /** Called for backdrop clicks AND for Esc (unless onEscape is set). */
  onClose: () => void;
  /** Override Esc behavior. Useful when a modal has internal navigable state. */
  onEscape?: () => void;
  /** CSS width string applied to the surface. */
  width?: string;
  /** Extra inline styles merged onto the surface (padding, max-height, layout, etc.). */
  surfaceStyle?: CSSProperties;
  children: ReactNode;
};

const DEFAULT_WIDTH = 'min(440px, calc(100vw - 48px))';
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export function Modal({
  open, onClose, onEscape, width = DEFAULT_WIDTH, surfaceStyle, children,
}: Props) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      (onEscape ?? onClose)();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose, onEscape]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'grid', placeItems: 'center',
            padding: 24,
          }}
        >
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2, ease: EASE }}
            style={{
              background: 'var(--color-surface)',
              borderRadius: 14,
              boxShadow: 'var(--shadow-lg)',
              width,
              position: 'relative',
              ...surfaceStyle,
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
