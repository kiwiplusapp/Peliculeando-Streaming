import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 });
    }

    const users = await query<{ id: number; username: string; email: string; password_hash: string; avatar_color: string }>(
      'SELECT id, username, email, password_hash, avatar_color FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    if (!users.length) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    const token = await signToken({ sub: String(user.id), username: user.username, email: user.email });

    const res = NextResponse.json({
      user: { id: user.id, username: user.username, email: user.email, avatar_color: user.avatar_color },
    });
    res.cookies.set('pel_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });
    return res;
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
