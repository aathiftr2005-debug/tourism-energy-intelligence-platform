import forecastData from '@/data/forecasts.json';
import type {
  ForecastDataset,
  MonthlyEnergyPoint,
  MonthlyForecastPoint,
  ModelMetricsEntry,
  SeasonalStressEntry,
  HistoricalTrendPoint,
} from '@/lib/types/forecast';

let instance: ForecastDataset | null = null;

function load(): ForecastDataset {
  if (instance) return instance;
  instance = forecastData as ForecastDataset;
  return instance;
}

function validate(data: ForecastDataset): void {
  if (!data.monthlyEnergy?.length) throw new Error('ForecastService: monthlyEnergy is empty');
  if (!data.monthlyForecast?.length) throw new Error('ForecastService: monthlyForecast is empty');
}

export const ForecastService = {
  getAll(): ForecastDataset {
    const raw = load();
    validate(raw);
    return raw;
  },

  getMonthlyEnergy(): MonthlyEnergyPoint[] {
    return load().monthlyEnergy;
  },

  getMonthlyForecast(): MonthlyForecastPoint[] {
    return load().monthlyForecast;
  },

  getModelMetrics(): ModelMetricsEntry[] {
    return load().modelMetrics;
  },

  getSeasonalStress(): SeasonalStressEntry[] {
    return load().seasonalStress;
  },

  getHistoricalTrends(country: string): HistoricalTrendPoint[] {
    return load().historicalStressTrends[country.toUpperCase()] ?? [];
  },

  getSimulatorBaseline(): number[] {
    return load().simulatorBaseline;
  },

  getSimulatorSimulated(): number[] {
    return load().simulatorSimulated;
  },

  getSimulatorScores(): { baseline: number; simulated: number } {
    return {
      baseline: load().simulatorBaselineScore,
      simulated: load().simulatorSimulatedScore,
    };
  },
};
