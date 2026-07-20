// Server-side resolver for the vaplayer (justhd) source. It hits vaplayer's
// own JSON API — the same backend the .ru embed used — and returns the raw
// master.m3u8 so we can play it in our own ad-free player. Subtitles are
// fetched from OpenSubtitles (same source the .ru player used). Never import
// on the client.

const API = 'https://streamdata.vaplayer.ru/api.php';
// The stream host validates this referer (the real player's origin).
const STREAM_REFERER = 'https://nextgencloudfabric.com/';

// (label shown in the menu, OpenSubtitles language id)
const SUB_LANGS: { code: string; label: string; os: string }[] = [
  { code: 'es', label: 'Español', os: 'spa' },
  { code: 'en', label: 'English', os: 'eng' },
];

export interface Caption {
  id: string;
  lang: string;   // BCP-47-ish code for <track srclang>
  label: string;  // menu label
  url: string;    // ready-to-use track URL (already /api/subs...)
}

export interface ScrapedStream {
  sourceId: string;
  type: 'hls' | 'file';
  playlist?: string;
  qualities?: Record<string, { type: string; url: string }>;
  headers: Record<string, string>;
  captions: Caption[];
  fallbacks?: string[];
}

export interface Attempt {
  provider: string;
  stage: string;
  ok: boolean;
  note?: string;
}

export interface ScrapeResponse {
  result: ScrapedStream | null;
  attempts: Attempt[];
  media: { title: string; year: number };
}

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`timeout ${label} ${ms}ms`)), ms)),
  ]);
}

// Look up the best subtitle per language on OpenSubtitles (legacy REST).
async function fetchSubtitles(
  imdbId: string,
  type: 'movie' | 'tv',
  season?: number,
  episode?: number,
): Promise<Caption[]> {
  const num = imdbId.replace(/^tt/i, '');
  if (!num) return [];

  const out: Caption[] = [];
  await Promise.all(
    SUB_LANGS.map(async (L) => {
      try {
        let url = 'https://rest.opensubtitles.org/search';
        if (type === 'tv') {
          url += `/episode-${episode || 1}/imdbid-${num}/season-${season || 1}`;
        } else {
          url += `/imdbid-${num}`;
        }
        url += `/sublanguageid-${L.os}`;

        const res = await withTimeout(
          fetch(url, { headers: { 'X-User-Agent': 'trailers.to-UA' } }),
          10_000,
          `os.${L.os}`,
        );
        if (!res.ok) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const arr: any[] = await res.json();
        if (!Array.isArray(arr) || arr.length === 0) return;

        // Prefer srt with the most downloads
        const best = arr
          .filter((s) => (s.SubFormat || '').toLowerCase() === 'srt' && s.SubDownloadLink)
          .sort((a, b) => Number(b.SubDownloadsCnt || 0) - Number(a.SubDownloadsCnt || 0))[0];
        if (!best) return;

        out.push({
          id: L.code,
          lang: L.code,
          label: L.label,
          url: `/api/subs?src=${encodeURIComponent(best.SubDownloadLink)}`,
        });
      } catch {
        /* ignore this language */
      }
    }),
  );
  // Keep a stable order (es, en)
  return SUB_LANGS.map((L) => out.find((c) => c.id === L.code)).filter(Boolean) as Caption[];
}

export async function scrapeStream(opts: {
  type: 'movie' | 'tv';
  id: number;
  season?: number;
  episode?: number;
}): Promise<ScrapeResponse> {
  const attempts: Attempt[] = [];

  const params = new URLSearchParams({ tmdb: String(opts.id), type: opts.type });
  if (opts.type === 'tv') {
    params.set('season', String(opts.season || 1));
    params.set('episode', String(opts.episode || 1));
  }
  const url = `${API}?${params.toString()}`;

  try {
    const res = await withTimeout(
      fetch(url, {
        headers: {
          'User-Agent': BROWSER_UA,
          Referer: STREAM_REFERER,
          Origin: STREAM_REFERER.replace(/\/$/, ''),
          'X-Requested-With': 'XMLHttpRequest',
        },
      }),
      15_000,
      'vaplayer.api',
    );

    if (!res.ok) {
      attempts.push({ provider: 'vaplayer', stage: 'api', ok: false, note: `HTTP ${res.status}` });
      return { result: null, attempts, media: { title: '', year: 0 } };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const j: any = await res.json();
    const data = j?.data;
    const streams: string[] = Array.isArray(data?.stream_urls) ? data.stream_urls : [];
    const title: string = data?.title || '';
    const imdbId: string = data?.imdb_id || '';

    if (j?.status_code !== '200' || streams.length === 0) {
      attempts.push({
        provider: 'vaplayer',
        stage: 'parse',
        ok: false,
        note: `status=${j?.status_code} streams=${streams.length}`,
      });
      return { result: null, attempts, media: { title, year: 0 } };
    }

    // Fetch subtitles in parallel (best-effort; never blocks playback on failure)
    let captions: Caption[] = [];
    if (imdbId) {
      captions = await fetchSubtitles(imdbId, opts.type, opts.season, opts.episode).catch(() => []);
    }

    attempts.push({
      provider: 'vaplayer',
      stage: 'ok',
      ok: true,
      note: `${streams.length} streams · ${captions.length} subs`,
    });

    return {
      media: { title, year: 0 },
      attempts,
      result: {
        sourceId: 'vaplayer',
        type: 'hls',
        playlist: streams[0],
        fallbacks: streams.slice(1),
        headers: { Referer: STREAM_REFERER, Origin: STREAM_REFERER.replace(/\/$/, '') },
        captions,
      },
    };
  } catch (e) {
    attempts.push({
      provider: 'vaplayer',
      stage: 'api',
      ok: false,
      note: e instanceof Error ? e.message.slice(0, 120) : String(e).slice(0, 120),
    });
    return { result: null, attempts, media: { title: '', year: 0 } };
  }
}
