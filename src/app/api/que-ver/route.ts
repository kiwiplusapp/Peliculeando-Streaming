import { NextRequest, NextResponse } from 'next/server';
import { discoverAdvanced } from '@/lib/tmdb';

export const dynamic = 'force-dynamic';

// Mood → genre mapping
const MOOD_GENRES: Record<string, number[]> = {
  alegre:     [35, 10751, 10402],       // Comedy, Family, Music
  emocionante:[28, 12, 878],            // Action, Adventure, Sci-Fi
  romantico:  [10749, 18],              // Romance, Drama
  terror:     [27, 53, 9648],           // Horror, Thriller, Mystery
  reflexivo:  [18, 36, 99],             // Drama, History, Documentary
  relajado:   [35, 10751, 16],          // Comedy, Family, Animation
  misterio:   [9648, 53, 80],          // Mystery, Thriller, Crime
  fantasia:   [14, 878, 12],            // Fantasy, Sci-Fi, Adventure
};

// Duration → runtime mapping (movies, minutes)
const DURATION_RUNTIME: Record<string, { min: number; max: number }> = {
  corto:   { min: 0,   max: 90  },
  medio:   { min: 90,  max: 130 },
  largo:   { min: 130, max: 999 },
};

export async function POST(req: NextRequest) {
  const { tiempo, mood, compania, tipo } = await req.json();
  // tiempo: 'poco' (< 2h) | 'medio' (2-3h) | 'mucho' (cualquier)
  // mood: one of MOOD_GENRES keys
  // compania: 'solo' | 'pareja' | 'familia' | 'amigos'
  // tipo: 'movie' | 'tv' | 'any'

  const mediaType = tipo === 'tv' ? 'tv' : 'movie';

  const params: Record<string, string | number | boolean> = {
    media_type: mediaType,
    sort_by: 'vote_average.desc',
    'vote_count.gte': 200,
    page: 1,
  };

  // Genre from mood
  if (mood && MOOD_GENRES[mood]) {
    params['with_genres'] = MOOD_GENRES[mood].join('|'); // OR logic
  }

  // Compania adjustments
  if (compania === 'familia') {
    params['with_genres'] = '10751|35|16'; // Family, Comedy, Animation
    params['certification_country'] = 'US';
    params['certification.lte'] = 'PG-13';
  } else if (compania === 'pareja') {
    params['with_genres'] = mood ? (MOOD_GENRES[mood]?.join('|') || '10749|18') : '10749|18';
  }

  // Time constraint (movies only)
  if (mediaType === 'movie' && tiempo) {
    if (tiempo === 'poco') {
      params['with_runtime.lte'] = 100;
    } else if (tiempo === 'medio') {
      params['with_runtime.gte'] = 100;
      params['with_runtime.lte'] = 140;
    }
  }

  try {
    const data = await discoverAdvanced(params);
    // Return top 6 diverse results
    const results = data.results.slice(0, 6);
    return NextResponse.json({ results, params_used: { mood, compania, tiempo, tipo } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error al buscar' }, { status: 500 });
  }
}
