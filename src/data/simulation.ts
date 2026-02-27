// PNW Grid Data Simulation Engine
// Generates realistic Pacific Northwest energy grid data for demo mode

export interface CarbonPoint {
  timestamp: string;
  value: number;
}

export interface GenerationPoint {
  timestamp: string;
  hydro: number;
  wind: number;
  gas: number;
  solar: number;
  other: number;
  total: number;
}

export interface DemandPoint {
  timestamp: string;
  demand: number;
  forecast: number;
}

export interface InterchangeFlow {
  region: string;
  value: number;
}

export interface InterchangePoint {
  timestamp: string;
  netExport: number;
  flows: InterchangeFlow[];
}

export interface GridSnapshot {
  latest: {
    carbon: CarbonPoint;
    generation: GenerationPoint;
    demand: DemandPoint;
    interchange: InterchangePoint;
  };
  timeSeries: {
    carbon: CarbonPoint[];
    generation: GenerationPoint[];
    demand: DemandPoint[];
    interchange: InterchangePoint[];
  };
}

const TOTAL_POINTS = 288; // 24h * 12 points/hour (5-min intervals)

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function smoothNoise(values: number[], window = 3): number[] {
  return values.map((_, i) => {
    let sum = 0, count = 0;
    for (let j = Math.max(0, i - window); j <= Math.min(values.length - 1, i + window); j++) {
      sum += values[j]; count++;
    }
    return sum / count;
  });
}

function hourFactor(hour: number, peak: number, spread: number): number {
  const dist = Math.min(Math.abs(hour - peak), 24 - Math.abs(hour - peak));
  return Math.exp(-(dist * dist) / (2 * spread * spread));
}

export function generateCarbonSignal(now = new Date()): CarbonPoint[] {
  const rng = seededRandom(now.getDate() * 1000 + now.getMonth() + 1);
  const points: CarbonPoint[] = [];

  for (let i = 0; i < TOTAL_POINTS; i++) {
    const t = new Date(now.getTime() - (TOTAL_POINTS - 1 - i) * 5 * 60_000);
    const hour = t.getHours() + t.getMinutes() / 60;
    const nightClean = 1 - hourFactor(hour, 3, 4);
    const afternoonDirty = hourFactor(hour, 16, 3);
    const morningBump = hourFactor(hour, 8, 2) * 0.3;
    let signal = 15 + nightClean * 25 + afternoonDirty * 40 + morningBump * 15;
    signal += (rng() - 0.5) * 12;
    points.push({ timestamp: t.toISOString(), value: Math.round(Math.max(0, Math.min(100, signal))) });
  }

  const smoothed = smoothNoise(points.map(p => p.value), 2);
  points.forEach((p, i) => { p.value = Math.round(smoothed[i]); });
  return points;
}

export function generateGenerationMix(now = new Date()): GenerationPoint[] {
  const rng = seededRandom(now.getDate() * 2000 + now.getMonth() + 1);
  const points: GenerationPoint[] = [];

  for (let i = 0; i < TOTAL_POINTS; i++) {
    const t = new Date(now.getTime() - (TOTAL_POINTS - 1 - i) * 5 * 60_000);
    const hour = t.getHours() + t.getMinutes() / 60;
    const hydro = Math.round(Math.max(0, 3800 + hourFactor(hour, 15, 5) * 600 + (rng() - 0.5) * 200));
    const wind = Math.round(Math.max(0, 700 + (1 - hourFactor(hour, 14, 5)) * 500 + (rng() - 0.5) * 250));
    const gas = Math.round(Math.max(0, 200 + hourFactor(hour, 17, 3) * 600 + (rng() - 0.5) * 100));
    const solar = Math.round(Math.max(0, hourFactor(hour, 12, 3) * 250 + (rng() - 0.5) * 50));
    const other = Math.round(Math.max(0, 200 + (rng() - 0.5) * 50));
    points.push({ timestamp: t.toISOString(), hydro, wind, gas, solar, other, total: hydro + wind + gas + solar + other });
  }
  return points;
}

export function generateDemandData(now = new Date()): DemandPoint[] {
  const rng = seededRandom(now.getDate() * 3000 + now.getMonth() + 1);
  const points: DemandPoint[] = [];

  for (let i = 0; i < TOTAL_POINTS; i++) {
    const t = new Date(now.getTime() - (TOTAL_POINTS - 1 - i) * 5 * 60_000);
    const hour = t.getHours() + t.getMinutes() / 60;
    const overnightLow = hourFactor(hour, 4, 3);
    const dayPlateau = hourFactor(hour, 12, 5);
    const eveningPeak = hourFactor(hour, 18, 2);
    let demand = 5500 - overnightLow * 700 + dayPlateau * 300 + eveningPeak * 500 + (rng() - 0.5) * 150;
    let forecast = 5500 - overnightLow * 650 + dayPlateau * 280 + eveningPeak * 480 + (rng() - 0.5) * 80;
    points.push({ timestamp: t.toISOString(), demand: Math.round(demand), forecast: Math.round(forecast) });
  }

  const sd = smoothNoise(points.map(p => p.demand), 3);
  const sf = smoothNoise(points.map(p => p.forecast), 4);
  points.forEach((p, i) => { p.demand = Math.round(sd[i]); p.forecast = Math.round(sf[i]); });
  return points;
}

export function generateInterchangeData(now = new Date()): InterchangePoint[] {
  const rng = seededRandom(now.getDate() * 4000 + now.getMonth() + 1);
  const regions = ['CAISO', 'PACE', 'PACW', 'PSEI', 'CHPD'];
  const points: InterchangePoint[] = [];

  for (let i = 0; i < TOTAL_POINTS; i++) {
    const t = new Date(now.getTime() - (TOTAL_POINTS - 1 - i) * 5 * 60_000);
    const hour = t.getHours() + t.getMinutes() / 60;
    const nightSurplus = 1 - hourFactor(hour, 15, 5);
    const netExport = Math.round(800 + nightSurplus * 800 + (rng() - 0.5) * 300);
    const flows = regions.map(region => ({
      region,
      value: Math.round((netExport / regions.length) * (0.5 + rng()) + (rng() - 0.5) * 100),
    }));
    points.push({ timestamp: t.toISOString(), netExport, flows });
  }
  return points;
}

export function getGridSnapshot(now = new Date()): GridSnapshot {
  const carbon = generateCarbonSignal(now);
  const generation = generateGenerationMix(now);
  const demand = generateDemandData(now);
  const interchange = generateInterchangeData(now);

  return {
    latest: {
      carbon: carbon[carbon.length - 1],
      generation: generation[generation.length - 1],
      demand: demand[demand.length - 1],
      interchange: interchange[interchange.length - 1],
    },
    timeSeries: { carbon, generation, demand, interchange },
  };
}
