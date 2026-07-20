import { NextRequest, NextResponse } from 'next/server';
import { scrapeStream } from '@/lib/stream';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // scraping can be slow

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const type = sp.get('type');
  const id = Number(sp.get('id'));

  if ((type !== 'movie' && type !== 'tv') || !id) {
    return NextResponse.json({ error: 'Missing/invalid type or id' }, { status: 400 });
  }

  try {
    const result = await scrapeStream({
      type,
      id,
      season: Number(sp.get('season')) || undefined,
      episode: Number(sp.get('episode')) || undefined,
    });

    if (!result) {
      return NextResponse.json({ error: 'No stream found' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: 'Scrape failed', detail: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
