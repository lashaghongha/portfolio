import { useCallback, useRef, useState } from 'react';

/**
 * Reveal-on-scroll hook. Returns a callback `ref` and a `visible` flag that
 * flips to true once the element enters the viewport, so callers can trigger an
 * entry animation.
 *
 * Uses a **callback ref** (not `useRef` + `useEffect`) on purpose: components
 * that gate rendering on async data (`if (!items.length) return null`) mount
 * their ref'd node *after* the first render. A `useEffect` with a static dep
 * array would read `ref.current === null` on mount and never re-run once the
 * node finally appears, leaving the section stuck invisible. A callback ref
 * fires exactly when React attaches/detaches the node, so the observer is set
 * up whenever the element actually mounts.
 *
 * Fail-safe by design: the element must never get stuck invisible. It reveals
 * when the element is in view OR already scrolled past (above the viewport,
 * e.g. after browser scroll restoration), and falls back to visible when
 * IntersectionObserver is unavailable or the user prefers reduced motion.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.15) {
  const [visible, setVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (node: T | null) => {
      // Detach any observer from a previously attached node.
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (!node) return;

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduceMotion || typeof IntersectionObserver === 'undefined') {
        setVisible(true);
        return;
      }

      // Already in or above the viewport at mount → reveal immediately so a
      // section can never stay hidden when the page loads mid-scroll.
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        setVisible(true);
        return;
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
            setVisible(true);
            observer.disconnect();
            observerRef.current = null;
          }
        },
        { threshold, rootMargin: '0px 0px -8% 0px' },
      );

      observer.observe(node);
      observerRef.current = observer;
    },
    [threshold],
  );

  return { ref, visible };
}
