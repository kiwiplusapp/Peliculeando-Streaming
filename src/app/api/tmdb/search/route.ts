import { NextRequest, NextResponse } from 'next/server';
import { searchMulti } from '@/lib/tmdb';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  const page = Number(req.nextUrl.searchParams.get('page') || 1);
  if (!q) return NextResponse.json({ results: [], total_pages: 0 });
  try {
    const results = await searchMulti(q, page);
    return NextResponse.json({ results, total_pages: 5 });
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
