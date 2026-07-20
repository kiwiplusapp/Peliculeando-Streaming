// Server-side resolver for the vaplayer (justhd) source. It hits vaplayer's
// own JSON API — the same backend the .ru embed used — and returns the raw
// master.m3u8 so we can play it in our own ad-free player. Never import on client.

const API = 'https://streamdata.vaplayer.ru/api.php';
// The stream host validates this referer (the real player's origin).
const STREAM_REFERER = 'https://nextgencloudfabric.com/';

export interface ScrapedStream {
  sourceId: string;
  type: 'hls' | 'file';
  playlist?: string;
  qualities?: Record<string, { type: string; url: string }>;
  headers: Record<string, string>;
  captions: { id: string; language: string; url: string; type: string }[];
  /** alternate mirrors, in case the first playlist fails client-side */
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

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`timeout ${label} ${ms}ms`)), ms)),
  ]);
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
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
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

    if (j?.status_code !== '200' || streams.length === 0) {
      attempts.push({
        provider: 'vaplayer',
        stage: 'parse',
        ok: false,
        note: `status=${j?.status_code} streams=${streams.length}`,
      });
      return { result: null, attempts, media: { title, year: 0 } };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const captions = (Array.isArray(data?.default_subs) ? data.default_subs : []).map((c: any, i: number) => ({
      id: String(c.lang || c.label || i),
      language: c.lang || c.label || 'sub',
      url: c.file || c.url || c.src || '',
      type: 'vtt',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    })).filter((c: any) => c.url);

    attempts.push({ provider: 'vaplayer', stage: 'ok', ok: true, note: `${streams.length} streams` });

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
