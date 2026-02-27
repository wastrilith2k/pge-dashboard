/**
 * @fileoverview CarbonGauge - Grid Carbon Intensity (MOER Index) visualization.
 *
 * What it shows:
 * - Arc gauge displaying current marginal emissions rate (0-100 scale)
 * - Color-coded: green (clean) → yellow (moderate) → red (dirty)
 * - 3-hour trend sparkline to show recent changes
 *
 * Why this metric matters:
 * - MOER (Marginal Operating Emissions Rate) indicates the carbon cost of
 *   consuming one additional unit of electricity RIGHT NOW
 * - Useful for carbon-aware computing: shift flexible loads to cleaner times
 * - The PNW often has very low carbon intensity due to hydropower
 *
 * Data source: WattTime API (signal-index endpoint, co2_moer signal type)
 */
import { useEffect, useRef, useState } from 'react';
import { CarbonPoint } from '../../data/simulation';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import styles from './CarbonGauge.module.css';

/**
 * Returns the appropriate color based on carbon intensity value.
 *
 * Color thresholds:
 * - Green (#10b981): < 30 (very clean grid)
 * - Yellow (#f59e0b): 30-59 (moderate emissions)
 * - Red (#ef4444): >= 60 (high emissions)
 *
 * @param {number} value - Carbon intensity value (0-100)
 * @returns {string} Hex color code
 */
const getColor = (value: number): string => {
  if (value < 30) return '#10b981';  // Green - clean
  if (value < 60) return '#f59e0b';  // Yellow - moderate
  return '#ef4444';                   // Red - dirty
};

/**
 * Returns a human-readable label for the carbon intensity level.
 *
 * @param {number} value - Carbon intensity value (0-100)
 * @returns {string} Human-readable label
 */
const getLabel = (value: number): string => {
  if (value < 20) return 'Very Clean';
  if (value < 40) return 'Clean';
  if (value < 60) return 'Moderate';
  if (value < 80) return 'Dirty';
  return 'Very Dirty';
};

/**
 * Props for the CarbonGauge component.
 * @interface CarbonGaugeProps
 */
interface CarbonGaugeProps {
  /** The current carbon intensity data point */
  current: CarbonPoint;
  /** Array of historical carbon data for the sparkline */
  history: CarbonPoint[];
}

/**
 * CarbonGauge component displaying grid carbon intensity.
 *
 * Features:
 * - Animated arc gauge (0-100 scale)
 * - Color transitions based on intensity level
 * - Sparkline showing 3-hour trend
 * - Smooth value animation using requestAnimationFrame
 *
 * The gauge uses SVG path arcs for the circular display,
 * with eased animation for smooth transitions between values.
 *
 * @param {CarbonGaugeProps} props - Component props
 * @returns {JSX.Element} The rendered carbon gauge
 */
export const CarbonGauge = ({ current, history }: CarbonGaugeProps) => {
  /**
   * Animated display value - smoothly transitions to target.
   * We animate this rather than jumping directly to the new value.
   */
  const [displayValue, setDisplayValue] = useState(current.value);

  /**
   * Ref to track the previous value for animation start point.
   */
  const prevRef = useRef(current.value);

  /**
   * Animate the gauge value when it changes.
   * Uses requestAnimationFrame for smooth 60fps animation.
   * Applies cubic ease-out for natural deceleration.
   */
  useEffect(() => {
    const start = prevRef.current;
    const end = current.value;
    prevRef.current = end;

    // Animation duration in milliseconds
    const duration = 800;
    const startTime = Date.now();

    /**
     * Animation frame callback.
     * Calculates eased progress and updates display value.
     */
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Cubic ease-out: fast start, slow finish
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplayValue(Math.round(start + (end - start) * eased));

      // Continue animation if not complete
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [current.value]);

  // Get color and label based on current animated value
  const color = getColor(displayValue);
  const label = getLabel(displayValue);

  // ─────────────────────────────────────────────────────────────────
  // SVG Arc Gauge Configuration
  // ─────────────────────────────────────────────────────────────────

  /** Radius of the arc in SVG units */
  const radius = 80;

  /** Stroke width of the arc */
  const strokeWidth = 10;

  /** Center X coordinate */
  const cx = 100;

  /** Center Y coordinate */
  const cy = 95;

  /** Starting angle in degrees (bottom-left) */
  const startAngle = -210;

  /** Ending angle in degrees (bottom-right) */
  const endAngle = 30;

  /** Total angle span of the arc */
  const totalAngle = endAngle - startAngle;

  /** Current value angle based on displayValue (0-100 mapped to arc) */
  const valueAngle = startAngle + (displayValue / 100) * totalAngle;

  /**
   * Converts polar coordinates (angle) to cartesian (x, y).
   * Used to calculate arc endpoints.
   *
   * @param {number} angle - Angle in degrees
   * @returns {{ x: number, y: number }} Cartesian coordinates
   */
  const polarToCartesian = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad)
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
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  /**
   * Sparkline data: last 36 points representing ~3 hours of data.
   * Transformed to format expected by Recharts.
   */
  const sparkData = history.slice(-36).map(p => ({ v: p.value }));

  return (
    <div className={styles.card}>
      {/* Header with title and data source label */}
      <div className={styles.header}>
        <h3 className={styles.title}>Carbon Intensity</h3>
        <span className={styles.moerLabel}>MOER Index</span>
      </div>

      <div className={styles.content}>
        {/* Arc Gauge SVG */}
        <svg viewBox="0 0 200 130" className={styles.gauge}>
          {/* Background arc (full range, dim color) */}
          <path
            d={describeArc(startAngle, endAngle)}
            fill="none"
            stroke="rgba(148,163,184,0.1)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Value arc (0 to current value, colored) */}
          <path
            d={describeArc(startAngle, valueAngle)}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 6px ${color}40)`,
              transition: 'stroke 0.5s'
            }}
          />

          {/* Central value display */}
          <text
            x={cx}
            y={cy - 8}
            textAnchor="middle"
            fill={color}
            fontSize="36"
            fontFamily="var(--font-mono)"
            fontWeight="600"
            style={{ transition: 'fill 0.5s' }}
          >
            {displayValue}
          </text>

          {/* Status label below value */}
          <text
            x={cx}
            y={cy + 14}
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

        {/* Sparkline showing 3-hour trend */}
        <div className={styles.sparkline}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              {/* Gradient fill definition */}
              <defs>
                <linearGradient id="carbonGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>

              {/* Hidden Y-axis with fixed domain */}
              <YAxis domain={[0, 100]} hide />

              {/* Area chart for the sparkline */}
              <Area
                type="monotone"
                dataKey="v"
                stroke={color}
                fill="url(#carbonGrad)"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Trend label */}
          <p className={styles.trendLabel}>3h trend</p>
        </div>
      </div>
    </div>
  );
};
