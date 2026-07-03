import axios from 'axios';
import type {
  AllForecastsResponse,
  ChatResponse,
  ETLRunResponse,
  ETLStatus,
  ExplainabilityResponse,
  ForecastResponse,
  MLTrainResponse,
  Region,
  SimulationParams,
  SimulationResult,
  StressScore,
} from './types';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

/** Safely extract an array from any API response shape */
function toArray<T>(data: unknown, ...keys: string[]): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    for (const key of keys) {
      const val = (data as Record<string, unknown>)[key];
      if (Array.isArray(val)) return val as T[];
    }
  }
  return [];
}

export async function getStressScores(): Promise<StressScore[]> {
  try {
    const { data } = await api.get('/api/v1/stress-score/all');
    return toArray<StressScore>(data, 'scores', 'results', 'data');
  } catch {
    console.error('getStressScores failed, returning []');
    return [];
  }
}

export async function getStressScore(country: string): Promise<StressScore | null> {
  try {
    const { data } = await api.get(`/api/v1/stress-score/${country}`);
    return data;
  } catch {
    return null;
  }
}

export async function getCountries(): Promise<string[]> {
  try {
    const { data } = await api.get('/api/v1/stress/countries');
    return toArray<string>(data, 'countries', 'data', 'results');
  } catch {
    return [];
  }
}

export async function getForecast(country: string, months = 12): Promise<ForecastResponse | null> {
  try {
    const { data } = await api.get(`/api/v1/forecast/${country}`, { params: { months_ahead: months } });
    return data;
  } catch {
    return null;
  }
}

export async function getAllForecasts(): Promise<AllForecastsResponse | null> {
  try {
    const { data } = await api.get('/api/v1/forecast/all');
    return data;
  } catch {
    return null;
  }
}

export async function getExplainability(country: string): Promise<ExplainabilityResponse | null> {
  try {
    const { data } = await api.get(`/api/v1/explainability/${country}`);
    return data;
  } catch {
    return null;
  }
}

export async function runSimulation(params: SimulationParams): Promise<SimulationResult | null> {
  try {
    const { data } = await api.post('/api/v1/simulator/run', params);
    return data;
  } catch {
    return null;
  }
}

export async function triggerETL(): Promise<ETLRunResponse | null> {
  try {
    const { data } = await api.post('/api/v1/etl/run');
    return data;
  } catch {
    return null;
  }
}

export async function getETLStatus(): Promise<ETLStatus | null> {
  try {
    const { data } = await api.get('/api/v1/etl/status');
    return data;
  } catch {
    return null;
  }
}

export async function sendChatMessage(message: string): Promise<ChatResponse | null> {
  try {
    const { data } = await api.post('/api/v1/assistant/chat', { message });
    return data;
  } catch {
    return null;
  }
}

export async function registerApiKey(name: string, email: string): Promise<{ message: string } | null> {
  try {
    const { data } = await api.post('/api/v1/public/keys/register', { name, email });
    return data;
  } catch {
    return null;
  }
}

export async function getRegions(): Promise<Region[]> {
  try {
    const { data } = await api.get('/api/v1/regions');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function triggerMLTrain(): Promise<MLTrainResponse | null> {
  try {
    const { data } = await api.post('/api/v1/ml/train');
    return data;
  } catch {
    return null;
  }
}
