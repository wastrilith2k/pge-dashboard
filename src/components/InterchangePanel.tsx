/**
 * InterchangePanel - Regional Power Imports/Exports
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
import { InterchangePoint } from '../data/simulation';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import styles from './InterchangePanel.module.css';

interface Props {
  data: InterchangePoint[];
  current: InterchangePoint;
}

export default function InterchangePanel ({ data, current }: Props) {
  const sparkData = data.slice(-72).filter((_, i) => i % 2 === 0).map(p => ({ v: p.netExport }));
  const isExporting = current.netExport > 0;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Interchange</h3>
        <span className={styles.region}>BPAT Region</span>
      </div>

      {/* Net export big number */}
      <div className={styles.main}>
        <div>
          <div className={styles.valueRow}>
            <span className={styles.value} style={{ color: isExporting ? '#10b981' : '#ef4444' }}>
              {isExporting ? '+' : ''}{current.netExport.toLocaleString()}
            </span>
            <span className={styles.unit}>MW</span>
          </div>
          <div className={styles.badge}>
            <span className={`${styles.badgeLabel} ${isExporting ? styles.badgeExport : styles.badgeImport}`}>
              {isExporting ? 'NET EXPORT' : 'NET IMPORT'}
            </span>
            <svg width="16" height="12" viewBox="0 0 16 12" style={{ marginLeft: '0.25rem' }}>
              <path d={isExporting ? "M2 6 L14 6 M10 2 L14 6 L10 10" : "M14 6 L2 6 M6 2 L2 6 L6 10"}
                stroke={isExporting ? '#10b981' : '#ef4444'} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Sparkline */}
        <div className={styles.sparkline}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              <defs>
                <linearGradient id="ixGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />
              <Area type="monotone" dataKey="v" stroke="#10b981" fill="url(#ixGrad)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Flow breakdown */}
      <div className={styles.flows}>
        {current.flows.sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).map(f => {
          const maxVal = Math.max(...current.flows.map(fl => Math.abs(fl.value)));
          const pct = (Math.abs(f.value) / maxVal) * 100;
          const exp = f.value > 0;
          return (
            <div key={f.region} className={styles.flowRow}>
              <span className={styles.flowRegion}>{f.region}</span>
              <div className={styles.flowBar}>
                <div className={styles.flowProgress}
                  style={{ width: `${pct}%`, background: exp ? '#10b981' : '#ef4444' }} />
              </div>
              <span className={styles.flowValue} style={{ color: exp ? '#10b981' : '#ef4444' }}>
                {exp ? '+' : ''}{f.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
