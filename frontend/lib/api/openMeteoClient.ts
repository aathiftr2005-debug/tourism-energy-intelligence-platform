import { apiCache, CACHE_TTL } from './cache';
import { getCoordinates, getWeatherCondition } from './coordinates';
import type { WeatherDataset } from '@/lib/types/weather';

interface OpenMeteoCurrent {
  temperature_2m: number;
  relative_humidity_2m: number;
  weather_code: number;
}

interface OpenMeteoHourly {
  time: string[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  weather_code: number[];
}

interface OpenMeteoDaily {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  weather_code: number[];
}

interface OpenMeteoResponse {
  current?: OpenMeteoCurrent;
  hourly?: OpenMeteoHourly;
  daily?: OpenMeteoDaily;
}

export interface NormalizedHourlyForecast {
  time: string;
  temperature: number;
  humidity: number;
  condition: string;
}

export interface NormalizedDailyForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  condition: string;
}

async function internalFetch<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Internal API error: ${response.status}`);
  return response.json();
}

async function fetchCountryWeather(
  countryCode: string
): Promise<{
  condition: string;
  temperature: number;
  humidity: number;
} | null> {
  const coords = getCoordinates(countryCode);
  if (!coords) return null;

  try {
    const url = `/api/weather?lat=${coords.lat}&lon=${coords.lon}&type=current`;
    const data = await internalFetch<OpenMeteoResponse>(url);

    if (!data.current) return null;

    return {
      condition: getWeatherCondition(data.current.weather_code),
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
    };
  } catch {
    return null;
  }
}

export async function fetchCurrentWeather(
  countryCode: string
): Promise<{
  condition: string;
  temperature: number;
  humidity: number;
} | null> {
  const cacheKey = `weather_current_${countryCode}`;
  const cached = apiCache.get<{
    condition: string;
    temperature: number;
    humidity: number;
  }>(cacheKey);
  if (cached) return cached;

  const result = await fetchCountryWeather(countryCode);
  if (result) {
    apiCache.set(cacheKey, result, CACHE_TTL.WEATHER);
  }
  return result;
}

export async function fetchAllWeather(): Promise<WeatherDataset> {
  const cacheKey = 'weather_all';
  const cached = apiCache.get<WeatherDataset>(cacheKey);
  if (cached) return cached;

  const codes: string[] = [
    'DE', 'FR', 'ES', 'IT', 'AT', 'GR', 'PT', 'NL', 'BE', 'CZ',
    'GB', 'CH', 'SE', 'NO', 'DK', 'FI', 'IE', 'PL', 'HU', 'RO',
    'BG', 'HR',
  ];

  const results = await Promise.allSettled(
    codes.map(async (code) => {
      const data = await fetchCountryWeather(code);
      return { code, data };
    })
  );

  const conditions: Record<string, { condition: string; temperature: number; humidity: number }> = {};

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.data) {
      conditions[result.value.code] = result.value.data;
    }
  }

  const dataset: WeatherDataset = { conditions };
  apiCache.set(cacheKey, dataset, CACHE_TTL.WEATHER);
  return dataset;
}

export async function fetchHourlyForecast(
  countryCode: string
): Promise<NormalizedHourlyForecast[]> {
  const cacheKey = `weather_hourly_${countryCode}`;
  const cached = apiCache.get<NormalizedHourlyForecast[]>(cacheKey);
  if (cached) return cached;

  const coords = getCoordinates(countryCode);
  if (!coords) return [];

  try {
    const url = `/api/weather?lat=${coords.lat}&lon=${coords.lon}&type=hourly`;
    const data = await internalFetch<OpenMeteoResponse>(url);

    if (!data.hourly) return [];

    const forecasts: NormalizedHourlyForecast[] = data.hourly.time.map(
      (time, i) => ({
        time,
        temperature: data.hourly!.temperature_2m[i],
        humidity: data.hourly!.relative_humidity_2m[i],
        condition: getWeatherCondition(data.hourly!.weather_code[i]),
      })
    );

    apiCache.set(cacheKey, forecasts, CACHE_TTL.WEATHER);
    return forecasts;
  } catch {
    return [];
  }
}

export async function fetchDailyForecast(
  countryCode: string
): Promise<NormalizedDailyForecast[]> {
  const cacheKey = `weather_daily_${countryCode}`;
  const cached = apiCache.get<NormalizedDailyForecast[]>(cacheKey);
  if (cached) return cached;

  const coords = getCoordinates(countryCode);
  if (!coords) return [];

  try {
    const url = `/api/weather?lat=${coords.lat}&lon=${coords.lon}&type=daily`;
    const data = await internalFetch<OpenMeteoResponse>(url);

    if (!data.daily) return [];

    const forecasts: NormalizedDailyForecast[] = data.daily.time.map(
      (date, i) => ({
        date,
        tempMax: data.daily!.temperature_2m_max[i],
        tempMin: data.daily!.temperature_2m_min[i],
        condition: getWeatherCondition(data.daily!.weather_code[i]),
      })
    );

    apiCache.set(cacheKey, forecasts, CACHE_TTL.WEATHER);
    return forecasts;
  } catch {
    return [];
  }
}
