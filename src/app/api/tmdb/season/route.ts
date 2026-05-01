import { NextRequest, NextResponse } from 'next/server';
import { getTVSeason } from '@/lib/tmdb';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  const season = req.nextUrl.searchParams.get('season');
  if (!id || !season) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  try {
    const data = await getTVSeason(Number(id), Number(season));
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
