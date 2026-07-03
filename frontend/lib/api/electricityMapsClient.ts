import { apiCache, CACHE_TTL } from './cache';
import type { RenewableDataset } from '@/lib/types/renewable';

const ZONE_MAPPING: Record<string, string> = {
  DE: 'DE', FR: 'FR', ES: 'ES', IT: 'IT', AT: 'AT', GR: 'GR',
  PT: 'PT', NL: 'NL', BE: 'BE', CZ: 'CZ', GB: 'GB', CH: 'CH',
  SE: 'SE', NO: 'NO', DK: 'DK', FI: 'FI', IE: 'IE', PL: 'PL',
  HU: 'HU', RO: 'RO', BG: 'BG', HR: 'HR',
};

interface CarbonIntensityResponse {
  zone: string;
  carbonIntensity: number;
  datetime: string;
}

interface PowerBreakdownResponse {
  zone: string;
  datetime: string;
  renewablePercentage: number;
  fossilFreePercentage: number;
}

async function internalFetch<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Internal API error: ${response.status}`);
  return response.json();
}

async function fetchCarbonIntensity(
  zone: string
): Promise<{ carbonIntensity: number } | null> {
  try {
    const url = `/api/carbon?zone=${zone}&type=carbon-intensity`;
    const data = await internalFetch<CarbonIntensityResponse>(url);
    return { carbonIntensity: data.carbonIntensity };
  } catch {
    return null;
  }
}

async function fetchPowerBreakdown(
  zone: string
): Promise<{ renewablePercentage: number } | null> {
  try {
    const url = `/api/carbon?zone=${zone}&type=breakdown`;
    const data = await internalFetch<PowerBreakdownResponse>(url);
    return { renewablePercentage: data.renewablePercentage };
  } catch {
    return null;
  }
}

export async function fetchCarbonData(
  countryCode: string
): Promise<{
  carbonIntensity: number | null;
  renewablePercentage: number | null;
} | null> {
  const cacheKey = `carbon_${countryCode}`;
  const cached = apiCache.get<{
    carbonIntensity: number | null;
    renewablePercentage: number | null;
  }>(cacheKey);
  if (cached) return cached;

  const zone = ZONE_MAPPING[countryCode.toUpperCase()];
  if (!zone) return null;

  const [carbon, breakdown] = await Promise.all([
    fetchCarbonIntensity(zone),
    fetchPowerBreakdown(zone),
  ]);

  if (!carbon && !breakdown) return null;

  const result = {
    carbonIntensity: carbon?.carbonIntensity ?? null,
    renewablePercentage: breakdown?.renewablePercentage ?? null,
  };

  apiCache.set(cacheKey, result, CACHE_TTL.CARBON);
  return result;
}

export async function fetchAllRenewableData(): Promise<Partial<RenewableDataset>> {
  const cacheKey = 'renewable_all';
  const cached = apiCache.get<Partial<RenewableDataset>>(cacheKey);
  if (cached) return cached;

  const codes = Object.keys(ZONE_MAPPING);

  const results = await Promise.allSettled(
    codes.map(async (code) => {
      const data = await fetchCarbonData(code);
      return { code, data };
    })
  );

  const percentages: Record<string, number> = {};

  for (const result of results) {
    if (
      result.status === 'fulfilled' &&
      result.value.data?.renewablePercentage != null
    ) {
      percentages[result.value.code] = Math.min(
        100,
        Math.max(0, Math.round(result.value.data.renewablePercentage))
      );
    }
  }

  const dataset: Partial<RenewableDataset> = { percentages };
  apiCache.set(cacheKey, dataset, CACHE_TTL.CARBON);
  return dataset;
}
