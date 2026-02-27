import Header from './components/Header';
import CarbonGauge from './components/CarbonGauge';
import GenerationMix from './components/GenerationMix';
import DemandChart from './components/DemandChart';
import InterchangePanel from './components/InterchangePanel';
import StatCard from './components/StatCard';
import { useGridData } from './data/useGridData';
import styles from './App.module.css';

export default function App () {
  const { data, lastUpdated, isLive, isDemo } = useGridData();

  if (!data) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingText}>Initializing grid telemetry...</div>
      </div>
    );
  }

  const { latest, timeSeries } = data;

  const renewablePct = Math.round(((latest.generation.hydro + latest.generation.wind + latest.generation.solar) / latest.generation.total) * 100);
  const demandDelta = latest.demand.demand - latest.demand.forecast;
  const deltaLabel = demandDelta > 0 ? `+${demandDelta} vs forecast` : `${demandDelta} vs forecast`;

  return (
    <div className={styles.app}>
      <Header lastUpdated={lastUpdated} isDemo={isDemo} isLive={isLive} />

      <main className={styles.main}>
        {/* Top stat cards */}
        <div className={styles.statsGrid}>
          <StatCard
            label="Renewable Share"
            value={`${renewablePct}`}
            unit="%"
            color="#10b981"
            subtext={`${(latest.generation.hydro + latest.generation.wind + latest.generation.solar).toLocaleString()} MW clean`}
          />
          <StatCard
            label="Current Demand"
            value={latest.demand.demand.toLocaleString()}
            unit="MW"
            subtext={deltaLabel}
          />
          <StatCard
            label="Total Generation"
            value={latest.generation.total.toLocaleString()}
            unit="MW"
            color="#60a5fa"
            subtext={`Hydro: ${latest.generation.hydro.toLocaleString()} MW`}
          />
          <StatCard
            label="Net Export"
            value={latest.interchange.netExport > 0 ? `+${latest.interchange.netExport}` : `${latest.interchange.netExport}`}
            unit="MW"
            color={latest.interchange.netExport > 0 ? '#10b981' : '#ef4444'}
            subtext="To neighboring regions"
          />
        </div>

        {/* Main grid */}
        <div className={styles.mainGrid}>
          <div className={styles.leftColumn}>
            <CarbonGauge current={latest.carbon} history={timeSeries.carbon} />
            <InterchangePanel data={timeSeries.interchange} current={latest.interchange} />
          </div>

          <div className={styles.rightColumn}>
            <GenerationMix data={timeSeries.generation} current={latest.generation} />
            <DemandChart data={timeSeries.demand} current={latest.demand} />
          </div>
        </div>
      </main>
    </div>
  );
}
