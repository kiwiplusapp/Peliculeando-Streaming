import { query } from './db';
import { getSimilar, getTopRated, getTrending } from './tmdb';

interface GenreStat {
  genre_id: number;
  genre_name: string;
  watch_count: number;
  total_rating: number;
}

interface WatchedItem {
  tmdb_id: number;
  media_type: string;
  rating: number;
}

export async function getUserRecommendations(userId: number, limit = 20) {
  // Get user's genre preferences
  const genreStats = await query<GenreStat>(
    `SELECT genre_id, genre_name, watch_count, total_rating
     FROM user_genre_stats WHERE user_id = $1
     ORDER BY (total_rating / GREATEST(watch_count,1)) DESC, watch_count DESC
     LIMIT 5`,
    [userId]
  );

  // Get what user has already watched/rated
  const watched = await query<WatchedItem>(
    `SELECT tmdb_id, media_type, rating FROM reviews WHERE user_id = $1`,
    [userId]
  );
  const watchedIds = new Set(watched.map(w => `${w.tmdb_id}_${w.media_type}`));

  // Also get watchlist
  const wl = await query<{ tmdb_id: number; media_type: string }>(
    `SELECT tmdb_id, media_type FROM watchlist WHERE user_id = $1`,
    [userId]
  );
  wl.forEach(w => watchedIds.add(`${w.tmdb_id}_${w.media_type}`));

  // If no genre stats, fall back to trending
  if (genreStats.length === 0) {
    const trending = await getTrending('all', 'week');
    return trending.filter(t => !watchedIds.has(`${t.tmdb_id}_${t.media_type}`)).slice(0, limit);
  }

  // Build discover params from top genres
  const topGenreIds = genreStats.slice(0, 3).map(g => g.genre_id).join(',');
  const avgRating = watched.length > 0
    ? watched.reduce((s, w) => s + w.rating, 0) / watched.length
    : 6;

  // Mix: similar to highly-rated content + genre-based discover
  const highRated = watched.filter(w => w.rating >= 7).slice(0, 3);

  const results = [];

  // Similar to user's top-rated
  for (const item of highRated) {
    try {
      const sim = await getSimilar(item.media_type as 'movie' | 'tv', item.tmdb_id);
      results.push(...sim.filter(s => !watchedIds.has(`${s.tmdb_id}_${s.media_type}`)));
    } catch {}
  }

  // Top rated in preferred genres (via trending as fallback)
  if (results.length < limit) {
    const trending = await getTrending('all', 'week');
    const filtered = trending.filter(t =>
      !watchedIds.has(`${t.tmdb_id}_${t.media_type}`) &&
      t.vote_average >= (avgRating - 1)
    );
    results.push(...filtered);
  }

  // Deduplicate
  const seen = new Set<string>();
  const deduped = results.filter(r => {
    const key = `${r.tmdb_id}_${r.media_type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Score: vote_average * genre_match_bonus
  const topGenreIdSet = new Set(genreStats.slice(0, 3).map(g => g.genre_id));
  const scored = deduped.map(item => {
    const genreMatch = (item.genre_ids || []).some(id => topGenreIdSet.has(id)) ? 1.3 : 1;
    return { item, score: item.vote_average * genreMatch * Math.log1p(item.popularity) };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.item);
}

export async function updateGenreStats(
  userId: number,
  genreIds: number[],
  genreNames: Record<number, string>,
  rating: number
) {
  for (const gid of genreIds) {
    await query(
      `INSERT INTO user_genre_stats (user_id, genre_id, genre_name, watch_count, total_rating)
       VALUES ($1, $2, $3, 1, $4)
       ON CONFLICT (user_id, genre_id) DO UPDATE
       SET watch_count = user_genre_stats.watch_count + 1,
           total_rating = user_genre_stats.total_rating + $4,
           genre_name = $3,
           updated_at = NOW()`,
      [userId, gid, genreNames[gid] || '', rating]
    );
  }
}
