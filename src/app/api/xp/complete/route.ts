import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { awardXP } from '@/lib/xpServer';

/**
 * POST /api/xp/complete
 * Called by the watch page when the user finishes (or nearly finishes) watching.
 * Idempotent: same film won't award XP twice.
 * Body: { tmdb_id: number, media_type: 'movie' | 'tv', minutes_watched: number }
 */
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { tmdb_id, media_type, minutes_watched = 0 } = await req.json().catch(() => ({}));
  if (!tmdb_id) return NextResponse.json({ error: 'Missing tmdb_id' }, { status: 400 });

  const userId = Number(session.sub);
  const action = media_type === 'tv' ? 'watch_episode' : 'watch_movie';

  // Minimum watch time threshold before awarding XP
  // Movies: ≥ 20 min,  Episodes: ≥ 10 min
  const minMinutes = media_type === 'tv' ? 10 : 20;
  if (Number(minutes_watched) < minMinutes) {
    return NextResponse.json({ ok: false, reason: 'not_enough_time' });
  }

  const { xpGained, alreadyAwarded } = await awardXP(userId, action, Number(tmdb_id));

  return NextResponse.json({ ok: true, xpGained, alreadyAwarded });
}
