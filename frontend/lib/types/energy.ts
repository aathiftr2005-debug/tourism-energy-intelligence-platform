export interface EnergyDataset {
  consumption: Record<string, number>;
  gridHealth: Record<string, number>;
  carbonEmissions: Record<string, number>;
  stressScores: Record<string, { score: number; level: string }>;
}
