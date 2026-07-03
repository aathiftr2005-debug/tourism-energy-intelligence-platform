export interface MonthlyEnergyPoint {
  month: string;
  actual: number;
  xgb: number;
  prophet: number;
  ensemble: number;
}

export interface MonthlyForecastPoint {
  month: string;
  ensemble: number;
  xgb: number;
  prophet: number;
  lower: number;
  upper: number;
}

export interface ModelMetricsEntry {
  model: string;
  mae: number;
  rmse: number;
  mape: number;
  r2: number;
}

export interface SeasonalStressEntry {
  season: string;
  stress: number;
}

export interface HistoricalTrendPoint {
  label: string;
  year: number;
  stress?: number;
  forecast?: number;
  lower?: number;
  upper?: number;
}

export interface ForecastDataset {
  monthlyEnergy: MonthlyEnergyPoint[];
  monthlyForecast: MonthlyForecastPoint[];
  modelMetrics: ModelMetricsEntry[];
  seasonalStress: SeasonalStressEntry[];
  historicalStressTrends: Record<string, HistoricalTrendPoint[]>;
  simulatorBaseline: number[];
  simulatorSimulated: number[];
  simulatorBaselineScore: number;
  simulatorSimulatedScore: number;
}
