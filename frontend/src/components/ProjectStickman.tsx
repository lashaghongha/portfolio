import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import type { Project } from '../lib/api';
import { resolveAsset } from '../lib/admin-api';
import Stickman from './Stickman';

const SPEED = 115; // px per second
const MIN_WALK = 650;
const MAX_WALK = 3500;
const PEEK_MS = 2000;
const POST_PEEK = 300;
const PAUSE_MS = 400;
const TEETER_MS = 650;
const FALL_MS = 1100;
const CLIMB_MS = 1700;
const RESPAWN_PAUSE = 450;
const LEG_STEP = '0.42s';
const FEET = 13; // px below the grid top where the figure stands

interface Spot {
  center: number;
  left: number;
  right: number;
  peek: string | null;
  id: number;
}

interface Gap {
  left: number;
  width: number;
}

// Ambient stick figure: walks the project cards, lays a ladder "bridge" over the
// gaps, bends over a card to peek (its cover crossfades to a real screenshot),
// then steps back onto the bridge — which collapses, dropping him through the gap.
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
  const [ladder, setLadder] = useState<Gap | null>(null);
  const [collapse, setCollapse] = useState<Gap | null>(null);
  const [teetering, setTeetering] = useState(false);
  const [falling, setFalling] = useState(false);
  const [climbing, setClimbing] = useState(false);
  const [scared, setScared] = useState(false);
  const pokeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function poke(e: PointerEvent) {
    e.stopPropagation();
    setScared(false);
    // next frame re-enables so the squash-hop replays on every poke
    requestAnimationFrame(() => setScared(true));
    if (pokeTimer.current) clearTimeout(pokeTimer.current);
    pokeTimer.current = setTimeout(() => setScared(false), 620);
  }

  useEffect(() => () => {
    if (pokeTimer.current) clearTimeout(pokeTimer.current);
  }, []);

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

  // Walk / peek / bridge-collapse state machine.
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

    function gapBetween(i: number, j: number): Gap {
      const a = spots[Math.min(i, j)];
      const b = spots[Math.max(i, j)];
      return { left: a.right, width: Math.max(8, b.left - a.right) };
    }

    function moveTo(targetX: number, dur: number) {
      setMoving(true);
      setMoveDur(dur);
      setX(targetX);
      pos.x = targetX;
    }

    function walkTo(i: number, onArrive: () => void) {
      const target = spots[i];
      const dist = Math.abs(target.center - pos.x);
      const dur = Math.min(MAX_WALK, Math.max(MIN_WALK, (dist / SPEED) * 1000));
      if (dist > 3) setFacing(target.center >= pos.x ? 1 : -1);
      setLadder(Math.abs(i - pos.idx) === 1 ? gapBetween(i, pos.idx) : null);
      setLooking(false);
      moveTo(target.center, dur);
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

    // Step back onto the last bridge; it gives way and he drops through the gap.
    function collapseBridge(onDone: () => void) {
      const gap = gapBetween(n - 2, n - 1);
      const mid = gap.left + gap.width / 2;
      const dist = Math.abs(mid - pos.x);
      const dur = Math.min(MAX_WALK, Math.max(MIN_WALK, (dist / SPEED) * 1000));

      setFacing(mid >= pos.x ? 1 : -1);
      setLooking(false);
      setLadder(gap);
      moveTo(mid, dur);
      pos.idx = -1;

      wait(() => {
        setMoving(false);
        setLadder(null);
        setCollapse(gap);
        setTeetering(true);
        wait(() => {
          setTeetering(false);
          setFalling(true);
          onPeek(null);
          wait(() => {
            // ...then claw back up the wall and carry on.
            setFalling(false);
            setCollapse(null);
            setFacing(1);
            setClimbing(true);
            wait(() => {
              setClimbing(false);
              pos.x = mid;
              pos.idx = n - 1; // avoid a bogus gap on the next walk
              wait(onDone, RESPAWN_PAUSE);
            }, CLIMB_MS);
          }, FALL_MS);
        }, TEETER_MS);
      }, dur);
    }

    // Ping-pong across the cards so every gap gets a ladder in both directions.
    // At the right end the bridge collapses; after climbing back he heads left.
    let dir = 1;
    function cycle() {
      const i = pos.idx;
      peek(i, () => {
        if (dir === 1 && i === n - 1) {
          collapseBridge(() => {
            dir = -1;
            walkTo(n - 2, cycle);
          });
          return;
        }
        let nextI = i + dir;
        if (nextI < 0) {
          dir = 1;
          nextI = Math.min(1, n - 1);
        } else if (nextI > n - 1) {
          dir = -1;
          nextI = Math.max(n - 2, 0);
        }
        walkTo(nextI, cycle);
      });
    }

    walkTo(0, cycle);

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
      {ladder && !collapse && (
        <div className="absolute left-0 top-0" style={{ left: ladder.left, width: ladder.width, transform: `translateY(${FEET - 5}px)` }}>
          <Ladder width={ladder.width} />
        </div>
      )}

      {collapse && (
        <>
          <div
            className={teetering || falling ? 'sm-bridge-l' : ''}
            style={{ position: 'absolute', left: collapse.left, top: FEET - 5, width: collapse.width / 2, transformOrigin: 'left center' }}
          >
            <Ladder width={collapse.width / 2} />
          </div>
          <div
            className={teetering || falling ? 'sm-bridge-r' : ''}
            style={{
              position: 'absolute',
              left: collapse.left + collapse.width / 2,
              top: FEET - 5,
              width: collapse.width / 2,
              transformOrigin: 'right center',
            }}
          >
            <Ladder width={collapse.width / 2} />
          </div>
        </>
      )}

      <div className="absolute left-0 top-0" style={{ transform: `translateX(${x}px)`, transition: `transform ${moveDur}ms ease-in-out` }}>
        <div style={{ transform: `translate(-50%, calc(-100% + ${FEET}px)) scaleX(${facing})` }}>
          <div className={`${teetering ? 'sm-shake' : ''} ${falling ? 'sm-fall' : ''} ${climbing ? 'sm-climb-up' : ''}`}>
            <div
              className="sm-hit pointer-events-auto relative cursor-pointer"
              onPointerDown={poke}
              role="button"
              aria-label="Poke the stickman"
            >
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: 42, height: 56 }} aria-hidden />
              <div className={scared ? 'sm-boing' : ''}>
                <Stickman
                  moving={moving}
                  looking={looking}
                  panic={teetering || falling}
                  climbing={climbing}
                  startled={scared}
                  size={44}
                />
              </div>
            </div>
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
