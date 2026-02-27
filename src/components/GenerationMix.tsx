/**
 * GenerationMix - Power Generation by Fuel Type
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
import { GenerationPoint } from '../data/simulation';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './GenerationMix.module.css';

const FUELS = [
  { key: 'hydro', label: 'Hydro', color: '#3b82f6' },
  { key: 'wind', label: 'Wind', color: '#06b6d4' },
  { key: 'gas', label: 'Gas', color: '#f97316' },
  { key: 'solar', label: 'Solar', color: '#eab308' },
  { key: 'other', label: 'Other', color: '#6b7280' },
] as const;

interface Props {
  data: GenerationPoint[];
  current: GenerationPoint;
}

function formatTime (ts: string) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function CustomTooltip ({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTime}>{formatTime(label)}</p>
      {payload.reverse().map((p: any) => (
        <div key={p.dataKey} className={styles.tooltipRow}>
          <span className={styles.tooltipDot} style={{ background: p.color }} />
          <span className={styles.tooltipLabel}>{p.dataKey}</span>
          <span className={styles.tooltipValue}>{p.value.toLocaleString()} MW</span>
        </div>
      ))}
    </div>
  );
}

export default function GenerationMix ({ data, current }: Props) {
  // Downsample to every 3rd point for smoother rendering
  const chartData = data.filter((_, i) => i % 3 === 0);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Generation Mix</h3>
        <span className={styles.total}>{current.total.toLocaleString()} MW total</span>
      </div>

      {/* Current mix bar */}
      <div className={styles.mixBar}>
        {FUELS.map(f => {
          const pct = (current[f.key] / current.total) * 100;
          return pct > 0 ? (
            <div key={f.key} style={{ width: `${pct}%`, background: f.color }} title={`${f.label}: ${Math.round(pct)}%`} />
          ) : null;
        })}
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        {FUELS.map(f => (
          <div key={f.key} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: f.color }} />
            <span className={styles.legendLabel}>{f.label}</span>
            <span className={styles.legendPct}>{Math.round((current[f.key] / current.total) * 100)}%</span>
          </div>
        ))}
      </div>

      {/* Stacked area chart */}
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              {FUELS.map(f => (
                <linearGradient key={f.key} id={`gen-${f.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={f.color} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={f.color} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>
            <XAxis dataKey="timestamp" tickFormatter={formatTime} tick={{ fill: 'rgba(148,163,184,0.4)', fontSize: 10 }}
              axisLine={false} tickLine={false} interval={Math.floor(chartData.length / 6)} />
            <YAxis tick={{ fill: 'rgba(148,163,184,0.4)', fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`} width={35} />
            <Tooltip content={<CustomTooltip />} />
            {FUELS.map(f => (
              <Area key={f.key} type="monotone" dataKey={f.key} stackId="gen" stroke={f.color} fill={`url(#gen-${f.key})`}
                strokeWidth={0} isAnimationActive={false} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
