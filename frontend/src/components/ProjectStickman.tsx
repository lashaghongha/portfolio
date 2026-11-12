import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Project } from '../lib/api';
import { resolveAsset } from '../lib/admin-api';
import Stickman from './Stickman';

const SPEED = 115; // px per second
const MIN_WALK = 650;
const MAX_WALK = 3500;
const PEEK_MS = 2000;
const POST_PEEK = 300;
const PAUSE_MS = 400;
const CRACK_MS = 520;
const FALL_MS = 1100;
const RESPAWN_PAUSE = 550;
const LEG_STEP = '0.42s';
const FEET = 13; // px below the grid top where the figure stands

// Concrete debris that bursts out when the ground gives way.
const CHUNKS = [
  { x: -15, y: 0, s: 8, cx: '-32px', cr: '-175deg', d: '0ms' },
  { x: 8, y: -1, s: 10, cx: '28px', cr: '195deg', d: '30ms' },
  { x: -3, y: 3, s: 6, cx: '-9px', cr: '130deg', d: '55ms' },
  { x: 14, y: 1, s: 8, cx: '15px', cr: '-120deg', d: '20ms' },
  { x: 1, y: 4, s: 5, cx: '3px', cr: '95deg', d: '80ms' },
];

interface Spot {
  center: number;
  left: number;
  right: number;
  peek: string | null;
  id: number;
}

