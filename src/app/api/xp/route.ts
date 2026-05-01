import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import {
  XP_ACTIONS, XPAction, ACHIEVEMENTS, AchievementStats, getLevelForXP,
} from '@/lib/xp';

// POST /api/xp  { action: XPAction, ref_id?: number }
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action, ref_id } = await req.json() as { action: XPAction; ref_id?: number };
  if (!XP_ACTIONS[action]) return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  const xpGained = XP_ACTIONS[action];
  const userId = Number(session.sub);

  // Record XP event
  await query(
    `INSERT INTO user_xp_events (user_id, action, xp_gained, ref_id) VALUES ($1, $2, $3, $4)`,
    [userId, action, xpGained, ref_id ?? null],
  );

  // Update cached xp_total + level on users
  const [updated] = await query<{ xp_total: number }>(
    `UPDATE users SET xp_total = xp_total + $1 WHERE id = $2 RETURNING xp_total`,
    [xpGained, userId],
  );
  const newXP = updated.xp_total;
  const newLevel = getLevelForXP(newXP).index;
  await query(`UPDATE users SET level = $1 WHERE id = $2`, [newLevel, userId]);

  // Check for newly unlocked achievements
  const newlyUnlocked = await checkAndUnlockAchievements(userId);

  return NextResponse.json({ xpGained, totalXP: newXP, level: newLevel, unlocked: newlyUnlocked });
}

// GET /api/xp — return current XP + level + recent events
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = Number(session.sub);
  const [user] = await query<{ xp_total: number; level: number }>(
    `SELECT xp_total, level FROM users WHERE id = $1`,
    [userId],
  );

  const events = await query<{ action: string; xp_gained: number; created_at: string }>(
    `SELECT action, xp_gained, created_at FROM user_xp_events
     WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
    [userId],
  );

  return NextResponse.json({ xp: user.xp_total || 0, level: user.level || 0, events });
}

async function checkAndUnlockAchievements(userId: number): Promise<string[]> {
  // Get current stats in one query block
  const [stats] = await query<AchievementStats>(`
    SELECT
      (SELECT COUNT(*) FROM watch_progress WHERE user_id = $1 AND media_type = 'movie') AS "moviesWatched",
      (SELECT COUNT(*) FROM watch_progress WHERE user_id = $1 AND media_type = 'tv') AS "tvWatched",
      (SELECT COUNT(*) FROM reviews WHERE user_id = $1) AS "reviewsWritten",
      COALESCE((
        SELECT COUNT(*) FROM review_votes rv
        JOIN reviews r ON r.id = rv.review_id
        WHERE r.user_id = $1 AND rv.is_helpful = true
      ), 0) AS "helpfulVotesReceived",
      (SELECT COUNT(*) FROM collections WHERE user_id = $1) AS "collectionsCreated",
      (SELECT COUNT(*) FROM watchlist WHERE user_id = $1) AS "watchlistSize",
      0 AS "movies90sWatched",
      0 AS "movies80sWatched",
      0 AS "moviesClassicWatched",
      0 AS "ratingsGiven10"
  `, [userId]);

  const numStats: AchievementStats = {
    moviesWatched: Number(stats.moviesWatched),
    tvWatched: Number(stats.tvWatched),
    reviewsWritten: Number(stats.reviewsWritten),
    helpfulVotesReceived: Number(stats.helpfulVotesReceived),
    collectionsCreated: Number(stats.collectionsCreated),
    watchlistSize: Number(stats.watchlistSize),
    movies90sWatched: 0,
    movies80sWatched: 0,
    moviesClassicWatched: 0,
    ratingsGiven10: 0,
  };

  // Get already unlocked
  const unlocked = await query<{ achievement_id: string }>(
    `SELECT achievement_id FROM user_achievements WHERE user_id = $1`,
    [userId],
  );
  const unlockedSet = new Set(unlocked.map(r => r.achievement_id));

  const newlyUnlocked: string[] = [];

  for (const ach of ACHIEVEMENTS) {
    if (unlockedSet.has(ach.id)) continue;
    if (ach.check(numStats)) {
      await query(
        `INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [userId, ach.id],
      ).catch(() => {});
      // Award achievement XP bonus
      await query(
        `INSERT INTO user_xp_events (user_id, action, xp_gained) VALUES ($1, 'achievement_bonus', $2)`,
        [userId, ach.xpReward],
      );
      await query(
        `UPDATE users SET xp_total = xp_total + $1 WHERE id = $2`,
        [ach.xpReward, userId],
      );
      newlyUnlocked.push(ach.id);
    }
  }

  return newlyUnlocked;
}
