/**
 * @fileoverview GenerationMix - Power Generation by Fuel Type visualization.
 *
 * What it shows:
 * - Stacked area chart of power generation by source (hydro, wind, solar, gas, other)
 * - Horizontal bar showing current percentage breakdown
 * - Total generation in megawatts
 *
 * Why this metric matters:
 * - Shows WHERE the electricity comes from at any moment
 * - Reveals daily patterns: solar peaks midday, wind varies, hydro is baseload
 * - The Pacific Northwest (BPAT) is ~70% hydro, making it one of the cleanest grids
 * - Helps understand carbon intensity — more renewables = lower emissions
 *
 * Data source: EIA API (electricity/rto/fuel-type-data)
 */
import { GenerationPoint } from '../../data/simulation';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import styles from './GenerationMix.module.css';

/**
 * Fuel type definitions with display properties.
 *
 * Each fuel type has:
 * - key: The data field name
 * - label: Human-readable name for display
 * - color: Hex color for chart visualization
 *
 * Order matters for stacking in the area chart (bottom to top).
 */
const FUELS = [
  { key: 'hydro', label: 'Hydro', color: '#3b82f6' },   // Blue - dominant in PNW
  { key: 'wind', label: 'Wind', color: '#06b6d4' },     // Cyan - variable renewable
  { key: 'gas', label: 'Gas', color: '#f97316' },       // Orange - peaker plants
  { key: 'solar', label: 'Solar', color: '#eab308' },   // Yellow - daytime only
  { key: 'other', label: 'Other', color: '#6b7280' },   // Gray - misc sources
] as const;

/**
 * Props for the GenerationMix component.
 * @interface GenerationMixProps
 */
interface GenerationMixProps {
  /** Array of historical generation data points for the chart */
  data: GenerationPoint[];
  /** The current/latest generation data point */
  current: GenerationPoint;
}

/**
 * Formats an ISO timestamp string to a human-readable time (HH:MM).
 *
 * @param {string} ts - ISO timestamp string
 * @returns {string} Formatted time string (e.g., "14:30")
 */
const formatTime = (ts: string): string => {
  return new Date(ts).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Custom tooltip component for the generation chart.
 *
 * Displays the timestamp and MW values for each fuel type
 * at the hovered data point. Shows fuels in reverse order
 * (top to bottom matches visual stack order).
 *
 * @param {object} props - Recharts tooltip props
 * @returns {JSX.Element | null} Tooltip content or null
 */
const CustomTooltip = ({ active, payload, label }: any) => {
  // Don't render if not hovering or no data
  if (!active || !payload?.length) return null;

  return (
    <div className={styles.tooltip}>
      {/* Timestamp header */}
      <p className={styles.tooltipTime}>{formatTime(label)}</p>

      {/* Value rows for each fuel type (reversed for visual order) */}
      {payload.reverse().map((p: any) => (
        <div key={p.dataKey} className={styles.tooltipRow}>
          {/* Color indicator dot */}
          <span
            className={styles.tooltipDot}
            style={{ background: p.color }}
          />
          {/* Fuel type label */}
          <span className={styles.tooltipLabel}>{p.dataKey}</span>
          {/* Value with units */}
          <span className={styles.tooltipValue}>
            {p.value.toLocaleString()} MW
          </span>
        </div>
      ))}
    </div>
  );
};

/**
 * GenerationMix component displaying power generation by fuel type.
 *
 * Features:
 * - Stacked area chart showing generation over time
 * - Horizontal bar showing current percentage breakdown
 * - Legend with fuel types and current percentages
 * - Gradient fills for visual depth
 *
 * The chart downsamples data to every 3rd point for smoother rendering.
 *
 * @param {GenerationMixProps} props - Component props
 * @returns {JSX.Element} The rendered generation mix chart
 */
export const GenerationMix = ({ data, current }: GenerationMixProps) => {
  /**
   * Downsample the data to every 3rd point.
   * This improves rendering performance while preserving the trend.
   */
  const chartData = data.filter((_, i) => i % 3 === 0);

  return (
    <div className={styles.card}>
      {/* Header with title and total generation */}
      <div className={styles.header}>
        <h3 className={styles.title}>Generation Mix</h3>
        <span className={styles.total}>
          {current.total.toLocaleString()} MW total
        </span>
      </div>

      {/* Current mix bar - horizontal stacked percentage bar */}
      <div className={styles.mixBar}>
        {FUELS.map(f => {
          // Calculate percentage of total for this fuel type
          const pct = (current[f.key] / current.total) * 100;

          // Only render if this fuel has a non-zero contribution
          return pct > 0 ? (
            <div
              key={f.key}
              style={{ width: `${pct}%`, background: f.color }}
              title={`${f.label}: ${Math.round(pct)}%`}
            />
          ) : null;
        })}
      </div>

      {/* Legend showing fuel types and current percentages */}
      <div className={styles.legend}>
        {FUELS.map(f => (
          <div key={f.key} className={styles.legendItem}>
            {/* Color dot */}
            <span
              className={styles.legendDot}
              style={{ background: f.color }}
            />
            {/* Fuel label */}
            <span className={styles.legendLabel}>{f.label}</span>
            {/* Current percentage */}
            <span className={styles.legendPct}>
              {Math.round((current[f.key] / current.total) * 100)}%
            </span>
          </div>
        ))}
      </div>

      {/* Stacked area chart */}
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            {/* SVG gradient definitions for each fuel type */}
            <defs>
              {FUELS.map(f => (
                <linearGradient
                  key={f.key}
                  id={`gen-${f.key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={f.color} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={f.color} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>

            {/* X-axis: Time labels */}
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTime}
              tick={{ fill: 'rgba(148,163,184,0.4)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={Math.floor(chartData.length / 6)}
            />

            {/* Y-axis: MW values (formatted as "X.Xk") */}
            <YAxis
              tick={{ fill: 'rgba(148,163,184,0.4)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`}
              width={35}
            />

            {/* Custom tooltip on hover */}
            <Tooltip content={<CustomTooltip />} />

            {/* Stacked areas for each fuel type */}
            {FUELS.map(f => (
              <Area
                key={f.key}
                type="monotone"
                dataKey={f.key}
                stackId="gen"  // Same stackId means they stack
                stroke={f.color}
                fill={`url(#gen-${f.key})`}  // Use gradient fill
                strokeWidth={0}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
