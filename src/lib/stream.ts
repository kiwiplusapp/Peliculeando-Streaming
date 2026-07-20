import { makeProviders, makeStandardFetcher, targets } from '@movie-web/providers';
import { getDetailFull, getTVSeason } from './tmdb';

// Server-side scraper. Runs the movie-web providers against public sources and
// returns the raw stream link + audio/caption info. Never import this on the client.
const providers = makeProviders({
  fetcher: makeStandardFetcher(fetch),
  target: targets.NATIVE, // running on the server: no CORS, headers can be set freely
});

export interface ScrapedStream {
  sourceId: string;
  type: 'hls' | 'file';
  /** master playlist URL (hls) */
  playlist?: string;
  /** direct file qualities (file) */
  qualities?: Record<string, { type: string; url: string }>;
  /** headers required to fetch the stream (Referer/Origin/User-Agent) */
  headers: Record<string, string>;
  captions: { id: string; language: string; url: string; type: string }[];
}

export async function scrapeStream(opts: {
  type: 'movie' | 'tv';
  id: number;
  season?: number;
  episode?: number;
}): Promise<ScrapedStream | null> {
  const d = await getDetailFull(opts.type, opts.id);
  const title: string = opts.type === 'movie' ? d.title : d.name;
  const dateStr: string = opts.type === 'movie' ? d.release_date : d.first_air_date;
  const releaseYear = Number((dateStr || '').slice(0, 4)) || 0;
  const imdbId: string | undefined =
    opts.type === 'movie' ? d.imdb_id : d.external_ids?.imdb_id;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let media: any;
  if (opts.type === 'movie') {
    media = { type: 'movie', title, releaseYear, tmdbId: String(opts.id), imdbId };
  } else {
    const seasonNum = opts.season || 1;
    const episodeNum = opts.episode || 1;
    const seasonData = await getTVSeason(opts.id, seasonNum);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ep = (seasonData.episodes || []).find((e: any) => e.episode_number === episodeNum);
    media = {
      type: 'show',
      title,
      releaseYear,
      tmdbId: String(opts.id),
      imdbId,
      season: { number: seasonNum, tmdbId: String(seasonData.id || '') },
      episode: { number: episodeNum, tmdbId: String(ep?.id || '') },
    };
  }

  const output = await providers.runAll({ media });
  if (!output) return null;

  const s = output.stream;
  return {
    sourceId: output.sourceId,
    type: s.type,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    playlist: (s as any).playlist,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    qualities: (s as any).qualities,
    headers: { ...(s.preferredHeaders || {}), ...(s.headers || {}) },
    captions: (s.captions || []).map((c) => ({
      id: c.id,
      language: c.language,
      url: c.url,
      type: c.type,
    })),
  };
}
