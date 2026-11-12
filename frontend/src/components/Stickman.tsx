// A tiny stick figure with googly eyes. `moving` runs a bouncy walk; `looking`
// bends him over for a double-take; `panic` makes him flail and shout "!".
// Animation CSS lives in index.css.
export default function Stickman({
  moving,
  looking,
  panic,
  size = 40,
}: {
  moving: boolean;
  looking: boolean;
  panic: boolean;
  size?: number;
}) {
  return (
    <svg
      width={(size * 24) / 40}
      height={size}
      viewBox="0 0 24 40"
      className={`${moving ? 'sm-moving' : ''} ${looking ? 'sm-look' : ''} ${panic ? 'sm-panic' : ''}`}
      style={{ overflow: 'visible' }}
      fill="none"
      stroke="white"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* back leg */}
      <line className="sm-limb sm-leg-1" x1="12" y1="24" x2="8" y2="37" />

      {/* upper body bends at the hip (12,24) */}
      <g className="sm-upper">
        <line className="sm-limb sm-arm-1" x1="12" y1="14" x2="7" y2="21" />
        <line x1="12" y1="11" x2="12" y2="24" />
        <g className="sm-head">
          <circle cx="12" cy="7" r="4.2" fill="#9d7bff" stroke="#9d7bff" />
          <circle className="sm-eye" cx="10.3" cy="6.4" r="1.15" fill="#fff" stroke="none" />
          <circle className="sm-eye" cx="13.7" cy="6.4" r="1.15" fill="#fff" stroke="none" />
        </g>
        <line className="sm-limb sm-arm-2" x1="12" y1="14" x2="17" y2="21" />
      </g>

      {/* front leg */}
      <line className="sm-limb sm-leg-2" x1="12" y1="24" x2="16" y2="37" />

      {/* panic shout */}
      {panic && (
        <text className="sm-emote" x="18" y="2" textAnchor="middle" fontSize="11" fontWeight="900" fill="#fbbf24" stroke="none">
          !
        </text>
      )}
    </svg>
  );
}
