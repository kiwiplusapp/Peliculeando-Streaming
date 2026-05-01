import { query } from '@/lib/db';
import { XP_ACTIONS, XPAction, ACHIEVEMENTS, AchievementStats, getLevelForXP } from '@/lib/xp';

export async function awardXP(userId: number, action: XPAction, refId?: number): Promise<void> {
  const xpGained = XP_ACTIONS[action];
  await query(
    `INSERT INTO user_xp_events (user_id, action, xp_gained, ref_id) VALUES ($1, $2, $3, $4)`,
    [userId, action, xpGained, refId ?? null],
  );
  const [updated] = await query<{ xp_total: number }>(
    `UPDATE users SET xp_total = xp_total + $1 WHERE id = $2 RETURNING xp_total`,
    [xpGained, userId],
  );
  const newLevel = getLevelForXP(updated.xp_total).index;
  await query(`UPDATE users SET level = $1 WHERE id = $2`, [newLevel, userId]);

  await checkAndUnlockAchievements(userId);
}

async function checkAndUnlockAchievements(userId: number): Promise<void> {
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
    movies90sWatched: 0, movies80sWatched: 0,
    moviesClassicWatched: 0, ratingsGiven10: 0,
  };

  const unlocked = await query<{ achievement_id: string }>(
    `SELECT achievement_id FROM user_achievements WHERE user_id = $1`,
    [userId],
  );
  const unlockedSet = new Set(unlocked.map(r => r.achievement_id));

  for (const ach of ACHIEVEMENTS) {
    if (unlockedSet.has(ach.id)) continue;
    if (!ach.check(numStats)) continue;
    await query(
      `INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userId, ach.id],
    ).catch(() => {});
    await query(
      `INSERT INTO user_xp_events (user_id, action, xp_gained) VALUES ($1, 'achievement_bonus', $2)`,
      [userId, ach.xpReward],
    );
    await query(
      `UPDATE users SET xp_total = xp_total + $1 WHERE id = $2`,
      [ach.xpReward, userId],
    );
  }
}
