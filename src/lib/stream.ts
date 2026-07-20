import { MOVIES } from '@consumet/extensions';
import { getDetailFull, getTVSeason } from './tmdb';

// Server-side scraper using Consumet. Tries several sources in cascade so a
// single dead provider doesn't break playback. Never import on the client.
const PROVIDERS = [
  { id: 'flixhq', make: () => new MOVIES.FlixHQ() },
  { id: 'sflix', make: () => new MOVIES.SFlix() },
  { id: 'himovies', make: () => new MOVIES.HiMovies() },
  { id: 'goku', make: () => new MOVIES.Goku() },
];

export interface ScrapedStream {
  sourceId: string;
  type: 'hls' | 'file';
  playlist?: string;
  qualities?: Record<string, { type: string; url: string }>;
  headers: Record<string, string>;
  captions: { id: string; language: string; url: string; type: string }[];
}

const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export async function scrapeStream(opts: {
  type: 'movie' | 'tv';
  id: number;
  season?: number;
  episode?: number;
}): Promise<ScrapedStream | null> {
  const d = await getDetailFull(opts.type, opts.id);
  const title: string = opts.type === 'movie' ? d.title : d.name;
  const origTitle: string = opts.type === 'movie' ? d.original_title : d.original_name;
  const dateStr: string = opts.type === 'movie' ? d.release_date : d.first_air_date;
  const year = Number((dateStr || '').slice(0, 4)) || 0;
  const wantedType = opts.type === 'movie' ? 'Movie' : 'TV Series';
  const queries = Array.from(new Set([origTitle, title].filter(Boolean)));

  for (const p of PROVIDERS) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prov: any = p.make();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let match: any = null;
      for (const q of queries) {
        const res = await prov.search(q);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cands = (res.results || []).filter((r: any) => r.type === wantedType);
        match =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cands.find((r: any) => norm(r.title) === norm(q) && (!year || String(r.releaseDate || '').includes(String(year)))) ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cands.find((r: any) => norm(r.title) === norm(q)) ||
          cands[0];
        if (match) break;
      }
      if (!match) continue;

      const info = await prov.fetchMediaInfo(match.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let ep: any;
      if (opts.type === 'movie') {
        ep = info.episodes?.[0];
      } else {
        const seasonNum = opts.season || 1;
        const episodeNum = opts.episode || 1;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ep = (info.episodes || []).find((e: any) => e.season === seasonNum && e.number === episodeNum);
      }
      if (!ep) continue;

      const s = await prov.fetchEpisodeSources(ep.id, info.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const chosen = (s.sources || []).find((x: any) => x.isM3U8) || s.sources?.[0];
      if (!chosen) continue;

      return {
        sourceId: p.id,
        type: chosen.isM3U8 ? 'hls' : 'file',
        playlist: chosen.isM3U8 ? chosen.url : undefined,
        qualities: !chosen.isM3U8 ? { default: { type: 'mp4', url: chosen.url } } : undefined,
        headers: s.headers || {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        captions: (s.subtitles || []).map((c: any) => ({
          id: c.lang || c.id || 'sub',
          language: c.lang || 'sub',
          url: c.url,
          type: 'vtt',
        })),
      };
    } catch {
      continue;
    }
  }

  // getTVSeason kept imported for potential future episode-id matching
  void getTVSeason;
  return null;
}
