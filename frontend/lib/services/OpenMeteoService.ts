import type {
  WeatherStation,
  OpenMeteoForecastResponse,
  NormalizedWeatherSnapshot,
} from '@/lib/types/weather-integration';

const HOURLY_PARAMS = [
  'temperature_2m',
  'relative_humidity_2m',
  'wind_speed_10m',
  'precipitation',
  'cloud_cover',
  'uv_index',
].join(',');

export function buildForecastUrl(station: WeatherStation): string {
  return `/api/weather?lat=${station.latitude}&lon=${station.longitude}&type=hourly`;
}

export async function fetchStationForecast(
  station: WeatherStation
): Promise<OpenMeteoForecastResponse> {
  const url = buildForecastUrl(station);
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(
      `Open-Meteo request failed for ${station.station_id}: ${res.status}`
    );
  }

  return res.json();
}

function latestHourlyIndex(hourlyTimes: string[]): number {
  const nowUtc = new Date();
  let idx = 0;
  for (let i = 0; i < hourlyTimes.length; i++) {
    if (new Date(hourlyTimes[i]) <= nowUtc) idx = i;
    else break;
  }
  return idx;
}

export function normalizeForecast(
  station: WeatherStation,
  data: OpenMeteoForecastResponse
): NormalizedWeatherSnapshot {
  const idx = latestHourlyIndex(data.hourly.time);
  return {
    station_id: station.station_id,
    country_iso3: station.country_iso3,
    timestamp_utc: data.hourly.time[idx],
    temperature_c: data.hourly.temperature_2m[idx],
    humidity_pct: data.hourly.relative_humidity_2m[idx],
    wind_speed_kmh: data.hourly.wind_speed_10m[idx],
    precipitation_mm: data.hourly.precipitation[idx],
    cloud_cover_pct: data.hourly.cloud_cover[idx],
    uv_index: data.hourly.uv_index[idx],
  };
}

export async function getStationSnapshot(
  station: WeatherStation
): Promise<NormalizedWeatherSnapshot> {
  const raw = await fetchStationForecast(station);
  return normalizeForecast(station, raw);
}

export async function getSnapshotsForStations(
  stations: WeatherStation[],
  concurrency = 5
): Promise<NormalizedWeatherSnapshot[]> {
  const results: NormalizedWeatherSnapshot[] = [];
  for (let i = 0; i < stations.length; i += concurrency) {
    const batch = stations.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((s) =>
        getStationSnapshot(s).catch((err) => {
          console.error(`Snapshot fetch failed for ${s.station_id}:`, err);
          return null;
        })
      )
    );
    results.push(...(batchResults.filter(Boolean) as NormalizedWeatherSnapshot[]));
  }
  return results;
}
