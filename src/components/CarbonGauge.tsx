/**
 * CarbonGauge - Grid Carbon Intensity (MOER Index)
 *
 * What it shows:
 * - Arc gauge displaying current marginal emissions rate (0-100 scale)
 * - Color-coded: green (clean) → yellow (moderate) → red (dirty)
 * - 3-hour trend sparkline to show recent changes
 *
 * Why this metric matters:
 * - MOER (Marginal Operating Emissions Rate) indicates the carbon cost of
 *   consuming one additional unit of electricity RIGHT NOW
 * - Useful for carbon-aware computing: shift flexible loads to cleaner times
 * - The PNW often has very low carbon intensity due to hydropower
 *
 * Data source: WattTime API (signal-index endpoint, co2_moer signal type)
 */
import { useEffect, useRef, useState } from 'react';
import { CarbonPoint } from '../data/simulation';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import styles from './CarbonGauge.module.css';

function getColor (value: number): string {
  if (value < 30) return '#10b981';
  if (value < 60) return '#f59e0b';
  return '#ef4444';
}

function getLabel (value: number): string {
  if (value < 20) return 'Very Clean';
  if (value < 40) return 'Clean';
  if (value < 60) return 'Moderate';
  if (value < 80) return 'Dirty';
  return 'Very Dirty';
}

interface Props {
  current: CarbonPoint;
  history: CarbonPoint[];
}

export default function CarbonGauge ({ current, history }: Props) {
  const [displayValue, setDisplayValue] = useState(current.value);
  const prevRef = useRef(current.value);

  useEffect(() => {
    const start = prevRef.current;
    const end = current.value;
    prevRef.current = end;
    const duration = 800;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [current.value]);

  const color = getColor(displayValue);
  const label = getLabel(displayValue);

  // Arc gauge SVG
  const radius = 80;
  const strokeWidth = 10;
  const cx = 100;
  const cy = 95;
  const startAngle = -210;
  const endAngle = 30;
  const totalAngle = endAngle - startAngle;
  const valueAngle = startAngle + (displayValue / 100) * totalAngle;

  const polarToCartesian = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const describeArc = (start: number, end: number) => {
    const s = polarToCartesian(start);
    const e = polarToCartesian(end);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  // Sparkline data: last 36 points (3 hours)
  const sparkData = history.slice(-36).map(p => ({ v: p.value }));

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Carbon Intensity</h3>
        <span className={styles.moerLabel}>MOER Index</span>
      </div>

      <div className={styles.content}>
        {/* Arc Gauge */}
        <svg viewBox="0 0 200 130" className={styles.gauge}>
          {/* Background arc */}
          <path d={describeArc(startAngle, endAngle)} fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth={strokeWidth} strokeLinecap="round" />
          {/* Value arc */}
          <path d={describeArc(startAngle, valueAngle)} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${color}40)`, transition: 'stroke 0.5s' }} />
          {/* Value text */}
          <text x={cx} y={cy - 8} textAnchor="middle" fill={color} fontSize="36" fontFamily="var(--font-mono)" fontWeight="600"
            style={{ transition: 'fill 0.5s' }}>
            {displayValue}
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(148,163,184,0.6)" fontSize="11" fontFamily="var(--font-sans)">
            {label}
          </text>
          {/* Scale labels */}
          <text x="18" y="120" fill="rgba(148,163,184,0.4)" fontSize="9" fontFamily="var(--font-mono)">0</text>
          <text x="175" y="120" fill="rgba(148,163,184,0.4)" fontSize="9" fontFamily="var(--font-mono)">100</text>
        </svg>

        {/* Sparkline */}
        <div className={styles.sparkline}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              <defs>
                <linearGradient id="carbonGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis domain={[0, 100]} hide />
              <Area type="monotone" dataKey="v" stroke={color} fill="url(#carbonGrad)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
          <p className={styles.trendLabel}>3h trend</p>
        </div>
      </div>
    </div>
  );
}
