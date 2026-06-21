import { useEffect } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';

// A vote count that rolls to its new value with a spring. Writes straight to the
// text node via a MotionValue, so high-frequency ticks don't re-render the card.
export function AnimatedCount({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(value);
  const rounded = useTransform(mv, (v) => Math.round(v));

  useEffect(() => {
    if (reduce) { mv.set(value); return; }
    const controls = animate(mv, value, { type: 'spring', stiffness: 200, damping: 22 });
    return () => controls.stop();
  }, [value, mv, reduce]);

  return <motion.span>{rounded}</motion.span>;
}
