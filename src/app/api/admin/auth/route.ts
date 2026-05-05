import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_USERNAME, ADMIN_PASSWORD, signAdminToken } from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json().catch(() => ({}));

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
  }

  const token = await signAdminToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set('pel_admin', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 hours
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('pel_admin');
  return res;
}
