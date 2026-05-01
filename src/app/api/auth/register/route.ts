import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, initDB } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await initDB();
    const { username, email, password } = await req.json();
    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    const existing = await query<{ id: number }>(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email.toLowerCase(), username]
    );
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email o usuario ya registrado' }, { status: 409 });
    }

    const colors = ['#f59e0b','#ec4899','#10b981','#f59e0b','#3b82f6','#ef4444'];
    const avatar_color = colors[Math.floor(Math.random() * colors.length)];
    const password_hash = await bcrypt.hash(password, 12);

    const [user] = await query<{ id: number; username: string; email: string; avatar_color: string }>(
      `INSERT INTO users (username, email, password_hash, avatar_color)
       VALUES ($1, $2, $3, $4) RETURNING id, username, email, avatar_color`,
      [username, email.toLowerCase(), password_hash, avatar_color]
    );

    const token = await signToken({ sub: String(user.id), username: user.username, email: user.email });

    const res = NextResponse.json({ user });
    res.cookies.set('pel_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
