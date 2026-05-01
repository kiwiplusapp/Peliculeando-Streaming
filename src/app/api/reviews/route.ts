import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { updateGenreStats } from '@/lib/recommendations';
import { getDetail } from '@/lib/tmdb';
import { awardXP } from '@/lib/xpServer';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tmdb_id = searchParams.get('tmdb_id');
  const media_type = searchParams.get('media_type') || 'movie';
  const user_only = searchParams.get('user_only');

  const session = await getSessionFromRequest(req);

  try {
    if (user_only === '1') {
      if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
      const rows = await query(
        `SELECT r.*, u.username, u.avatar_color
         FROM reviews r JOIN users u ON r.user_id = u.id
         WHERE r.user_id = $1 ORDER BY r.created_at DESC`,
        [session.sub]
      );
      return NextResponse.json({ reviews: rows });
    }

    if (!tmdb_id) return NextResponse.json({ error: 'tmdb_id requerido' }, { status: 400 });

    const rows = await query<Record<string, unknown>>(
      `SELECT r.*, u.username, u.avatar_color,
              COALESCE(v.helpful_count, 0) AS helpful_votes,
              COALESCE(v.total_count, 0) AS total_votes,
              CASE WHEN mv.user_id IS NOT NULL THEN mv.is_helpful ELSE NULL END AS my_vote
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN (
         SELECT review_id,
                COUNT(*) FILTER (WHERE is_helpful) AS helpful_count,
                COUNT(*) AS total_count
         FROM review_votes GROUP BY review_id
       ) v ON v.review_id = r.id
       LEFT JOIN review_votes mv ON mv.review_id = r.id AND mv.user_id = $3
       WHERE r.tmdb_id = $1 AND r.media_type = $2
       ORDER BY (COALESCE(v.helpful_count, 0) * 2 + 1) / (COALESCE(v.total_count, 0) + 2) DESC,
                r.created_at DESC`,
      [tmdb_id, media_type, session?.sub || null]
    );

    const total = rows.length;
    const fresh = rows.filter(r => r.is_fresh).length;
    const freshPct = total > 0 ? Math.round((fresh / total) * 100) : null;
    const avgRating = total > 0
      ? (rows.reduce((s, r) => s + Number(r.rating), 0) / total).toFixed(1)
      : null;
    const myReview = session ? rows.find(r => String(r.user_id) === session.sub) || null : null;

    return NextResponse.json({ reviews: rows, total, freshPct, avgRating, myReview });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error al obtener reseñas' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    const body = await req.json();
    const { tmdb_id, media_type = 'movie', rating, is_fresh, content, has_spoilers, movie_title, movie_poster } = body;
    if (!tmdb_id || !rating) return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });

    const [review] = await query<Record<string, unknown> & { xmax: string }>(
      `INSERT INTO reviews (user_id, tmdb_id, media_type, rating, is_fresh, content, has_spoilers, movie_title, movie_poster)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id, tmdb_id, media_type) DO UPDATE
       SET rating = $4, is_fresh = $5, content = $6, has_spoilers = $7, updated_at = NOW()
       RETURNING *, xmax::text`,
      [session.sub, tmdb_id, media_type, rating, is_fresh ?? rating >= 6, content || null, has_spoilers || false, movie_title, movie_poster]
    );
    if (review.xmax === '0') {
      awardXP(Number(session.sub), 'write_review', Number(review.id)).catch(() => {});
    }

    // Update genre stats async (non-blocking)
    try {
      const detail = await getDetail(media_type as 'movie' | 'tv', Number(tmdb_id));
      if (detail.genres?.length) {
        const genreNames: Record<number, string> = {};
        detail.genres.forEach(g => { genreNames[g.id] = g.name; });
        await updateGenreStats(Number(session.sub), detail.genres.map(g => g.id), genreNames, Number(rating));
      }
    } catch {}

    return NextResponse.json({ review }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error al guardar reseña' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const tmdb_id = searchParams.get('tmdb_id');
  const media_type = searchParams.get('media_type') || 'movie';

  try {
    await query(
      'DELETE FROM reviews WHERE user_id = $1 AND tmdb_id = $2 AND media_type = $3',
      [session.sub, tmdb_id, media_type]
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
