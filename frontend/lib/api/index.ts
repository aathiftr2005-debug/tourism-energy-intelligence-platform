export { apiCache, CACHE_TTL } from './cache';
export { fetchWithRetry } from './base';
export { ApiError, TimeoutError, NetworkError, ApiResponseError } from './errors';
export { getCoordinates, getWeatherCondition, COUNTRY_COORDINATES } from './coordinates';

export {
  fetchCurrentWeather,
  fetchAllWeather,
  fetchHourlyForecast,
  fetchDailyForecast,
} from './openMeteoClient';
export type { NormalizedHourlyForecast, NormalizedDailyForecast } from './openMeteoClient';

export { fetchEnergyData, fetchAllEnergy } from './entsoeClient';

export { fetchCarbonData, fetchAllRenewableData } from './electricityMapsClient';

export { fetchAirQuality, fetchAllAirQuality } from './openAQClient';
export type { AirQualityData } from './openAQClient';

export { fetchDisasterAlerts, fetchDisasterAlertsByCountry } from './gdacsClient';
