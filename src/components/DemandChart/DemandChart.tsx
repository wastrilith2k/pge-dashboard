/**
 * @fileoverview DemandChart - System Demand vs Forecast visualization.
 *
 * What it shows:
 * - Real-time electricity demand (load) in megawatts
 * - Forecasted demand as a dashed line for comparison
 * - Peak and low values for the displayed time window
 *
 * Why this metric matters:
 * - Demand must always equal supply on the grid — this is the core constraint
 * - The gap between actual and forecast shows prediction accuracy
 * - Grid operators use this to plan generation dispatch and imports/exports
 *
 * Data source: EIA API (electricity/rto/region-data)
 */
import { DemandPoint } from '../../data/simulation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import styles from './DemandChart.module.css';

/**
 * Props for the DemandChart component.
 * @interface DemandChartProps
 */
interface DemandChartProps {
  /** Array of historical demand data points for the chart */
  data: DemandPoint[];
  /** The current/latest demand data point */
  current: DemandPoint;
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
 * Custom tooltip component for the demand chart.
 *
 * Displays the timestamp and values for both actual demand
 * and forecast at the hovered data point.
 *
 * @param {object} props - Recharts tooltip props
 * @param {boolean} props.active - Whether tooltip is active
 * @param {Array} props.payload - Data at the hovered point
 * @param {string} props.label - X-axis value (timestamp)
 * @returns {JSX.Element | null} Tooltip content or null
 */
const CustomTooltip = ({ active, payload, label }: any) => {
  // Don't render if not hovering or no data
  if (!active || !payload?.length) return null;

  return (
    <div className={styles.tooltip}>
      {/* Timestamp header */}
      <p className={styles.tooltipTime}>{formatTime(label)}</p>

      {/* Value rows for each data series */}
      {payload.map((p: any) => (
        <div key={p.dataKey} className={styles.tooltipRow}>
          {/* Color indicator dot */}
          <span
            className={styles.tooltipDot}
            style={{ background: p.color }}
          />
          {/* Label (Actual or Forecast) */}
          <span className={styles.tooltipLabel}>
            {p.dataKey === 'demand' ? 'Actual' : 'Forecast'}
          </span>
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
 * DemandChart component displaying system demand over time.
 *
 * Features:
 * - Line chart comparing actual demand vs forecast
 * - Current value display
 * - Peak and low indicators
 * - Interactive tooltip on hover
 *
 * The chart downsamples data to every 3rd point for smoother rendering
 * while maintaining the overall trend visibility.
 *
 * @param {DemandChartProps} props - Component props
 * @returns {JSX.Element} The rendered demand chart
 */
export const DemandChart = ({ data, current }: DemandChartProps) => {
  /**
   * Downsample the data to every 3rd point.
   * This improves rendering performance while preserving the trend.
   */
  const chartData = data.filter((_, i) => i % 3 === 0);

  /**
   * Calculate peak demand value for the time window.
   * Used to highlight maximum load period.
   */
  const peak = Math.max(...data.map(d => d.demand));

  /**
   * Calculate minimum demand value for the time window.
   * Used to highlight minimum load period.
   */
  const low = Math.min(...data.map(d => d.demand));

  return (
    <div className={styles.card}>
      {/* Header with title and current value */}
      <div className={styles.header}>
        <h3 className={styles.title}>System Demand</h3>
        <div className={styles.nowLabel}>
          Now: <span className={styles.nowValue}>
            {current.demand.toLocaleString()} MW
          </span>
        </div>
      </div>

      {/* Stats row showing peak, low, and legend */}
      <div className={styles.stats}>
        {/* Peak demand indicator */}
        <div className={styles.stat}>
          <span className={styles.statLabel}>Peak </span>
          <span className={styles.statPeak}>{peak.toLocaleString()}</span>
          <span className={styles.statLabel}> MW</span>
        </div>

        {/* Low demand indicator */}
        <div className={styles.stat}>
          <span className={styles.statLabel}>Low </span>
          <span className={styles.statLow}>{low.toLocaleString()}</span>
          <span className={styles.statLabel}> MW</span>
        </div>

        {/* Chart legend */}
        <div className={styles.legend}>
          <span className={styles.legendActual} />
          <span className={styles.legendText}>Actual</span>
          <span className={styles.legendForecast} />
          <span className={styles.legendText}>Forecast</span>
        </div>
      </div>

      {/* Main chart area */}
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
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
              domain={['dataMin - 200', 'dataMax + 200']}
            />

            {/* Custom tooltip on hover */}
            <Tooltip content={<CustomTooltip />} />

            {/* Forecast line (dashed, lighter color) */}
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="rgba(148,163,184,0.3)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              isAnimationActive={false}
            />

            {/* Actual demand line (solid, primary color) */}
            <Line
              type="monotone"
              dataKey="demand"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
