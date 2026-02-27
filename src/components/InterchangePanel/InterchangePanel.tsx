/**
 * @fileoverview InterchangePanel - Regional Power Imports/Exports visualization.
 *
 * What it shows:
 * - Net power flow (MW) to/from neighboring grid regions
 * - Breakdown by interconnection (CAISO, PACE, etc.)
 * - Positive = exporting power, Negative = importing power
 *
 * Why this metric matters:
 * - Power grids are interconnected — no region operates in isolation
 * - Net exports indicate surplus clean generation (common in hydro-rich PNW)
 * - Net imports mean relying on neighbors, potentially with higher emissions
 * - Shows how regional grids balance each other in real-time
 *
 * Data source: EIA API (electricity/rto/interchange-data)
 */
import { InterchangePoint } from '../../data/simulation';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import styles from './InterchangePanel.module.css';

/**
 * Props for the InterchangePanel component.
 * @interface InterchangePanelProps
 */
interface InterchangePanelProps {
  /** Array of historical interchange data for the sparkline */
  data: InterchangePoint[];
  /** The current/latest interchange data point */
  current: InterchangePoint;
}

/**
 * InterchangePanel component displaying regional power flows.
 *
 * Features:
 * - Large net export/import value with color coding
 * - Sparkline showing recent trend
 * - Breakdown by neighboring region with bar charts
 * - Direction indicators (arrows) for flow direction
 *
 * Color coding:
 * - Green: Exporting power (positive value)
 * - Red: Importing power (negative value)
 *
 * @param {InterchangePanelProps} props - Component props
 * @returns {JSX.Element} The rendered interchange panel
 */
export const InterchangePanel = ({ data, current }: InterchangePanelProps) => {
  /**
   * Sparkline data preparation:
   * - Take last 72 points (~6 hours at 5-min intervals)
   * - Downsample by taking every 2nd point
   * - Transform to format expected by Recharts
   */
  const sparkData = data
    .slice(-72)
    .filter((_, i) => i % 2 === 0)
    .map(p => ({ v: p.netExport }));

  /**
   * Determine if we're currently exporting (positive) or importing (negative).
   * This affects colors and labels throughout the component.
   */
  const isExporting = current.netExport > 0;

  return (
    <div className={styles.card}>
      {/* Header with title and region identifier */}
      <div className={styles.header}>
        <h3 className={styles.title}>Interchange</h3>
        <span className={styles.region}>BPAT Region</span>
      </div>

      {/* Main display: Net export value and sparkline */}
      <div className={styles.main}>
        <div>
          {/* Large net export/import value */}
          <div className={styles.valueRow}>
            <span
              className={styles.value}
              style={{ color: isExporting ? '#10b981' : '#ef4444' }}
            >
              {/* Show + sign for exports, - is implicit */}
              {isExporting ? '+' : ''}{current.netExport.toLocaleString()}
            </span>
            <span className={styles.unit}>MW</span>
          </div>

          {/* Export/Import badge with direction arrow */}
          <div className={styles.badge}>
            {/* Status badge */}
            <span
              className={`${styles.badgeLabel} ${isExporting ? styles.badgeExport : styles.badgeImport}`}
            >
              {isExporting ? 'NET EXPORT' : 'NET IMPORT'}
            </span>

            {/* Direction arrow SVG */}
            <svg
              width="16"
              height="12"
              viewBox="0 0 16 12"
              style={{ marginLeft: '0.25rem' }}
            >
              {/* Arrow points right for export, left for import */}
              <path
                d={isExporting
                  ? "M2 6 L14 6 M10 2 L14 6 L10 10"  // Right arrow
                  : "M14 6 L2 6 M6 2 L2 6 L6 10"     // Left arrow
                }
                stroke={isExporting ? '#10b981' : '#ef4444'}
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Sparkline showing recent trend */}
        <div className={styles.sparkline}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              {/* Gradient fill definition */}
              <defs>
                <linearGradient id="ixGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>

              {/* Y-axis with auto-scaling domain */}
              <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />

              {/* Area chart for the sparkline */}
              <Area
                type="monotone"
                dataKey="v"
                stroke="#10b981"
                fill="url(#ixGrad)"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Flow breakdown by neighboring region */}
      <div className={styles.flows}>
        {/* Sort by absolute value (largest flows first) */}
        {current.flows
          .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
          .map(f => {
            /**
             * Calculate bar width as percentage of the largest flow.
             * This normalizes all bars relative to the maximum.
             */
            const maxVal = Math.max(...current.flows.map(fl => Math.abs(fl.value)));
            const pct = (Math.abs(f.value) / maxVal) * 100;

            /** Is this flow an export (positive) or import (negative)? */
            const exp = f.value > 0;

            return (
              <div key={f.region} className={styles.flowRow}>
                {/* Region identifier (e.g., "CAISO", "PACE") */}
                <span className={styles.flowRegion}>{f.region}</span>

                {/* Progress bar showing relative magnitude */}
                <div className={styles.flowBar}>
                  <div
                    className={styles.flowProgress}
                    style={{
                      width: `${pct}%`,
                      background: exp ? '#10b981' : '#ef4444'
                    }}
                  />
                </div>

                {/* Flow value with sign */}
                <span
                  className={styles.flowValue}
                  style={{ color: exp ? '#10b981' : '#ef4444' }}
                >
                  {exp ? '+' : ''}{f.value}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
};
