import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';
import { hash, compare } from 'bcryptjs';

/* GET — fetch current user settings */
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = Number(session.sub);
  const [user] = await query<{
    id: number; username: string; email: string;
    avatar_color: string; bio: string | null;
    location: string | null; website: string | null;
    is_public: boolean; created_at: string;
  }>(
    `SELECT id, username, email, avatar_color,
            COALESCE(bio, '') AS bio,
            COALESCE(location, '') AS location,
            COALESCE(website, '') AS website,
            COALESCE(is_public, true) AS is_public,
            created_at
     FROM users WHERE id = $1`,
    [userId]
  ).catch(() => []);

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ user });
}

/* PATCH — update settings */
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = Number(session.sub);
  let body: Record<string, string | boolean>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { action } = body as { action: string };

  /* ── Change password ── */
  if (action === 'change_password') {
    const { currentPassword, newPassword } = body as {
      currentPassword: string; newPassword: string;
    };
    if (!currentPassword || !newPassword)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    if (String(newPassword).length < 6)
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });

    const [userRow] = await query<{ password_hash: string }>(
      'SELECT password_hash FROM users WHERE id = $1', [userId]
    ).catch(() => []);
    if (!userRow) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const ok = await compare(String(currentPassword), userRow.password_hash);
    if (!ok) return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 400 });

    const newHash = await hash(String(newPassword), 10);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);
    return NextResponse.json({ ok: true, message: 'Contraseña actualizada' });
  }

  /* ── Update profile ── */
  if (action === 'update_profile') {
    const { username, bio, avatar_color, location, website } = body as {
      username: string; bio: string; avatar_color: string;
      location: string; website: string;
    };

    // Validate username
    if (username) {
      const uname = String(username).trim();
      if (uname.length < 3 || uname.length > 30)
        return NextResponse.json({ error: 'El nombre debe tener entre 3 y 30 caracteres' }, { status: 400 });
      if (!/^[a-zA-Z0-9_]+$/.test(uname))
        return NextResponse.json({ error: 'Solo letras, números y guion bajo' }, { status: 400 });

      // Check uniqueness
      const [existing] = await query<{ id: number }>(
        'SELECT id FROM users WHERE username = $1 AND id != $2', [uname, userId]
      ).catch(() => []);
      if (existing) return NextResponse.json({ error: 'Ese nombre de usuario ya existe' }, { status: 409 });
    }

    // Ensure columns exist (graceful if they don't)
    await query(
      `UPDATE users SET
         username     = COALESCE($1, username),
         bio          = $2,
         avatar_color = COALESCE($3, avatar_color),
         location     = $4,
         website      = $5
       WHERE id = $6`,
      [
        username ? String(username).trim() : null,
        bio     !== undefined ? String(bio).trim() || null : undefined,
        avatar_color ? String(avatar_color) : null,
        location !== undefined ? String(location).trim() || null : undefined,
        website  !== undefined ? String(website).trim()  || null : undefined,
        userId,
      ]
    ).catch(async () => {
      // Fallback if location/website columns don't exist yet
      await query(
        `UPDATE users SET
           username     = COALESCE($1, username),
           bio          = $2,
           avatar_color = COALESCE($3, avatar_color)
         WHERE id = $4`,
        [
          username ? String(username).trim() : null,
          bio !== undefined ? String(bio).trim() || null : undefined,
          avatar_color ? String(avatar_color) : null,
          userId,
        ]
      );
    });

    return NextResponse.json({ ok: true, message: 'Perfil actualizado' });
  }

  /* ── Update privacy ── */
  if (action === 'update_privacy') {
    const { is_public } = body as { is_public: boolean };
    await query(
      'UPDATE users SET is_public = $1 WHERE id = $2',
      [Boolean(is_public), userId]
    ).catch(() => {});
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
