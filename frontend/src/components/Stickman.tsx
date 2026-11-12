// A tiny stick figure. `moving` runs the walk cycle; `looking` bends the upper
// body over to peer downward. Walk/bend CSS lives in index.css.
export default function Stickman({
  moving,
  looking,
  size = 40,
}: {
  moving: boolean;
  looking: boolean;
  size?: number;
}) {
  return (
    <svg
      width={(size * 24) / 40}
      height={size}
      viewBox="0 0 24 40"
      className={`${moving ? 'sm-moving' : ''} ${looking ? 'sm-look' : ''}`}
      fill="none"
      stroke="white"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* back leg (behind the body) */}
      <line className="sm-limb sm-leg-1" x1="12" y1="24" x2="8" y2="37" />

      {/* upper body bends at the hip (12,24) when looking */}
      <g className="sm-upper">
        <line className="sm-limb sm-arm-1" x1="12" y1="14" x2="7" y2="21" />
        <line x1="12" y1="11" x2="12" y2="24" />
        <circle className="sm-head" cx="12" cy="7" r="4" fill="#9d7bff" stroke="#9d7bff" />
        <line className="sm-limb sm-arm-2" x1="12" y1="14" x2="17" y2="21" />
      </g>

      {/* front leg */}
      <line className="sm-limb sm-leg-2" x1="12" y1="24" x2="16" y2="37" />
    </svg>
  );
}
