import { MOVIES } from '@consumet/extensions';
import { getDetailFull, getTVSeason } from './tmdb';

// Server-side scraper using Consumet. Tries several sources in cascade, each
// step time-boxed, and reports per-provider diagnostics. Never import on client.
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

export interface Attempt {
  provider: string;
  stage: 'search' | 'info' | 'sources' | 'match' | 'ok';
  ok: boolean;
  note?: string;
}

export interface ScrapeResponse {
  result: ScrapedStream | null;
  attempts: Attempt[];
  media: { title: string; year: number };
}

const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`timeout ${label} ${ms}ms`)), ms)),
  ]);
}

const TIME_BUDGET_MS = 45_000; // stay under the 60s serverless limit

export async function scrapeStream(opts: {
  type: 'movie' | 'tv';
  id: number;
  season?: number;
  episode?: number;
}): Promise<ScrapeResponse> {
  const startedAt = Date.now();
  const attempts: Attempt[] = [];

  const d = await getDetailFull(opts.type, opts.id);
  const title: string = opts.type === 'movie' ? d.title : d.name;
  const origTitle: string = opts.type === 'movie' ? d.original_title : d.original_name;
  const dateStr: string = opts.type === 'movie' ? d.release_date : d.first_air_date;
  const year = Number((dateStr || '').slice(0, 4)) || 0;
  const wantedType = opts.type === 'movie' ? 'Movie' : 'TV Series';
  const queries = Array.from(new Set([origTitle, title].filter(Boolean)));

  for (const p of PROVIDERS) {
    if (Date.now() - startedAt > TIME_BUDGET_MS) {
      attempts.push({ provider: p.id, stage: 'search', ok: false, note: 'skipped: time budget exceeded' });
      continue;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prov: any = p.make();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let match: any = null;
      for (const q of queries) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res: any = await withTimeout(prov.search(q), 12_000, `${p.id}.search`);
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
      if (!match) {
        attempts.push({ provider: p.id, stage: 'match', ok: false, note: 'no matching title' });
        continue;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const info: any = await withTimeout(prov.fetchMediaInfo(match.id), 12_000, `${p.id}.info`);
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
      if (!ep) {
        attempts.push({ provider: p.id, stage: 'info', ok: false, note: 'episode not found' });
        continue;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s: any = await withTimeout(prov.fetchEpisodeSources(ep.id, info.id), 18_000, `${p.id}.sources`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const chosen = (s.sources || []).find((x: any) => x.isM3U8) || s.sources?.[0];
      if (!chosen) {
        attempts.push({ provider: p.id, stage: 'sources', ok: false, note: 'no playable source' });
        continue;
      }

      attempts.push({ provider: p.id, stage: 'ok', ok: true, note: chosen.isM3U8 ? 'hls' : 'file' });
      return {
        media: { title, year },
        attempts,
        result: {
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
        },
      };
    } catch (e) {
      attempts.push({
        provider: p.id,
        stage: 'search',
        ok: false,
        note: e instanceof Error ? e.message.slice(0, 120) : String(e).slice(0, 120),
      });
      continue;
    }
  }

  void getTVSeason;
  return { result: null, attempts, media: { title, year } };
}
