export type ISO3Code = string;

export interface WeatherStation {
  station_id: string;
  country_name: string;
  country_iso3: ISO3Code;
  city: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  openmeteo_endpoint: string;
}

export interface WeatherStationsDataset {
  metadata: {
    dataset_name: string;
    version: string;
    record_count: number;
    last_updated: string;
    source: string;
  };
  stations: WeatherStation[];
}

export interface OpenMeteoHourly {
  time: string[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  wind_speed_10m: number[];
  precipitation: number[];
  cloud_cover: number[];
  uv_index: number[];
}

export interface OpenMeteoForecastResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  hourly_units: Record<string, string>;
  hourly: OpenMeteoHourly;
}

export interface NormalizedWeatherSnapshot {
  station_id: string;
  country_iso3: ISO3Code;
  timestamp_utc: string;
  temperature_c: number;
  humidity_pct: number;
  wind_speed_kmh: number;
  precipitation_mm: number;
  cloud_cover_pct: number;
  uv_index: number;
}

export function isWeatherStation(obj: unknown): obj is WeatherStation {
  if (typeof obj !== "object" || obj === null) return false;
  const s = obj as Record<string, unknown>;
  return (
    typeof s.station_id === "string" &&
    typeof s.country_name === "string" &&
    typeof s.country_iso3 === "string" && s.country_iso3.length === 3 &&
    typeof s.city === "string" &&
    typeof s.latitude === "number" &&
    typeof s.longitude === "number" &&
    typeof s.elevation_m === "number" &&
    typeof s.openmeteo_endpoint === "string"
  );
}
