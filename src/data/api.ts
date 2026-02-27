// Real API integration for WattTime and EIA
// Used when VITE_DEMO_MODE is not 'true'

const WATTTIME_BASE = 'https://api.watttime.org';
const EIA_BASE = 'https://api.eia.gov/v2';

let wattTimeToken: string | null = null;
let tokenExpiry = 0;

async function getWattTimeToken(): Promise<string> {
  if (wattTimeToken && Date.now() < tokenExpiry) return wattTimeToken;

  const username = import.meta.env.VITE_WATTTIME_USERNAME;
  const password = import.meta.env.VITE_WATTTIME_PASSWORD;
  const res = await fetch(`${WATTTIME_BASE}/v3/login`, {
    headers: { Authorization: 'Basic ' + btoa(`${username}:${password}`) },
  });

  if (!res.ok) throw new Error('WattTime auth failed');
  const data = await res.json();
  wattTimeToken = data.token;
  tokenExpiry = Date.now() + 25 * 60_000; // refresh 5 min before expiry
  return wattTimeToken!;
}

export async function fetchCarbonSignal() {
  const token = await getWattTimeToken();
  const res = await fetch(
    `${WATTTIME_BASE}/v3/signal-index?region=BPAT&signal_type=co2_moer`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error('WattTime signal fetch failed');
  return res.json();
}

export async function fetchEIAGeneration() {
  const key = import.meta.env.VITE_EIA_API_KEY;
  const url = `${EIA_BASE}/electricity/rto/fuel-type-data/data/?api_key=${key}&frequency=hourly&data[0]=value&facets[respondent][]=BPAT&sort[0][column]=period&sort[0][direction]=desc&length=24`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('EIA generation fetch failed');
  return res.json();
}

export async function fetchEIADemand() {
  const key = import.meta.env.VITE_EIA_API_KEY;
  const url = `${EIA_BASE}/electricity/rto/region-data/data/?api_key=${key}&frequency=hourly&data[0]=value&facets[respondent][]=BPAT&facets[type][]=D&sort[0][column]=period&sort[0][direction]=desc&length=24`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('EIA demand fetch failed');
  return res.json();
}

export async function fetchEIAInterchange() {
  const key = import.meta.env.VITE_EIA_API_KEY;
  const url = `${EIA_BASE}/electricity/rto/interchange-data/data/?api_key=${key}&frequency=hourly&data[0]=value&facets[fromba][]=BPAT&sort[0][column]=period&sort[0][direction]=desc&length=24`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('EIA interchange fetch failed');
  return res.json();
}
