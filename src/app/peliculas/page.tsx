import { getPopular, getTopRated } from '@/lib/tmdb';
import { Carousel } from '@/components/media/Carousel';

export const metadata = { title: 'Películas — Peliculeando' };
export const revalidate = 300;

export default async function PeliculasPage() {
  const [popular, topRated] = await Promise.all([
    getPopular('movie'),
    getTopRated('movie'),
  ]);

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-[1400px] mx-auto px-6 mb-6">
        <h1 className="text-2xl font-bold text-white">Películas</h1>
      </div>
      <Carousel title="Más populares" items={popular.results} href="/explorar?media_type=movie&sort_by=popularity.desc" accent="#f59e0b" />
      <Carousel title="Mejor valoradas" items={topRated.results} href="/explorar?media_type=movie&sort_by=vote_average.desc" accent="#10b981" />
    </div>
  );
}
