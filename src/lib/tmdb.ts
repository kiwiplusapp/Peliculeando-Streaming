import axios from 'axios';

const BASE = 'https://api.themoviedb.org/3';
const KEY = process.env.TMDB_API_KEY!;
const LANG = 'es-MX';

const tmdb = axios.create({
  baseURL: BASE,
  params: { api_key: KEY, language: LANG },
});

export function imgUrl(path: string | null, size = 'w500'): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export interface MediaItem {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  release_date: string;
  popularity: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  runtime?: number;
  number_of_seasons?: number;
  status?: string;
  tagline?: string;
  imdb_id?: string;
  original_language?: string;
  budget?: number;
  revenue?: number;
  episode_run_time?: number[];
  networks?: { id: number; name: string; logo_path: string }[];
  production_companies?: { id: number; name: string }[];
  spoken_languages?: { iso_639_1: string; name: string }[];
}

function normalize(item: Record<string, unknown>, type: 'movie' | 'tv'): MediaItem {
  const isTV = type === 'tv';
  return {
    tmdb_id: item.id as number,
    media_type: type,
    title: (isTV ? item.name : item.title) as string,
    original_title: (isTV ? item.original_name : item.original_title) as string,
    overview: (item.overview as string) || '',
    poster_path: (item.poster_path as string) || null,
    backdrop_path: (item.backdrop_path as string) || null,
    vote_average: (item.vote_average as number) || 0,
    vote_count: (item.vote_count as number) || 0,
    release_date: (isTV ? item.first_air_date : item.release_date) as string || '',
    popularity: (item.popularity as number) || 0,
    genre_ids: (item.genre_ids as number[]) || [],
    genres: (item.genres as { id: number; name: string }[]) || [],
    runtime: (item.runtime as number) || 0,
    number_of_seasons: (item.number_of_seasons as number) || 0,
    status: item.status as string,
    tagline: item.tagline as string,
    imdb_id: item.imdb_id as string,
    original_language: item.original_language as string,
    budget: item.budget as number,
    revenue: item.revenue as number,
    episode_run_time: (item.episode_run_time as number[]) || [],
    networks: (item.networks as { id: number; name: string; logo_path: string }[]) || [],
    production_companies: (item.production_companies as { id: number; name: string }[]) || [],
    spoken_languages: (item.spoken_languages as { iso_639_1: string; name: string }[]) || [],
  };
}

export async function getTrending(type: 'movie' | 'tv' | 'all' = 'all', window: 'day' | 'week' = 'week') {
  const { data } = await tmdb.get(`/trending/${type}/${window}`);
  return (data.results as Record<string, unknown>[]).map(i =>
    normalize(i, (i.media_type as 'movie' | 'tv') || type as 'movie' | 'tv')
  );
}

export async function getPopular(type: 'movie' | 'tv', page = 1) {
  const { data } = await tmdb.get(`/${type}/popular`, { params: { page } });
  return {
    results: (data.results as Record<string, unknown>[]).map(i => normalize(i, type)),
    total_pages: data.total_pages as number,
    page: data.page as number,
  };
}

export async function getTopRated(type: 'movie' | 'tv', page = 1) {
  const { data } = await tmdb.get(`/${type}/top_rated`, { params: { page } });
  return {
    results: (data.results as Record<string, unknown>[]).map(i => normalize(i, type)),
    total_pages: data.total_pages as number,
  };
}

export async function getDetail(type: 'movie' | 'tv', id: number): Promise<MediaItem> {
  const { data } = await tmdb.get(`/${type}/${id}`, {
    params: { append_to_response: 'credits,videos,similar,recommendations,external_ids' },
  });
  return normalize(data as Record<string, unknown>, type);
}

export async function getDetailFull(type: 'movie' | 'tv', id: number) {
  const { data } = await tmdb.get(`/${type}/${id}`, {
    params: { append_to_response: 'credits,videos,similar,recommendations,external_ids,keywords,watch/providers' },
  });
  return data;
}

export async function searchMulti(query: string, page = 1) {
  const { data } = await tmdb.get('/search/multi', { params: { query, page, include_adult: false } });
  return (data.results as Record<string, unknown>[])
    .filter(i => (i.media_type === 'movie' || i.media_type === 'tv') && i.poster_path)
    .map(i => normalize(i, i.media_type as 'movie' | 'tv'));
}

export async function discoverAdvanced(params: Record<string, string | number | boolean>) {
  const type = (params.media_type as string) || 'movie';
  delete params.media_type;

  const apiParams: Record<string, unknown> = {
    include_adult: false,
    include_video: false,
    ...params,
  };

  const { data } = await tmdb.get(`/discover/${type}`, { params: apiParams });
  return {
    results: (data.results as Record<string, unknown>[]).map(i => normalize(i, type as 'movie' | 'tv')),
    total_pages: data.total_pages as number,
    total_results: data.total_results as number,
    page: data.page as number,
  };
}

export async function getGenres(type: 'movie' | 'tv') {
  const { data } = await tmdb.get(`/genre/${type}/list`);
  return data.genres as { id: number; name: string }[];
}

export async function getTVSeason(tvId: number, season: number) {
  const { data } = await tmdb.get(`/tv/${tvId}/season/${season}`);
  return data;
}

export async function getTMDBReviews(type: 'movie' | 'tv', id: number) {
  const { data } = await tmdb.get(`/${type}/${id}/reviews`, { params: { language: 'en-US' } });
  return (data.results as Record<string, unknown>[]).slice(0, 5);
}

export async function getKeywords(type: 'movie' | 'tv', id: number) {
  const { data } = await tmdb.get(`/${type}/${id}/keywords`);
  return (type === 'movie' ? data.keywords : data.results) as { id: number; name: string }[];
}

export async function getSimilar(type: 'movie' | 'tv', id: number) {
  const { data } = await tmdb.get(`/${type}/${id}/similar`);
  return (data.results as Record<string, unknown>[]).slice(0, 12).map(i => normalize(i, type));
}

export async function getWatchProviders(type: 'movie' | 'tv', id: number) {
  const { data } = await tmdb.get(`/${type}/${id}/watch/providers`);
  return data.results?.MX || data.results?.US || null;
}

export async function getPerson(id: number) {
  const { data } = await tmdb.get(`/person/${id}`, {
    params: { append_to_response: 'combined_credits,external_ids' },
  });
  return data as Record<string, unknown>;
}

export async function searchPeople(q: string) {
  const { data } = await tmdb.get('/search/person', { params: { query: q, include_adult: false } });
  return data.results as Record<string, unknown>[];
}

export async function discoverByPerson(personId: number, mediaType: 'movie' | 'tv', role: 'cast' | 'crew') {
  const key = role === 'cast' ? 'with_cast' : 'with_crew';
  const { data } = await tmdb.get(`/discover/${mediaType}`, {
    params: { [key]: personId, sort_by: 'vote_count.desc', include_adult: false },
  });
  return (data.results as Record<string, unknown>[]).map(i => normalize(i, mediaType));
}
