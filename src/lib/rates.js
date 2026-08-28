export const GST = 0.03;
export const DEFAULT_SELL_DEDUCTION = 0.015;

const SNAPSHOT = {
  updatedAt: '2026-08-28T09:30:00.000Z',
  fetchedAt: '2026-08-28T09:30:00.000Z',
  source: 'IBJA benchmark snapshot',
  sourceUrl: 'https://www.ibjarates.com/',
  status: 'snapshot',
  gold999Per10g: 158226,
  gold916Per10g: 144935,
  gold750Per10g: 118670,
  silver999PerKg: 240382,
};

const finitePositive = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export function normalizeRates(data = {}) {
  const gold999 = finitePositive(data.gold999Per10g ?? data.gold24kPer10g);
  const gold916 = finitePositive(data.gold916Per10g) ?? (gold999 ? gold999 * 0.916 : null);
  const gold750 = finitePositive(data.gold750Per10g) ?? (gold999 ? gold999 * 0.75 : null);
  const silver999 = finitePositive(data.silver999PerKg ?? data.silverPerKg);

  if (!gold999 || !silver999) throw new Error('Invalid rate payload');

  return {
    updatedAt: data.updatedAt || data.rateDate || new Date().toISOString(),
    fetchedAt: data.fetchedAt || new Date().toISOString(),
    source: data.source || 'Market feed',
    sourceUrl: data.sourceUrl || '',
    status: data.status || 'live',
    gold999Per10g: gold999,
    gold916Per10g: gold916,
    gold750Per10g: gold750,
    silver999PerKg: silver999,
  };
}

async function readJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6500);
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return normalizeRates(await res.json());
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchRates() {
  const custom = import.meta.env.VITE_RATES_API_URL;
  const candidates = [custom, '/api/rates', '/rates.json'].filter(Boolean);

  for (const endpoint of candidates) {
    try {
      return await readJson(endpoint);
    } catch {
      // Try the next source. Local Vite normally falls through from /api/rates to /rates.json.
    }
  }

  return normalizeRates(SNAPSHOT);
}

export function goldRateForPurity(rates, purity) {
  if (!rates) return 0;
  if (purity === '24K') return rates.gold999Per10g;
  if (purity === '22K') return rates.gold916Per10g;
  return rates.gold750Per10g;
}

export const inr = (n, digits = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: digits,
  }).format(Number(n) || 0);
