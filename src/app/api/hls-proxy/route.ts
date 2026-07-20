import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

function decodeHeaders(h: string | null): Record<string, string> {
  if (!h) return {};
  try {
    return JSON.parse(Buffer.from(h, 'base64').toString('utf-8'));
  } catch {
    return {};
  }
}

function proxify(absUrl: string, hParam: string | null): string {
  const u = `/api/hls-proxy?url=${encodeURIComponent(absUrl)}`;
  return hParam ? `${u}&h=${encodeURIComponent(hParam)}` : u;
}

function isPlaylist(url: string, contentType: string): boolean {
  const ct = contentType.toLowerCase();
  if (ct.includes('mpegurl') || ct.includes('vnd.apple.mpegurl')) return true;
  return new URL(url).pathname.toLowerCase().endsWith('.m3u8');
}

function rewritePlaylist(text: string, baseUrl: string, hParam: string | null): string {
  const abs = (u: string) => new URL(u, baseUrl).href;
  const lines = text.split('\n');

  return lines
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed === '') return line;

      if (trimmed.startsWith('#')) {
        // Rewrite URI="..." attributes (EXT-X-KEY / EXT-X-MEDIA audio / EXT-X-MAP)
        if (trimmed.includes('URI="')) {
          return line.replace(/URI="([^"]+)"/g, (_m, uri) => `URI="${proxify(abs(uri), hParam)}"`);
        }
        return line;
      }

      // A media segment or nested playlist URI
      return proxify(abs(trimmed), hParam);
    })
    .join('\n');
}

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get('url');
  const hParam = req.nextUrl.searchParams.get('h');

  if (!target || !/^https?:\/\//i.test(target)) {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  const headers: Record<string, string> = {
    'User-Agent': DEFAULT_UA,
    ...decodeHeaders(hParam),
  };
  // Forward Range for direct file (mp4) seeking
  const range = req.headers.get('range');
  if (range) headers['Range'] = range;

  let upstream: Response;
  try {
    upstream = await fetch(target, { headers, redirect: 'follow' });
  } catch (e) {
    return NextResponse.json(
      { error: 'Upstream fetch failed', detail: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }

  const contentType = upstream.headers.get('content-type') || '';

  // Rewrite HLS playlists so every child URL also flows through this proxy
  if (isPlaylist(target, contentType)) {
    const text = await upstream.text();
    const rewritten = rewritePlaylist(text, target, hParam);
    return new NextResponse(rewritten, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // Binary passthrough (segments, keys, mp4) — preserve range/streaming
  const respHeaders = new Headers();
  const copy = ['content-type', 'content-length', 'accept-ranges', 'content-range'];
  for (const k of copy) {
    const v = upstream.headers.get(k);
    if (v) respHeaders.set(k, v);
  }
  respHeaders.set('Cache-Control', 'no-store');
  respHeaders.set('Access-Control-Allow-Origin', '*');

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: respHeaders,
  });
}
