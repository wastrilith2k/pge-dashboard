/**
 * @fileoverview Arc gauge SVG component.
 *
 * A semi-circular gauge visualization used for displaying
 * carbon intensity values on a 0-100 scale.
 *
 * Features:
 * - Background arc showing full range
 * - Colored value arc showing current position
 * - Central numeric display
 * - Status label
 * - Scale labels at endpoints (0 and 100)
 */

/**
 * Props for the ArcGauge component.
 * @interface ArcGaugeProps
 */
interface ArcGaugeProps {
  /** Current value to display (0-100) */
  value: number;
  /** Color for the value arc and text */
  color: string;
  /** Status label displayed below the value (e.g., "Clean", "Dirty") */
  label: string;
  /** Optional CSS class name for the SVG element */
  className?: string;
}

// ─────────────────────────────────────────────────────────────────
// Arc Gauge Configuration Constants
// ─────────────────────────────────────────────────────────────────

/** Radius of the arc in SVG units */
const RADIUS = 80;

/** Stroke width of the arc */
const STROKE_WIDTH = 10;

/** Center X coordinate */
const CX = 100;

/** Center Y coordinate */
const CY = 95;

/** Starting angle in degrees (bottom-left) */
const START_ANGLE = -210;

/** Ending angle in degrees (bottom-right) */
const END_ANGLE = 30;

/** Total angle span of the arc */
const TOTAL_ANGLE = END_ANGLE - START_ANGLE;

/**
 * Converts polar coordinates (angle) to cartesian (x, y).
 *
 * @param {number} angle - Angle in degrees
 * @returns {{ x: number, y: number }} Cartesian coordinates
 */
const polarToCartesian = (angle: number) => {
  const rad = (angle * Math.PI) / 180;
  return {
    x: CX + RADIUS * Math.cos(rad),
    y: CY + RADIUS * Math.sin(rad)
  };
};

/**
 * Creates an SVG arc path string.
 *
 * @param {number} start - Start angle in degrees
 * @param {number} end - End angle in degrees
 * @returns {string} SVG path d attribute value
 */
const describeArc = (start: number, end: number) => {
  const s = polarToCartesian(start);
  const e = polarToCartesian(end);
  // Use large arc flag when span > 180 degrees
  const largeArc = end - start > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${e.x} ${e.y}`;
};

/**
 * Arc gauge component displaying a value on a semi-circular scale.
 *
 * @param {ArcGaugeProps} props - Component props
 * @returns {JSX.Element} The rendered SVG gauge
 */
export const ArcGauge = ({ value, color, label, className }: ArcGaugeProps) => {
  /** Calculate the angle for the current value */
  const valueAngle = START_ANGLE + (value / 100) * TOTAL_ANGLE;

  return (
    <svg viewBox="0 0 200 130" className={className}>
      {/* Background arc (full range, dim color) */}
      <path
        d={describeArc(START_ANGLE, END_ANGLE)}
        fill="none"
        stroke="rgba(148,163,184,0.1)"
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
      />

      {/* Value arc (0 to current value, colored) */}
      <path
        d={describeArc(START_ANGLE, valueAngle)}
        fill="none"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        style={{
          filter: `drop-shadow(0 0 6px ${color}40)`,
          transition: 'stroke 0.5s'
        }}
      />

      {/* Central value display */}
      <text
        x={CX}
        y={CY - 8}
        textAnchor="middle"
        fill={color}
        fontSize="36"
        fontFamily="var(--font-mono)"
        fontWeight="600"
        style={{ transition: 'fill 0.5s' }}
      >
        {value}
      </text>

      {/* Status label below value */}
      <text
        x={CX}
        y={CY + 14}
        textAnchor="middle"
        fill="rgba(148,163,184,0.6)"
        fontSize="11"
        fontFamily="var(--font-sans)"
      >
        {label}
      </text>

      {/* Scale labels at arc endpoints */}
      <text
        x="18"
        y="120"
        fill="rgba(148,163,184,0.4)"
        fontSize="9"
        fontFamily="var(--font-mono)"
      >
        0
      </text>
      <text
        x="175"
        y="120"
        fill="rgba(148,163,184,0.4)"
        fontSize="9"
        fontFamily="var(--font-mono)"
      >
        100
      </text>
    </svg>
  );
};
