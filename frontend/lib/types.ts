export interface StressScore {
  country_code: string;
  year: number;
  month: number;
  stress_score: number;
  stress_level: 'NORMAL' | 'ELEVATED' | 'CRITICAL';
  traffic_light: string;
  contributing_factors: Record<string, number>;
  recommendation: string;
}

export interface ForecastPoint {
  date: string;
  xgb_prediction: number;
  prophet_prediction: number;
  ensemble_prediction: number;
  lower_bound: number;
  upper_bound: number;
  country_code: string;
}

export interface ForecastResponse {
  country_code: string;
  months_ahead: number;
  forecast: ForecastPoint[];
}

export interface AllForecastsResponse {
  months_ahead: number;
  forecasts: Record<string, ForecastPoint[]>;
}

export interface ShapData {
  global_importance: Record<string, number>;
  latest_prediction_explanation: Record<string, number>;
  summary_plot_data: { feature: string; shap_value: number; feature_value: number }[];
}

export interface ExplainabilityResponse {
  country_code: string;
  explanation: ShapData;
}

export interface SimulationParams {
  country_code: string;
  tourist_change: number;
  temp_deviation: number;
  flight_multiplier: number;
  event_boost: number;
}

export interface SimulationResult {
  baseline_score: number;
  simulated_score: number;
  baseline_forecast: number[];
  simulated_forecast: number[];
  explanation: string;
}

export interface ETLStatus {
  last_run: {
    id: number;
    run_at: string;
    country_code: string;
    rows_inserted: number;
    status: string;
  } | null;
  active_jobs: number;
  jobs: { job_id: string; status: string; created_at: string }[];
}

export interface Region {
  code: string;
  name: string;
  flag: string;
  capital: string;
  coordinates: { lat: number; lng: number };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  reply: string;
}

export interface ETLRunResponse {
  status: string;
  job_id: string;
  message: string;
}

export interface MLTrainResponse {
  status: string;
  job_id: string;
  message: string;
}

export interface AlertHistory {
  id: number;
  country_code: string;
  stress_level: string;
  stress_score: number;
  sent_at: string;
  status: string;
}

export interface ModelMetrics {
  mae: number;
  rmse: number;
  mape: number;
  r2: number;
}

export const COUNTRY_FLAGS: Record<string, string> = {
  DE: '\ud83c\udde9\ud83c\uddea',
  FR: '\ud83c\uddeb\ud83c\uddf7',
  ES: '\ud83c\uddea\ud83c\uddf8',
  IT: '\ud83c\uddee\ud83c\uddf9',
  AT: '\ud83c\udde6\ud83c\uddf9',
  GR: '\ud83c\uddec\ud83c\uddf7',
  PT: '\ud83c\uddf5\ud83c\uddf9',
  NL: '\ud83c\uddf3\ud83c\uddf1',
  BE: '\ud83c\udde7\ud83c\uddea',
  CZ: '\ud83c\udde8\ud83c\uddff',
};

export const COUNTRY_NAMES: Record<string, string> = {
  DE: 'Germany', FR: 'France', ES: 'Spain', IT: 'Italy',
  AT: 'Austria', GR: 'Greece', PT: 'Portugal', NL: 'Netherlands',
  BE: 'Belgium', CZ: 'Czech Republic',
};

export interface StressScoreEntry {
  country: string;
  stress_score: number;
  status?: string;
  country_code?: string;
}

export interface DigitalTwinLayer {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export interface DigitalTwinCountryData {
  country: string;
  country_code: string;
  energyUsage: number;
  renewablePercent: number;
  touristCount: number;
  carbonEmissions: number;
  weather: { condition: string; temperature: number; humidity: number };
  gridHealth: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  aiSummary: string;
  aiRecommendation: string;
  forecast24h: { label: string; value: string; direction: 'up' | 'down' | 'stable' }[];
}

export interface ExecutiveSummaryData {
  health: number;
  energyStatus: string;
  tourismActivity: string;
  summary: string;
  currentStatus: string;
}

export interface ForecastItem {
  label: string;
  value: string;
  change: string;
  direction: 'up' | 'down' | 'stable';
}

export interface GovernmentReadinessScore {
  label: string;
  score: number;
  icon: string;
}

export interface KpiCard {
  label: string;
  value: number;
  suffix: string;
  color: string;
  icon: string;
  precision: number;
}

export interface SystemHealthItem {
  label: string;
  status: 'operational' | 'degraded' | 'down';
  value: string;
}

export const SIDEBAR_LINKS = [
  { href: '/', icon: '\ud83c\udf0d', label: 'Dashboard' },
  { href: '/forecast', icon: '\ud83d\udcc8', label: 'Forecasts' },
  { href: '/stress', icon: '\u26a1', label: 'Stress Scores' },
  { href: '/map', icon: '\ud83d\uddfa\ufe0f', label: 'Europe Map' },
  { href: '/reports', icon: '\ud83d\udcca', label: 'Reports' },
  { href: '/assistant', icon: '\ud83e\udd16', label: 'AI Assistant' },
  { href: '/simulator', icon: '\ud83d\udd04', label: 'Simulator' },
  { href: '/api-access', icon: '\ud83d\udd11', label: 'API Access' },
  { href: '/settings', icon: '\u2699\ufe0f', label: 'Settings' },
];
