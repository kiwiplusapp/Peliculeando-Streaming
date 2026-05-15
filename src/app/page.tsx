import { getTrending, getPopular, getTopRated } from '@/lib/tmdb';
import { HeroSection } from '@/components/media/HeroSection';
import { Carousel } from '@/components/media/Carousel';
import { RecommendationsSection } from '@/components/media/RecommendationsSection';
import { WeeklyTopSection } from '@/components/media/WeeklyTopSection';
import { ContinueWatchingSection } from '@/components/media/ContinueWatchingSection';
import { getSession } from '@/lib/auth';

export const revalidate = 300; // 5 min cache

export default async function HomePage() {
  const [trending, popularMovies, popularTV, topMovies] = await Promise.all([
    getTrending('all', 'week'),
    getPopular('movie'),
    getPopular('tv'),
    getTopRated('movie'),
  ]);

  const session = await getSession();
  const hero = trending.slice(0, 5);
  const trendingRest = trending.slice(5, 25);

  return (
    <>
      <HeroSection items={hero} />

      <div className="mt-8">
        <ContinueWatchingSection />
        <RecommendationsSection userId={session?.sub} />

        <WeeklyTopSection />

        <Carousel
          title="Tendencias de la semana"
          items={trendingRest}
          href="/explorar"
          showRank
        />

        <Carousel
          title="Películas populares"
          items={popularMovies.results}
          href="/peliculas"
        />

        <Carousel
          title="Series populares"
          items={popularTV.results}
          href="/series"
        />

        <Carousel
          title="Lo mejor del cine"
          items={topMovies.results}
          href="/peliculas"
        />


      </div>
    </>
  );
}
