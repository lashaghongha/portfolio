import { useEffect, useRef } from 'react';

/**
 * A soft violet "flashlight" that follows the cursor and lights up the
 * background. Purely decorative: fixed, behind content, and non-interactive.
 * Updates a DOM element's CSS variables via rAF so it never re-renders React.
 */
export default function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    if (reduceMotion || !finePointer) return;

    let frame = 0;
    let pending: { x: number; y: number } | null = null;

    const flush = () => {
      frame = 0;
      if (!pending) return;
      el.style.setProperty('--glow-x', `${pending.x}px`);
      el.style.setProperty('--glow-y', `${pending.y}px`);
      el.style.opacity = '1';
    };

    const onMove = (e: PointerEvent) => {
      pending = { x: e.clientX, y: e.clientY };
      if (!frame) frame = requestAnimationFrame(flush);
    };

    const onLeave = () => {
      el.style.opacity = '0';
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);

    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 opacity-0 transition-opacity duration-500"
      style={{
        background:
          'radial-gradient(560px circle at var(--glow-x, 50%) var(--glow-y, 50%), rgba(124, 92, 255, 0.20), rgba(124, 92, 255, 0.05) 42%, transparent 68%)',
      }}
    />
  );
}
