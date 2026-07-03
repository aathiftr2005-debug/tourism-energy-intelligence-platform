import { NextResponse } from 'next/server';

const TOKEN = process.env.ELECTRICITY_MAPS_TOKEN || '';
const EM_BASE_URL = process.env.ELECTRICITY_MAPS_BASE_URL || 'https://api.electricitymap.org/v3';
const AQ_BASE_URL = process.env.OPENAQ_BASE_URL || 'https://api.openaq.org/v2';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const zone = searchParams.get('zone');
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const type = searchParams.get('type') || 'carbon-intensity';

    if (type === 'air-quality') {
      if (!lat || !lon) {
        return NextResponse.json({ error: 'lat and lon are required for air quality' }, { status: 400 });
      }

      const aqUrl = `${AQ_BASE_URL}/latest?coordinates=${lat},${lon}&radius=100000&limit=5`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(aqUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return NextResponse.json({ error: `OpenAQ error: ${response.status}` }, { status: response.status });
      }

      const data = await response.json();
      return NextResponse.json(data);
    }

    if (!zone) {
      return NextResponse.json({ error: 'zone is required for carbon/breakdown' }, { status: 400 });
    }

    if (!TOKEN) {
      return NextResponse.json({ error: 'Electricity Maps not configured' }, { status: 501 });
    }

    const endpoint = type === 'breakdown' ? 'power-consumption-breakdown' : 'carbon-intensity';
    const url = `${EM_BASE_URL}/${endpoint}/latest?zone=${encodeURIComponent(zone)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'auth-token': TOKEN },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Electricity Maps error: ${response.status}` },
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
