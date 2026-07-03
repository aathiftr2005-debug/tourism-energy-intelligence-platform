import { NextResponse } from 'next/server';

const RSS_URL = process.env.GDACS_RSS_URL || 'https://www.gdacs.org/xml/rss_24h.xml';

export async function GET() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(RSS_URL, {
      signal: controller.signal,
      headers: { Accept: 'application/xml' },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json(
        { error: `GDACS error: ${response.status}` },
        { status: response.status }
      );
    }

    const xml = await response.text();
    return NextResponse.json({ xml });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timeout' }, { status: 504 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
