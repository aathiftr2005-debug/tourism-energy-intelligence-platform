import { NextResponse } from 'next/server';
import type { LoginResponse, UserRole } from '@/lib/auth/types';

interface StoredUser {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

const USERS: StoredUser[] = [
  { email: 'admin@tei.app', password: 'demo1234', name: 'Admin User', role: 'admin' },
  { email: 'analyst@tei.app', password: 'demo1234', name: 'Government Analyst', role: 'analyst' },
  { email: 'operator@tei.app', password: 'demo1234', name: 'Energy Operator', role: 'operator' },
  { email: 'viewer@tei.app', password: 'demo1234', name: 'Viewer User', role: 'viewer' },
];

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const user = USERS.find((u) => u.email === email.toLowerCase());

    if (!user || user.password !== password) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    const token = Buffer.from(
      JSON.stringify({ id: user.email, role: user.role, ts: Date.now() })
    ).toString('base64');

    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    const maxAge = 24 * 60 * 60;

    const session: LoginResponse = {
      user: { id: user.email, email: user.email, name: user.name, role: user.role },
      token,
      expiresAt,
    };

    const response = NextResponse.json(session);

    response.cookies.set('tei_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
      path: '/',
    });

    response.cookies.set('tei_user', JSON.stringify(session.user), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
  }
}
