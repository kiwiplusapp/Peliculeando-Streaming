import { NextRequest, NextResponse } from 'next/server';
import zlib from 'zlib';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Downloads a subtitle (OpenSubtitles .gz, plain .srt, or .vtt) and returns VTT.
export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get('src');
  if (!src || !/^https?:\/\//i.test(src)) {
    return NextResponse.json({ error: 'Invalid src' }, { status: 400 });
  }

  try {
    const res = await fetch(src, {
      headers: {
        'X-User-Agent': 'trailers.to-UA',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      },
      redirect: 'follow',
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Upstream ${res.status}` }, { status: 502 });
    }

    const buf = Buffer.from(await res.arrayBuffer());

    // Gunzip if gzip-magic (1f 8b)
    let text: string;
    if (buf[0] === 0x1f && buf[1] === 0x8b) {
      text = zlib.gunzipSync(buf).toString('latin1');
    } else {
      text = buf.toString('utf-8');
    }

    // Convert SRT -> VTT if it isn't already VTT
    const vtt = text.trimStart().startsWith('WEBVTT') ? text : srtToVtt(text);

    return new NextResponse(vtt, {
      status: 200,
      headers: {
        'Content-Type': 'text/vtt; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: 'subs failed', detail: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

function srtToVtt(srt: string): string {
  const body = srt
    .replace(/\r+/g, '')
    // 00:00:00,000 --> 00:00:00,000  =>  dots
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
  return `WEBVTT\n\n${body}`;
}
