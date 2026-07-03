import tourismData from '@/data/tourism.json';
import type { TourismDataset } from '@/lib/types/tourism';

let instance: TourismDataset | null = null;

function load(): TourismDataset {
  if (instance) return instance;
  instance = tourismData as TourismDataset;
  return instance;
}

function validate(data: TourismDataset): void {
  if (!Object.keys(data.counts).length) throw new Error('TourismService: counts is empty');
}

export const TourismService = {
  getAll(): TourismDataset {
    const raw = load();
    validate(raw);
    return raw;
  },

  getCount(code: string): number {
    return load().counts[code.toUpperCase()] ?? 0;
  },
};
