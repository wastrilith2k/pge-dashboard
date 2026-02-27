/**
 * DemandChart - System Demand vs Forecast
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
import { DemandPoint } from '../data/simulation';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import styles from './DemandChart.module.css';

interface Props {
  data: DemandPoint[];
  current: DemandPoint;
}

function formatTime (ts: string) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function CustomTooltip ({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTime}>{formatTime(label)}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className={styles.tooltipRow}>
          <span className={styles.tooltipDot} style={{ background: p.color }} />
          <span className={styles.tooltipLabel}>{p.dataKey === 'demand' ? 'Actual' : 'Forecast'}</span>
          <span className={styles.tooltipValue}>{p.value.toLocaleString()} MW</span>
        </div>
      ))}
    </div>
  );
}

export default function DemandChart ({ data, current }: Props) {
  const chartData = data.filter((_, i) => i % 3 === 0);
  const peak = Math.max(...data.map(d => d.demand));
  const low = Math.min(...data.map(d => d.demand));

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>System Demand</h3>
        <div className={styles.nowLabel}>
          Now: <span className={styles.nowValue}>{current.demand.toLocaleString()} MW</span>
        </div>
      </div>

      {/* Stats row */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Peak </span>
          <span className={styles.statPeak}>{peak.toLocaleString()}</span>
          <span className={styles.statLabel}> MW</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Low </span>
          <span className={styles.statLow}>{low.toLocaleString()}</span>
          <span className={styles.statLabel}> MW</span>
        </div>
        <div className={styles.legend}>
          <span className={styles.legendActual} />
          <span className={styles.legendText}>Actual</span>
          <span className={styles.legendForecast} />
          <span className={styles.legendText}>Forecast</span>
        </div>
      </div>

      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis dataKey="timestamp" tickFormatter={formatTime} tick={{ fill: 'rgba(148,163,184,0.4)', fontSize: 10 }}
              axisLine={false} tickLine={false} interval={Math.floor(chartData.length / 6)} />
            <YAxis tick={{ fill: 'rgba(148,163,184,0.4)', fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`} width={35} domain={['dataMin - 200', 'dataMax + 200']} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="forecast" stroke="rgba(148,163,184,0.3)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="demand" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
