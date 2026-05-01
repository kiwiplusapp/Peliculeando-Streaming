import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

const POPULAR_TAGS = [
  'plot twist', 'mind-blowing', 'slow burn', 'feel-good', 'tear-jerker',
  'edge of your seat', 'must watch', 'overrated', 'hidden gem', 'binge-worthy',
  'dark', 'funny', 'romantic', 'action-packed', 'thought-provoking',
  'happy ending', 'sad ending', 'open ending', 'based on true events', 'cult classic',
];

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tmdb_id = searchParams.get('tmdb_id');
  const media_type = searchParams.get('media_type') || 'movie';
  const session = await getSessionFromRequest(req);

  try {
    if (tmdb_id) {
      const rows = await query<{ tag: string; count: string; user_voted: boolean }>(
        `SELECT tag,
                COUNT(*) as count,
                bool_or(user_id = $3) as user_voted
         FROM media_tags
         WHERE tmdb_id = $1 AND media_type = $2
         GROUP BY tag
         ORDER BY count DESC
         LIMIT 20`,
        [tmdb_id, media_type, session?.sub || '0']
      );
      return NextResponse.json({ tags: rows, popular: POPULAR_TAGS });
    }
    return NextResponse.json({ popular: POPULAR_TAGS });
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { tmdb_id, media_type = 'movie', tag } = await req.json();
  if (!tmdb_id || !tag) return NextResponse.json({ error: 'Datos requeridos' }, { status: 400 });

  const cleanTag = tag.trim().toLowerCase().slice(0, 60);
  if (!cleanTag) return NextResponse.json({ error: 'Tag inválido' }, { status: 400 });

  try {
    await query(
      `INSERT INTO media_tags (user_id, tmdb_id, media_type, tag)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, tmdb_id, media_type, tag) DO NOTHING`,
      [session.sub, tmdb_id, media_type, cleanTag]
    );

    // Return updated tags
    const tags = await query<{ tag: string; count: string; user_voted: boolean }>(
      `SELECT tag, COUNT(*) as count, bool_or(user_id = $3) as user_voted
       FROM media_tags WHERE tmdb_id = $1 AND media_type = $2
       GROUP BY tag ORDER BY count DESC LIMIT 20`,
      [tmdb_id, media_type, session.sub]
    );

    return NextResponse.json({ tags });
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { tmdb_id, media_type = 'movie', tag } = await req.json();
  try {
    await query(
      'DELETE FROM media_tags WHERE user_id = $1 AND tmdb_id = $2 AND media_type = $3 AND tag = $4',
      [session.sub, tmdb_id, media_type, tag]
    );

    const tags = await query<{ tag: string; count: string; user_voted: boolean }>(
      `SELECT tag, COUNT(*) as count, bool_or(user_id = $3) as user_voted
       FROM media_tags WHERE tmdb_id = $1 AND media_type = $2
       GROUP BY tag ORDER BY count DESC LIMIT 20`,
      [tmdb_id, media_type, session.sub]
    );
    return NextResponse.json({ tags });
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
