/**
 * StatCard - Reusable metric display card
 *
 * A generic component for displaying key statistics at a glance.
 * Used in the top row to show: Renewable Share %, Current Demand,
 * Total Generation, and Net Export values.
 *
 * Props allow customization of label, value, unit, color, and subtext
 * to make it flexible for different metrics.
 */
import styles from './StatCard.module.css';

interface Props {
  label: string;
  value: string;
  unit: string;
  subtext?: string;
  color?: string;
}

export default function StatCard ({ label, value, unit, subtext, color = '#3b82f6' }: Props) {
  return (
    <div className={styles.card}>
      <p className={styles.label}>{label}</p>
      <div className={styles.valueRow}>
        <span className={styles.value} style={{ color }}>{value}</span>
        <span className={styles.unit}>{unit}</span>
      </div>
      {subtext && <p className={styles.subtext}>{subtext}</p>}
    </div>
  );
}
