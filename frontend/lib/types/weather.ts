export interface WeatherCondition {
  condition: string;
  temperature: number;
  humidity: number;
}

export interface WeatherDataset {
  conditions: Record<string, WeatherCondition>;
}
