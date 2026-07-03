import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get('tei_session');

  if (!token?.value) {
    return NextResponse.json(null, { status: 401 });
  }

  try {
    const payload = JSON.parse(Buffer.from(token.value, 'base64').toString());

    if (Date.now() - payload.ts > 24 * 60 * 60 * 1000) {
      return NextResponse.json(null, { status: 401 });
    }

    const userCookie = cookieStore.get('tei_user');
    const user = userCookie?.value ? JSON.parse(userCookie.value) : null;

    if (!user) {
      return NextResponse.json(null, { status: 401 });
    }

    return NextResponse.json({
      user,
      token: token.value,
      expiresAt: payload.ts + 24 * 60 * 60 * 1000,
    });
  } catch {
    return NextResponse.json(null, { status: 401 });
  }
}
