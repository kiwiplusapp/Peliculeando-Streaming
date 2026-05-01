import { getPopular, getTopRated } from '@/lib/tmdb';
import { Carousel } from '@/components/media/Carousel';

export const metadata = { title: 'Series — Peliculeando' };
export const revalidate = 300;

export default async function SeriesPage() {
  const [popular, topRated] = await Promise.all([
    getPopular('tv'),
    getTopRated('tv'),
  ]);

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-[1400px] mx-auto px-6 mb-6">
        <h1 className="text-2xl font-bold text-white">Series</h1>
      </div>
      <Carousel title="Más populares" items={popular.results} href="/explorar?media_type=tv&sort_by=popularity.desc" />
      <Carousel title="Mejor valoradas" items={topRated.results} href="/explorar?media_type=tv&sort_by=vote_average.desc" />
    </div>
  );
}
