/**
 * @fileoverview Header component for the PNW Grid Monitor dashboard.
 *
 * Displays the application branding, current time, and status indicators
 * including demo mode badge and live data indicator.
 */
import { LightningBoltIcon } from '../SVGs/LightningBoltIcon';
import styles from './Header.module.css';

/**
 * Props for the Header component.
 * @interface HeaderProps
 */
interface HeaderProps {
  /** The timestamp of the last data update */
  lastUpdated: Date;
  /** Whether the app is running in demo mode with simulated data */
  isDemo: boolean;
  /** Whether we have a live connection to the data source */
  isLive: boolean;
}

/**
 * Header component displaying app branding and status.
 *
 * Shows the PNW Grid Monitor logo, title, and subtitle on the left.
 * On the right, displays optional demo mode badge and live status
 * with the current time.
 *
 * @param {HeaderProps} props - Component props
 * @returns {JSX.Element} The rendered header
 *
 * @example
 * <Header
 *   lastUpdated={new Date()}
 *   isDemo={true}
 *   isLive={true}
 * />
 */
export const Header = ({ lastUpdated, isDemo, isLive }: HeaderProps) => {
  /**
   * Format the time for display (HH:MM:SS format).
   * Uses the browser's locale for formatting.
   */
  const timeStr = lastUpdated.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <header className={styles.header}>
      {/* Left side: Logo and branding */}
      <div className={styles.brand}>
        {/* Lightning bolt icon representing power/energy */}
        <div className={styles.logo}>
          <LightningBoltIcon />
        </div>
        <div>
          <h1 className={styles.title}>PNW Grid Monitor</h1>
          <p className={styles.subtitle}>Bonneville Power Administration (BPAT)</p>
        </div>
      </div>

      {/* Right side: Status indicators */}
      <div className={styles.status}>
        {/* Demo mode badge - only shown when using simulated data */}
        {isDemo && (
          <span className={styles.demoBadge}>DEMO MODE</span>
        )}

        {/* Live indicator and current time */}
        <div className={styles.time}>
          {/* Pulsing green dot when live */}
          {isLive && <span className={styles.liveDot} />}
          <span className={styles.timeText}>{timeStr}</span>
        </div>
      </div>
    </header>
  );
};
