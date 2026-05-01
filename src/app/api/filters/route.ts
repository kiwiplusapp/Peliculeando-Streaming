import { NextRequest, NextResponse } from 'next/server';
import { discoverAdvanced, getGenres } from '@/lib/tmdb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const params: Record<string, string | number | boolean> = {
    media_type: searchParams.get('media_type') || 'movie',
    sort_by: searchParams.get('sort_by') || 'popularity.desc',
    page: Number(searchParams.get('page') || 1),
  };

  // Year range
  const yearFrom = searchParams.get('year_from');
  const yearTo = searchParams.get('year_to');
  const type = params.media_type as string;

  if (yearFrom) {
    params[type === 'movie' ? 'primary_release_date.gte' : 'first_air_date.gte'] = `${yearFrom}-01-01`;
  }
  if (yearTo) {
    params[type === 'movie' ? 'primary_release_date.lte' : 'first_air_date.lte'] = `${yearTo}-12-31`;
  }

  // Rating
  const ratingMin = searchParams.get('rating_min');
  const ratingMax = searchParams.get('rating_max');
  if (ratingMin) params['vote_average.gte'] = Number(ratingMin);
  if (ratingMax) params['vote_average.lte'] = Number(ratingMax);

  // Min vote count for reliability
  params['vote_count.gte'] = 50;

  // Runtime (movie only)
  const runtimeMin = searchParams.get('runtime_min');
  const runtimeMax = searchParams.get('runtime_max');
  if (runtimeMin && type === 'movie') params['with_runtime.gte'] = Number(runtimeMin);
  if (runtimeMax && type === 'movie') params['with_runtime.lte'] = Number(runtimeMax);

  // Language
  const lang = searchParams.get('language');
  if (lang) params['with_original_language'] = lang;

  // Genres
  const genres = searchParams.get('genres');
  if (genres) params['with_genres'] = genres;

  // Keywords (for tag-based filtering like happy ending, etc.)
  const keywords = searchParams.get('keywords');
  if (keywords) params['with_keywords'] = keywords;

  try {
    const data = await discoverAdvanced(params);
    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error en búsqueda' }, { status: 500 });
  }
}

// Get genre list
export async function POST(req: NextRequest) {
  const { type } = await req.json();
  try {
    const genres = await getGenres(type || 'movie');
    return NextResponse.json({ genres });
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
