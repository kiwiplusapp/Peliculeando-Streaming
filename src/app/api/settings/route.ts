import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';
import { hash, compare } from 'bcryptjs';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = Number(session.sub);
  const [user] = await query<{
    id: number; username: string; email: string;
    avatar_color: string; bio: string; location: string;
    website: string; is_public: boolean; created_at: string;
  }>(
    `SELECT id, username, email, avatar_color,
            COALESCE(bio,'') AS bio,
            COALESCE(location,'') AS location,
            COALESCE(website,'') AS website,
            COALESCE(is_public,true) AS is_public,
            created_at
     FROM users WHERE id = $1`,
    [userId]
  ).catch(() => []);

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = Number(session.sub);
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const action = body.action as string;

  /* ── Change password ── */
  if (action === 'change_password') {
    const currentPassword = body.currentPassword as string;
    const newPassword     = body.newPassword as string;
    if (!currentPassword || !newPassword)
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
    if (newPassword.length < 6)
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });

    const [userRow] = await query<{ password_hash: string }>(
      'SELECT password_hash FROM users WHERE id = $1', [userId]
    ).catch(() => []);
    if (!userRow) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    const ok = await compare(currentPassword, userRow.password_hash);
    if (!ok) return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 400 });

    const newHash = await hash(newPassword, 10);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);
    return NextResponse.json({ ok: true, message: 'Contraseña actualizada' });
  }

  /* ── Update profile ── */
  if (action === 'update_profile') {
    const { username, bio, avatar_color, location, website } = body as Record<string, string | undefined>;

    // Only validate username if it's being changed
    if (username !== undefined) {
      const uname = username.trim();
      if (uname.length < 3 || uname.length > 30)
        return NextResponse.json({ error: 'El nombre debe tener entre 3 y 30 caracteres' }, { status: 400 });
      // Allow letters (including accented), numbers, underscore
      if (!/^[\wÀ-ɏ]+$/.test(uname))
        return NextResponse.json({ error: 'Solo letras, números y guion bajo' }, { status: 400 });

      // Check uniqueness
      const [existing] = await query<{ id: number }>(
        'SELECT id FROM users WHERE username = $1 AND id != $2', [uname, userId]
      ).catch(() => []);
      if (existing) return NextResponse.json({ error: 'Ese nombre de usuario ya existe' }, { status: 409 });
    }

    const bioVal      = typeof bio      === 'string' ? (bio.trim()      || null) : undefined;
    const locationVal = typeof location === 'string' ? (location.trim() || null) : undefined;
    const websiteVal  = typeof website  === 'string' ? (website.trim()  || null) : undefined;
    const colorVal    = typeof avatar_color === 'string' ? avatar_color : undefined;
    const nameVal     = username !== undefined ? username.trim() : undefined;

    // Build dynamic SET clause
    const sets: string[] = [];
    const vals: unknown[] = [];
    let idx = 1;

    if (nameVal  !== undefined) { sets.push(`username = $${idx++}`);     vals.push(nameVal); }
    if (bioVal   !== undefined) { sets.push(`bio = $${idx++}`);          vals.push(bioVal); }
    if (colorVal !== undefined) { sets.push(`avatar_color = $${idx++}`); vals.push(colorVal); }

    // location and website may not exist — try with fallback
    if (locationVal !== undefined) sets.push(`location = $${idx++}`);
    if (locationVal !== undefined) vals.push(locationVal);
    if (websiteVal  !== undefined) sets.push(`website = $${idx++}`);
    if (websiteVal  !== undefined) vals.push(websiteVal);

    if (sets.length === 0)
      return NextResponse.json({ ok: true, message: 'Sin cambios' });

    vals.push(userId);
    try {
      await query(`UPDATE users SET ${sets.join(', ')} WHERE id = $${idx}`, vals);
    } catch {
      // Fallback without location/website if those columns don't exist
      const safeSets: string[] = [];
      const safeVals: unknown[] = [];
      let i2 = 1;
      if (nameVal  !== undefined) { safeSets.push(`username = $${i2++}`);     safeVals.push(nameVal); }
      if (bioVal   !== undefined) { safeSets.push(`bio = $${i2++}`);          safeVals.push(bioVal); }
      if (colorVal !== undefined) { safeSets.push(`avatar_color = $${i2++}`); safeVals.push(colorVal); }
      if (safeSets.length > 0) {
        safeVals.push(userId);
        await query(`UPDATE users SET ${safeSets.join(', ')} WHERE id = $${i2}`, safeVals);
      }
    }

    return NextResponse.json({ ok: true, message: 'Perfil actualizado' });
  }

  /* ── Update privacy ── */
  if (action === 'update_privacy') {
    await query('UPDATE users SET is_public = $1 WHERE id = $2', [Boolean(body.is_public), userId])
      .catch(() => {});
    return NextResponse.json({ ok: true, message: 'Privacidad actualizada' });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
