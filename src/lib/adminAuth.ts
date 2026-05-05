import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const ADMIN_SECRET = new TextEncoder().encode(
  (process.env.JWT_SECRET || 'fallback_secret_change_me') + '_admin'
);

// Hardcoded admin credentials
export const ADMIN_USERNAME = 'peliadmin';
export const ADMIN_PASSWORD = 'Admin@Peliculeando2025';

export async function signAdminToken(): Promise<string> {
  return new SignJWT({ role: 'admin', sub: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .sign(ADMIN_SECRET);
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, ADMIN_SECRET);
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

export async function getAdminSession(): Promise<boolean> {
  const cookieStore = cookies();
  const token = cookieStore.get('pel_admin')?.value;
  if (!token) return false;
  return verifyAdminToken(token);
}

export async function getAdminSessionFromRequest(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('pel_admin')?.value;
  if (!token) return false;
  return verifyAdminToken(token);
}
