import { NextResponse } from 'next/server';

const API_KEY = process.env.EUROSTAT_API_KEY || '';
const BASE_URL = process.env.EUROSTAT_BASE_URL || 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');

    if (!API_KEY) {
      return NextResponse.json(
        { error: 'Eurostat API not configured', note: 'Using cached data' },
        { status: 501 }
      );
    }

    const url = `${BASE_URL}/tour_occ_arm?geo=${country || 'EU'}&format=JSON`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Eurostat error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timeout' }, { status: 504 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
