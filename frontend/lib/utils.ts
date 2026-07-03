export function formatEnergy(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} GWh`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)} MWh`;
  return `${value.toFixed(1)} kWh`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-EU').format(value);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
