import { apiCache, CACHE_TTL } from './cache';
import { getCoordinates } from './coordinates';

export interface AirQualityData {
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  o3: number;
  overallLevel: 'good' | 'moderate' | 'unhealthy' | 'very_unhealthy' | 'hazardous';
}

interface OpenAQResult {
  location: string;
  city: string;
  country: string;
  coordinates: { latitude: number; longitude: number };
  measurements: {
    parameter: string;
    value: number;
    unit: string;
  }[];
}

interface OpenAQResponse {
  results: OpenAQResult[];
}

async function internalFetch<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Internal API error: ${response.status}`);
  return response.json();
}

function getAqiLevel(aqi: number): AirQualityData['overallLevel'] {
  if (aqi <= 50) return 'good';
  if (aqi <= 100) return 'moderate';
  if (aqi <= 150) return 'unhealthy';
  if (aqi <= 200) return 'very_unhealthy';
  return 'hazardous';
}

function calculateAqi(
  pm25: number | null,
  pm10: number | null,
  no2: number | null,
  so2: number | null,
  o3: number | null
): number {
  const maxAqi = Math.max(
    pm25 ? pm25 * 1.5 : 0,
    pm10 ? pm10 * 0.8 : 0,
    no2 ? no2 * 0.5 : 0,
    so2 ? so2 * 1.2 : 0,
    o3 ? o3 * 0.6 : 0
  );
  return Math.round(maxAqi);
}

async function fetchCountryAirQuality(
  countryCode: string
): Promise<AirQualityData | null> {
  const coords = getCoordinates(countryCode);
  if (!coords) return null;

  try {
    const url = `/api/carbon?lat=${coords.lat}&lon=${coords.lon}&type=air-quality`;
    const response = await internalFetch<OpenAQResponse>(url);

    if (!response.results?.length) return null;

    const allMeasurements = response.results.flatMap(
      (r) => r.measurements || []
    );

    const latest: Record<string, number> = {};
    const paramMap: Record<string, string> = {
      pm25: 'pm25',
      pm10: 'pm10',
      no2: 'no2',
      so2: 'so2',
      o3: 'o3',
    };

    for (const measurement of allMeasurements) {
      const key = paramMap[measurement.parameter.toLowerCase()];
      if (key && latest[key] === undefined && typeof measurement.value === 'number') {
        latest[key] = measurement.value;
      }
    }

    const pm25 = latest.pm25 ?? null;
    const pm10 = latest.pm10 ?? null;
    const no2 = latest.no2 ?? null;
    const so2 = latest.so2 ?? null;
    const o3 = latest.o3 ?? null;

    const aqi = calculateAqi(pm25, pm10, no2, so2, o3);
    const overallLevel = getAqiLevel(aqi);

    return {
      aqi,
      pm25: pm25 ?? 0,
      pm10: pm10 ?? 0,
      no2: no2 ?? 0,
      so2: so2 ?? 0,
      o3: o3 ?? 0,
      overallLevel,
    };
  } catch {
    return null;
  }
}

export async function fetchAirQuality(
  countryCode: string
): Promise<AirQualityData | null> {
  const cacheKey = `air_quality_${countryCode}`;
  const cached = apiCache.get<AirQualityData>(cacheKey);
  if (cached) return cached;

  const result = await fetchCountryAirQuality(countryCode);
  if (result) {
    apiCache.set(cacheKey, result, CACHE_TTL.AIR_QUALITY);
  }
  return result;
}

export async function fetchAllAirQuality(): Promise<
  Record<string, AirQualityData>
> {
  const cacheKey = 'air_quality_all';
  const cached = apiCache.get<Record<string, AirQualityData>>(cacheKey);
  if (cached) return cached;

  const codesList: string[] = [
    'DE', 'FR', 'ES', 'IT', 'AT', 'GR', 'PT', 'NL', 'BE', 'CZ',
    'GB', 'CH', 'SE', 'NO', 'DK', 'FI', 'IE', 'PL', 'HU', 'RO',
    'BG', 'HR',
  ];

  const results = await Promise.allSettled(
    codesList.map(async (code) => {
      const data = await fetchCountryAirQuality(code);
      return { code, data };
    })
  );

  const airQuality: Record<string, AirQualityData> = {};

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.data) {
      airQuality[result.value.code] = result.value.data;
    }
  }

  apiCache.set(cacheKey, airQuality, CACHE_TTL.AIR_QUALITY);
  return airQuality;
}
