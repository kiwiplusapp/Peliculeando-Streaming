import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getUserRecommendations } from '@/lib/recommendations';
import { getTrending } from '@/lib/tmdb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);

  try {
    if (!session) {
      const trending = await getTrending('all', 'week');
      return NextResponse.json({ items: trending.slice(0, 20), personalized: false });
    }

    const items = await getUserRecommendations(Number(session.sub));
    return NextResponse.json({ items, personalized: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