// Ambient stick figure: walks the project cards, lays a ladder over the gaps,
// bends over to peek into a card (its cover crossfades to a real screenshot),
// and at the end the concrete cracks and he tumbles through before respawning.
export default function ProjectStickman({
  gridRef,
  projects,
  onPeek,
}: {
  gridRef: React.RefObject<HTMLDivElement | null>;
  projects: Project[];
  onPeek: (id: number | null) => void;
}) {
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState(false);
  const [spots, setSpots] = useState<Spot[]>([]);

  const [x, setX] = useState(0);
  const [moveDur, setMoveDur] = useState(0);
  const [facing, setFacing] = useState(1);
  const [moving, setMoving] = useState(false);
  const [looking, setLooking] = useState(false);
  const [ladder, setLadder] = useState<{ left: number; width: number } | null>(null);
  const [cracking, setCracking] = useState(false);
  const [falling, setFalling] = useState(false);

  // Enable only on wide layouts (cards sit in a row) and when motion is allowed.
  useEffect(() => {
    const wide = window.matchMedia('(min-width: 1024px)');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setEnabled(wide.matches && !motion.matches);
    update();
    wide.addEventListener('change', update);
    motion.addEventListener('change', update);
    return () => {
      wide.removeEventListener('change', update);
      motion.removeEventListener('change', update);
    };
  }, []);

  // Measure card positions relative to the grid; re-measure on resize.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || !enabled) return;

    function measure() {
      const host = gridRef.current;
      if (!host) return;
      const base = host.getBoundingClientRect();
      const cards = Array.from(host.querySelectorAll<HTMLElement>('[data-project-card]'));
      setSpots(
        cards.map((el, i) => {
          const r = el.getBoundingClientRect();
          const left = r.left - base.left;
          const right = r.right - base.left;
          return {
            left,
            right,
            center: left + r.width / 2,
            peek: resolveAsset(projects[i]?.gallery?.[0]?.url ?? null),
            id: projects[i]?.id ?? -1,
          };
        }),
      );
    }

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(grid);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [gridRef, enabled, projects]);

  // Pause the loop when the section is off-screen.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0.1 });
    io.observe(grid);
    return () => io.disconnect();
  }, [gridRef]);

  // Walk / peek / fall state machine.
  useEffect(() => {
    if (!enabled || !active || spots.length < 2) return;

    const n = spots.length;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const pos = { x: spots[0].center, idx: 0 };
    setMoveDur(0);
    setX(spots[0].center);
    setFacing(1);

    const wait = (fn: () => void, ms: number) => {
      timer = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
    };

    function walkTo(i: number, onArrive: () => void) {
      const target = spots[i];
      const dist = Math.abs(target.center - pos.x);
      const dur = Math.min(MAX_WALK, Math.max(MIN_WALK, (dist / SPEED) * 1000));
      if (dist > 3) setFacing(target.center >= pos.x ? 1 : -1);

      if (Math.abs(i - pos.idx) === 1) {
        const a = spots[Math.min(i, pos.idx)];
        const b = spots[Math.max(i, pos.idx)];
        const width = b.left - a.right;
        setLadder(width > 4 ? { left: a.right, width } : null);
      } else {
        setLadder(null);
      }

      setLooking(false);
      setMoving(true);
      setMoveDur(dur);
      setX(target.center);
      pos.x = target.center;
      pos.idx = i;
      wait(onArrive, dur);
    }

    function peek(i: number, onDone: () => void) {
      setMoving(false);
      setLadder(null);
      if (spots[i].peek) {
        setLooking(true);
        onPeek(spots[i].id);
        wait(() => {
          setLooking(false);
          onPeek(null);
          wait(onDone, POST_PEEK);
        }, PEEK_MS);
      } else {
        wait(onDone, PAUSE_MS);
      }
    }

    function fall(onDone: () => void) {
      setMoving(false);
      setLooking(false);
      setLadder(null);
      onPeek(null);
      setCracking(true);
      wait(() => {
        setCracking(false);
        setFalling(true);
        wait(() => {
          setFalling(false);
          // teleport off-screen left (instant) so he walks back in
          setMoveDur(0);
          setX(-50);
          setFacing(1);
          pos.x = -50;
          pos.idx = 0;
          wait(onDone, RESPAWN_PAUSE);
        }, FALL_MS);
      }, CRACK_MS);
    }

    function runFrom(i: number) {
      walkTo(i, () =>
        peek(i, () => {
          if (i < n - 1) runFrom(i + 1);
          else fall(() => runFrom(0));
        }),
      );
    }

    runFrom(0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      onPeek(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, active, spots]);

  if (!enabled || spots.length < 2) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-20" style={{ ['--sm-step']: LEG_STEP } as CSSProperties}>
      {ladder && !cracking && !falling && (
        <div className="absolute left-0 top-0" style={{ left: ladder.left, width: ladder.width, transform: `translateY(${FEET - 5}px)` }}>
          <Ladder width={ladder.width} />
        </div>
      )}

      {(cracking || falling) && (
        <div className="absolute left-0 top-0" style={{ transform: `translateX(${x}px)` }}>
          <svg
            className="sm-crack"
            width="48"
            height="16"
            viewBox="0 0 48 16"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="1"
            strokeLinecap="round"
            style={{ position: 'absolute', left: -24, top: FEET - 2 }}
          >
            <path d="M24 2 L19 8 L21 15" />
            <path d="M24 2 L29 7 L27 14" />
            <path d="M24 2 L15 6 L9 12" />
            <path d="M24 2 L33 5 L40 11" />
            <path d="M24 2 L24 10" />
          </svg>
          {falling &&
            CHUNKS.map((c, i) => (
              <span
                key={i}
                className="sm-chunk absolute rounded-[1px] bg-slate-400"
                style={
                  {
                    left: c.x,
                    top: FEET + c.y,
                    width: c.s,
                    height: c.s,
                    ['--cx']: c.cx,
                    ['--cr']: c.cr,
                    animationDelay: c.d,
                  } as CSSProperties
                }
              />
            ))}
        </div>
      )}

      <div className="absolute left-0 top-0" style={{ transform: `translateX(${x}px)`, transition: `transform ${moveDur}ms ease-in-out` }}>
        <div style={{ transform: `translate(-50%, calc(-100% + ${FEET}px)) scaleX(${facing})` }}>
          <div className={`${cracking ? 'sm-shake' : ''} ${falling ? 'sm-fall' : ''}`}>
            <Stickman moving={moving} looking={looking} size={44} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Ladder({ width }: { width: number }) {
  const rungs = Math.max(2, Math.round(width / 7));
  return (
    <svg width={width} height="10" viewBox={`0 0 ${width} 10`} fill="none" stroke="#9d7bff" strokeWidth="1.4" strokeLinecap="round">
      <line x1="0" y1="2.5" x2={width} y2="2.5" />
      <line x1="0" y1="7.5" x2={width} y2="7.5" />
      {Array.from({ length: rungs + 1 }).map((_, i) => {
        const rx = (width / rungs) * i;
        return <line key={i} x1={rx} y1="2" x2={rx} y2="8" />;
      })}
    </svg>
  );
}
