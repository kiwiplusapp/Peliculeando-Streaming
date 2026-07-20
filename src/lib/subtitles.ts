import { ungzip } from 'pako';

// Client-side OpenSubtitles loader. Runs in the browser (residential IP) so it
// isn't blocked like a datacenter/Vercel IP would be — mirroring how the
// original .ru player fetched subtitles.

export interface Sub {
  id: string;
  lang: string;
  label: string;
  url: string; // blob: URL of the VTT
}

const LANGS = [
  { code: 'es', label: 'Español', os: 'spa' },
  { code: 'en', label: 'English', os: 'eng' },
];

export async function loadSubtitles(
  imdbId: string,
  type: 'movie' | 'tv',
  season?: number,
  episode?: number,
): Promise<Sub[]> {
  const num = (imdbId || '').replace(/^tt/i, '');
  if (!num) return [];

  const results = await Promise.all(
    LANGS.map(async (L) => {
      try {
        let url = 'https://rest.opensubtitles.org/search';
        if (type === 'tv') url += `/episode-${episode || 1}/imdbid-${num}/season-${season || 1}`;
        else url += `/imdbid-${num}`;
        url += `/sublanguageid-${L.os}`;

        const res = await fetch(url, { headers: { 'X-User-Agent': 'trailers.to-UA' } });
        if (!res.ok) return null;
        const arr = await res.json();
        if (!Array.isArray(arr) || arr.length === 0) return null;

        const best = arr
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((s: any) => (s.SubFormat || '').toLowerCase() === 'srt' && s.SubDownloadLink)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .sort((a: any, b: any) => Number(b.SubDownloadsCnt || 0) - Number(a.SubDownloadsCnt || 0))[0];
        if (!best) return null;

        const vtt = await downloadVtt(best.SubDownloadLink);
        if (!vtt) return null;

        const blobUrl = URL.createObjectURL(new Blob([vtt], { type: 'text/vtt' }));
        return { id: L.code, lang: L.code, label: L.label, url: blobUrl };
      } catch {
        return null;
      }
    }),
  );

  return LANGS.map((L) => results.find((r) => r && r.id === L.code)).filter(Boolean) as Sub[];
}

async function downloadVtt(dl: string): Promise<string | null> {
  // No custom headers here: the download endpoint's CORS doesn't allow them,
  // and adding one would trigger a failing preflight.
  const ab = await (await fetch(dl)).arrayBuffer();
  let bytes = new Uint8Array(ab);

  // gunzip if gzip magic (1f 8b)
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
    try {
      bytes = ungzip(bytes);
    } catch {
      return null;
    }
  }

  const text = decodeBytes(bytes);
  return text.trimStart().startsWith('WEBVTT') ? text : srtToVtt(text);
}

function decodeBytes(bytes: Uint8Array): string {
  const utf8 = new TextDecoder('utf-8').decode(bytes);
  if (!utf8.includes('�')) return utf8;
  try {
    return new TextDecoder('windows-1252').decode(bytes);
  } catch {
    return utf8;
  }
}

function srtToVtt(srt: string): string {
  const body = srt
    .replace(/\r+/g, '')
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
  return `WEBVTT\n\n${body}`;
}
