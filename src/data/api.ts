// Real API integration for WattTime and EIA
// WattTime proxied through Vite dev server (no CORS headers)
// EIA called directly (supports CORS with access-control-allow-origin: *)

import type {
  CarbonPoint,
  GenerationPoint,
  DemandPoint,
  InterchangePoint,
  GridSnapshot,
} from './simulation';

const WT = '/api/watttime';
const EIA = 'https://api.eia.gov/v2';

let wattTimeToken: string | null = null;
let tokenExpiry = 0;

async function getWattTimeToken(): Promise<string> {
  if (wattTimeToken && Date.now() < tokenExpiry) return wattTimeToken;

  const username = import.meta.env.VITE_WATTTIME_USERNAME;
  const password = import.meta.env.VITE_WATTTIME_PASSWORD;
  const res = await fetch(`${WT}/login`, {
    headers: { Authorization: 'Basic ' + btoa(`${username}:${password}`) },
  });

  if (!res.ok) throw new Error(`WattTime auth failed: ${res.status}`);
  const data = await res.json();
  wattTimeToken = data.token;
  tokenExpiry = Date.now() + 25 * 60_000;
  return wattTimeToken!;
}

async function fetchCarbonSignal(): Promise<CarbonPoint[]> {
  const token = await getWattTimeToken();
  const res = await fetch(
    `${WT}/v3/signal-index?region=PGE&signal_type=co2_moer`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`WattTime signal failed: ${res.status}`);
  const json = await res.json();

  return json.data.map((d: { point_time: string; value: number }) => ({
    timestamp: d.point_time,
    value: Math.round(d.value),
  }));
}

// Build EIA URL with raw brackets (URLSearchParams encodes them, which EIA rejects)
function eiaUrl(path: string, facets: Record<string, string[]>, length = 168): string {
  const key = import.meta.env.VITE_EIA_API_KEY;
  let url = `${EIA}/${path}?api_key=${key}&frequency=hourly&data[0]=value`;
  url += `&sort[0][column]=period&sort[0][direction]=desc&length=${length}`;
  for (const [facet, values] of Object.entries(facets)) {
    for (const v of values) {
      url += `&facets[${facet}][]=${v}`;
    }
  }
  return url;
}

interface EIARow {
  period: string;
  value: string;
  [key: string]: string;
}

async function fetchEIA(path: string, facets: Record<string, string[]>, length = 168): Promise<EIARow[]> {
  const url = eiaUrl(path, facets, length);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`EIA ${path} failed: ${res.status}`);
  const json = await res.json();
  return json.response?.data ?? [];
}

async function fetchGeneration(): Promise<GenerationPoint[]> {
  const rows = await fetchEIA('electricity/rto/fuel-type-data/data/', { respondent: ['BPAT'] }, 200);

  const byPeriod = new Map<string, GenerationPoint>();
  const fuelMap: Record<string, keyof GenerationPoint> = {
    WAT: 'hydro', WND: 'wind', NG: 'gas', SUN: 'solar',
  };

  for (const row of rows) {
    const ts = row.period + ':00:00Z';
    if (!byPeriod.has(ts)) {
      byPeriod.set(ts, { timestamp: ts, hydro: 0, wind: 0, gas: 0, solar: 0, other: 0, total: 0 });
    }
    const pt = byPeriod.get(ts)!;
    const val = Math.max(0, parseInt(row.value) || 0);
    const field = fuelMap[row.fueltype];
    if (field) {
      (pt as any)[field] = val;
    } else {
      pt.other += val;
    }
  }

  const points = [...byPeriod.values()];
  for (const p of points) {
    p.total = p.hydro + p.wind + p.gas + p.solar + p.other;
  }
  points.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return points;
}

async function fetchDemand(): Promise<DemandPoint[]> {
  const rows = await fetchEIA(
    'electricity/rto/region-data/data/',
    { respondent: ['BPAT'], type: ['D', 'DF'] },
    200
  );

  const byPeriod = new Map<string, DemandPoint>();
  for (const row of rows) {
    const ts = row.period + ':00:00Z';
    if (!byPeriod.has(ts)) {
      byPeriod.set(ts, { timestamp: ts, demand: 0, forecast: 0 });
    }
    const pt = byPeriod.get(ts)!;
    const val = parseInt(row.value) || 0;
    if (row.type === 'D') pt.demand = val;
    else if (row.type === 'DF') pt.forecast = val;
  }

  const points = [...byPeriod.values()];
  points.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return points;
}

async function fetchInterchange(): Promise<InterchangePoint[]> {
  const rows = await fetchEIA(
    'electricity/rto/interchange-data/data/',
    { fromba: ['BPAT'] },
    200
  );

  const byPeriod = new Map<string, { netExport: number; flows: Map<string, number> }>();
  for (const row of rows) {
    const ts = row.period + ':00:00Z';
    if (!byPeriod.has(ts)) {
      byPeriod.set(ts, { netExport: 0, flows: new Map() });
    }
    const entry = byPeriod.get(ts)!;
    const val = parseInt(row.value) || 0;
    const region = row.toba;
    entry.flows.set(region, (entry.flows.get(region) || 0) + val);
    entry.netExport += val;
  }

  const points: InterchangePoint[] = [...byPeriod.entries()]
    .map(([ts, entry]) => ({
      timestamp: ts,
      netExport: entry.netExport,
      flows: [...entry.flows.entries()]
        .map(([region, value]) => ({ region, value }))
        .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
        .slice(0, 8),
    }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  return points;
}

export async function fetchLiveData(): Promise<GridSnapshot> {
  const [carbon, generation, demand, interchange] = await Promise.all([
    fetchCarbonSignal(),
    fetchGeneration(),
    fetchDemand(),
    fetchInterchange(),
  ]);

  // WattTime free tier returns only 1 point — pad across the time series
  const carbonSeries = carbon.length > 1 ? carbon : generation.map(g => ({
    timestamp: g.timestamp,
    value: carbon[0]?.value ?? 50,
  }));

  return {
    latest: {
      carbon: carbonSeries[carbonSeries.length - 1] ?? { timestamp: new Date().toISOString(), value: 50 },
      generation: generation[generation.length - 1] ?? { timestamp: '', hydro: 0, wind: 0, gas: 0, solar: 0, other: 0, total: 0 },
      demand: demand[demand.length - 1] ?? { timestamp: '', demand: 0, forecast: 0 },
      interchange: interchange[interchange.length - 1] ?? { timestamp: '', netExport: 0, flows: [] },
    },
    timeSeries: {
      carbon: carbonSeries,
      generation,
      demand,
      interchange,
    },
  };
}
