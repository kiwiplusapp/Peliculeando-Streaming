import { NextRequest, NextResponse } from 'next/server';
import { getPerson } from '@/lib/tmdb';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const person = await getPerson(Number(params.id));
    return NextResponse.json(person);
  } catch {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }
}
