/**
 * @fileoverview StatCard - Reusable metric display card component.
 *
 * A generic card component for displaying key statistics at a glance.
 * Used in the dashboard's top row to show summary metrics like:
 * - Renewable Share %
 * - Current Demand
 * - Total Generation
 * - Net Export
 *
 * Designed to be flexible via props for label, value, unit, color, and subtext.
 */
import styles from './StatCard.module.css';

/**
 * Props for the StatCard component.
 * @interface StatCardProps
 */
interface StatCardProps {
  /** The metric label displayed above the value (e.g., "Renewable Share") */
  label: string;
  /** The primary value to display (e.g., "72" or "8,450") */
  value: string;
  /** The unit of measurement (e.g., "%", "MW") */
  unit: string;
  /** Optional secondary text below the value for context */
  subtext?: string;
  /** Optional color for the value text (defaults to accent blue) */
  color?: string;
}

/**
 * StatCard component for displaying a single metric.
 *
 * Renders a card with:
 * - Label at the top
 * - Large value with unit
 * - Optional subtext for additional context
 *
 * @param {StatCardProps} props - Component props
 * @returns {JSX.Element} The rendered stat card
 *
 * @example
 * <StatCard
 *   label="Renewable Share"
 *   value="72"
 *   unit="%"
 *   color="#10b981"
 *   subtext="5,230 MW clean"
 * />
 */
export const StatCard = ({
  label,
  value,
  unit,
  subtext,
  color = '#3b82f6'
}: StatCardProps) => {
  return (
    <div className={styles.card}>
      {/* Metric label */}
      <p className={styles.label}>{label}</p>

      {/* Value and unit display */}
      <div className={styles.valueRow}>
        <span className={styles.value} style={{ color }}>{value}</span>
        <span className={styles.unit}>{unit}</span>
      </div>

      {/* Optional contextual subtext */}
      {subtext && <p className={styles.subtext}>{subtext}</p>}
    </div>
  );
};
