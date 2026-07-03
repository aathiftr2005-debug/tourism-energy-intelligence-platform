import type { GridRegion } from '@/lib/types/grid';

export const DOCUMENT_TYPES = {
  SYSTEM_TOTAL_LOAD: 'A65',
  ACTUAL_GENERATION_PER_TYPE: 'A75',
  GENERATION_UNAVAILABILITY: 'A80',
  TRANSMISSION_UNAVAILABILITY: 'A78',
  FINALISED_SCHEDULE: 'A09',
  REDISPATCH_NOTICE: 'A63',
} as const;

export const PROCESS_TYPES = {
  REALISED: 'A16',
  DAY_AHEAD: 'A01',
  YEAR_AHEAD: 'A33',
} as const;

export function buildEntsoeUrl(
  region: GridRegion,
  _params?: Record<string, string>
): string {
  if (region.eic_code === 'N/A') {
    throw new Error(
      `${region.country_name} has no independent ENTSO-E bidding zone (${region.notes})`
    );
  }
  return `/api/energy?country=${region.iso2 || ''}`;
}

export async function fetchActualLoad(
  region: GridRegion,
  _periodStart?: string,
  _periodEnd?: string,
  _securityToken?: string
): Promise<string> {
  const response = await fetch(`/api/energy?country=${region.iso2 || ''}&type=load`);

  if (!response.ok) {
    throw new Error(
      `ENTSO-E request failed for ${region.country_name} (${region.bidding_zone}): ${response.status}`
    );
  }

  const data = await response.json();
  return JSON.stringify(data);
}

export async function fetchGenerationMix(
  region: GridRegion,
  _periodStart?: string,
  _periodEnd?: string,
  _securityToken?: string
): Promise<string> {
  const response = await fetch(`/api/energy?country=${region.iso2 || ''}&type=generation`);

  if (!response.ok) {
    throw new Error(
      `ENTSO-E generation request failed for ${region.country_name}: ${response.status}`
    );
  }

  const data = await response.json();
  return JSON.stringify(data);
}

export async function getLoadForRegions(
  regions: GridRegion[],
  _periodStart?: string,
  _periodEnd?: string,
  _securityToken?: string,
  concurrency = 5
): Promise<Array<{ region: GridRegion; xml: string | null }>> {
  const queryable = regions.filter((r) => r.eic_code !== 'N/A');
  const results: Array<{ region: GridRegion; xml: string | null }> = [];

  for (let i = 0; i < queryable.length; i += concurrency) {
    const batch = queryable.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (region) => {
        try {
          const xml = await fetchActualLoad(region);
          return { region, xml };
        } catch (err) {
          console.error(`Load fetch failed for ${region.country_name}:`, err);
          return { region, xml: null };
        }
      })
    );
    results.push(...batchResults);
  }
  return results;
}
