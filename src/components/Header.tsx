import styles from './Header.module.css';

interface Props {
  lastUpdated: Date;
  isDemo: boolean;
  isLive: boolean;
}

export default function Header ({ lastUpdated, isDemo, isLive }: Props) {
  const timeStr = lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        {/* Logo/Icon */}
        <div className={styles.logo}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <div>
          <h1 className={styles.title}>PNW Grid Monitor</h1>
          <p className={styles.subtitle}>Bonneville Power Administration (BPAT)</p>
        </div>
      </div>

      <div className={styles.status}>
        {isDemo && (
          <span className={styles.demoBadge}>DEMO MODE</span>
        )}
        <div className={styles.time}>
          {isLive && <span className={styles.liveDot} />}
          <span className={styles.timeText}>{timeStr}</span>
        </div>
      </div>
    </header>
  );
}
