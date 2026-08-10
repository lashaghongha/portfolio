import { useEffect, useRef, useState } from 'react';

/**
 * Reveal-on-scroll hook. Returns a ref and a `visible` flag that flips to true
 * once the element enters the viewport, so callers can trigger an entry
 * animation.
 *
 * Fail-safe by design: the element must never get stuck invisible. It reveals
 * when the element is in view OR already scrolled past (above the viewport,
 * e.g. after browser scroll restoration), and falls back to visible when
 * IntersectionObserver is unavailable or the user prefers reduced motion.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
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
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}
