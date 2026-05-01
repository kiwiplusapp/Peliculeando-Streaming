import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getPerson, imgUrl } from '@/lib/tmdb';
import { Calendar, MapPin, Star, Film, Tv } from 'lucide-react';

export const revalidate = 3600;

interface CreditItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type: 'movie' | 'tv';
  character?: string;
  job?: string;
  vote_count: number;
}

export default async function PersonPage({ params }: { params: { id: string } }) {
  let person: Record<string, unknown>;
  try {
    person = await getPerson(Number(params.id));
  } catch {
    notFound();
  }

  if (!person?.id) notFound();

  const name = person.name as string;
  const bio = person.biography as string;
  const birthday = person.birthday as string | null;
  const deathday = person.deathday as string | null;
  const placeOfBirth = person.place_of_birth as string | null;
  const knownFor = person.known_for_department as string;
  const profilePath = person.profile_path as string | null;

  const credits = person.combined_credits as { cast: CreditItem[]; crew: CreditItem[] } | undefined;

  // Deduplicate and sort by vote_count
  const seen = new Set<number>();
  const allCredits: CreditItem[] = [
    ...(credits?.cast || []),
    ...(credits?.crew || []).filter(c => c.job === 'Director' || c.job === 'Producer'),
  ]
    .filter(c => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return c.poster_path && c.vote_count > 10;
    })
    .sort((a, b) => b.vote_count - a.vote_count)
    .slice(0, 40);

  const movies = allCredits.filter(c => c.media_type === 'movie');
  const tvShows = allCredits.filter(c => c.media_type === 'tv');

  const age = birthday
    ? Math.floor((Date.now() - new Date(birthday).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null;

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-[1400px] mx-auto px-6">
        {/* Header */}
        <div className="flex gap-8 items-start mb-12">
          <div className="shrink-0">
            <div className="w-40 h-40 sm:w-52 sm:h-52 rounded-2xl overflow-hidden bg-[#181818] border border-[#262626] shadow-2xl">
              {profilePath ? (
                <Image
                  src={`https://image.tmdb.org/t/p/w300${profilePath}`}
                  alt={name}
                  width={208} height={208}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-[#333333]">
                  {name[0]}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1">
            <div className="mb-2">
              <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-medium">
                {knownFor === 'Acting' ? 'Actor / Actriz' : knownFor === 'Directing' ? 'Director/a' : knownFor}
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">{name}</h1>

            <div className="flex flex-wrap gap-4 text-sm text-[#A3A3A3] mb-5">
              {birthday && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  {new Date(birthday).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                  {age && !deathday && <span className="text-[#525252]">({age} años)</span>}
                </span>
              )}
              {placeOfBirth && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} />
                  {placeOfBirth}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Film size={14} />
                {movies.length} películas
              </span>
              <span className="flex items-center gap-1.5">
                <Tv size={14} />
                {tvShows.length} series
              </span>
            </div>

            {bio && (
              <p className="text-[#A3A3A3] leading-relaxed max-w-3xl line-clamp-4 sm:line-clamp-6">
                {bio}
              </p>
            )}
          </div>
        </div>

        {/* Movies */}
        {movies.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
              <Film size={18} className="text-amber-400" />
              Películas destacadas
            </h2>
            <CreditGrid items={movies} />
          </section>
        )}

        {/* TV */}
        {tvShows.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
              <Tv size={18} className="text-amber-400" />
              Series destacadas
            </h2>
            <CreditGrid items={tvShows} />
          </section>
        )}
      </div>
    </div>
  );
}

function CreditGrid({ items }: { items: CreditItem[] }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
      {items.slice(0, 21).map(item => {
        const title = item.title || item.name || '';
        const year = (item.release_date || item.first_air_date || '').slice(0, 4);
        const poster = imgUrl(item.poster_path, 'w342');
        const scoreColor = item.vote_average >= 7 ? '#10b981' : item.vote_average >= 5 ? '#fbbf24' : '#ef4444';

        return (
          <Link
            key={`${item.media_type}-${item.id}`}
            href={`/${item.media_type}/${item.id}`}
            className="group"
          >
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-[#181818] border border-[#262626] transition-all group-hover:-translate-y-1 group-hover:border-amber-500/40">
              {poster ? (
                <Image
                  src={poster} alt={title} fill sizes="160px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[#525252]">
                  <Film size={24} />
                </div>
              )}
              <div className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-bold bg-black/80" style={{ color: scoreColor }}>
                <Star size={9} fill={scoreColor} />
                {item.vote_average.toFixed(1)}
              </div>
            </div>
            <p className="mt-1.5 text-xs text-white line-clamp-1 font-medium">{title}</p>
            {year && <p className="text-xs text-[#525252]">{year}</p>}
            {item.character && <p className="text-xs text-[#525252] italic line-clamp-1">{item.character}</p>}
          </Link>
        );
      })}
    </div>
  );
}
