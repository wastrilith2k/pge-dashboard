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
import { ArcGauge } from '../SVGs/ArcGauge';
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
        {/* Arc Gauge component */}
        <ArcGauge
          value={displayValue}
          color={color}
          label={label}
          className={styles.gauge}
        />

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
