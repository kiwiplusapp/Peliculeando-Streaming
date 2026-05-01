import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getDetailFull, getSimilar, imgUrl } from '@/lib/tmdb';
import { getOmdbRatings } from '@/lib/omdb';
import { getSession } from '@/lib/auth';
import { PlayerButton } from '@/components/media/PlayerButton';
import { WatchlistButton } from '@/components/media/WatchlistButton';
import { AddToCollectionButton } from '@/components/media/AddToCollectionButton';
import { ReviewSection } from '@/components/media/ReviewSection';
import { TagSection } from '@/components/media/TagSection';
import { Carousel } from '@/components/media/Carousel';
import Link from 'next/link';
import { Star, Clock, Calendar, Globe, Tv, Users } from 'lucide-react';

export const revalidate = 600;

export default async function DetailPage({ params }: { params: { type: string; id: string } }) {
  const { type, id } = params;
  if (type !== 'movie' && type !== 'tv') notFound();

  let item: Record<string, unknown>;
  let similar;
  try {
    [item, similar] = await Promise.all([
      getDetailFull(type, Number(id)),
      getSimilar(type, Number(id)),
    ]);
  } catch {
    notFound();
  }

  const session = await getSession();

  const title = type === 'tv' ? item.name : item.title;
  const year = ((type === 'tv' ? item.first_air_date : item.release_date) as string)?.slice(0, 4);
  const runtime = type === 'movie'
    ? (item.runtime as number)
    : ((item.episode_run_time as number[])?.[0]);
  const genres = (item.genres as { id: number; name: string }[]) || [];
  const backdrop = imgUrl(item.backdrop_path as string, 'original');
  const poster = imgUrl(item.poster_path as string, 'w500');
  const score = (item.vote_average as number) || 0;
  const tagline = item.tagline as string;
  const overview = item.overview as string;
  const tmdbId = item.id as number;

  // External ratings (OMDB)
  const externalIds = item.external_ids as Record<string, string> | undefined;
  const imdbId = externalIds?.imdb_id || (item.imdb_id as string);
  const omdb = imdbId ? await getOmdbRatings(imdbId).catch(() => null) : null;

  const scoreColor = score >= 7 ? '#10b981' : score >= 5 ? '#fbbf24' : '#ef4444';

  const credits = item.credits as {
    cast?: { id: number; name: string; character: string; profile_path: string | null }[];
    crew?: { id: number; name: string; job: string; profile_path: string | null }[];
  } | undefined;

  const directors = (credits?.crew || []).filter(c => c.job === 'Director');

  const mediaItem = {
    tmdb_id: tmdbId,
    media_type: type as 'movie' | 'tv',
    title: title as string,
    poster_path: item.poster_path as string,
    backdrop_path: item.backdrop_path as string,
    vote_average: score,
    overview: overview,
    release_date: (type === 'tv' ? item.first_air_date : item.release_date) as string,
    popularity: (item.popularity as number) || 0,
    original_title: (type === 'tv' ? item.original_name : item.original_title) as string,
    number_of_seasons: (item.number_of_seasons as number) || 0,
  };

  return (
    <div className="min-h-screen">
      {/* Backdrop */}
      <div className="relative h-[50vh] sm:h-[60vh] overflow-hidden">
        {backdrop && (
          <Image src={backdrop} alt={title as string} fill sizes="100vw" className="object-cover" priority />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/50 to-[#0A0A0A]/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
      </div>

      {/* Main content */}
      <div className="max-w-[1400px] mx-auto px-6 -mt-48 relative z-10">
        <div className="flex gap-8 items-start">
          {/* Poster */}
          <div className="shrink-0 hidden sm:block">
            <div className="w-48 rounded-xl overflow-hidden border border-[#262626] shadow-2xl">
              {poster ? (
                <Image src={poster} alt={title as string} width={192} height={288} className="w-full" />
              ) : (
                <div className="aspect-[2/3] bg-[#181818]" />
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 pt-32">
            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-3">
              {genres.slice(0, 3).map((g) => (
                <span key={g.id} className="text-xs px-2.5 py-1 rounded-full border border-[#333333] text-[#A3A3A3]">
                  {g.name}
                </span>
              ))}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 leading-tight">
              {title as string}
            </h1>

            {tagline && (
              <p className="text-[#A3A3A3] italic mb-4 text-sm">&ldquo;{tagline}&rdquo;</p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 mb-5 text-sm">
              <div className="flex items-center gap-1.5" style={{ color: scoreColor }}>
                <Star size={15} fill={scoreColor} />
                <span className="font-bold text-base">{score.toFixed(1)}</span>
                <span className="text-[#525252]">/10</span>
              </div>
              {year && (
                <div className="flex items-center gap-1.5 text-[#A3A3A3]">
                  <Calendar size={14} />
                  {year}
                </div>
              )}
              {runtime && (
                <div className="flex items-center gap-1.5 text-[#A3A3A3]">
                  <Clock size={14} />
                  {runtime} min
                </div>
              )}
              {type === 'tv' && (item.number_of_seasons as number) > 0 && (
                <div className="flex items-center gap-1.5 text-[#A3A3A3]">
                  <Tv size={14} />
                  {item.number_of_seasons as number} temporada{(item.number_of_seasons as number) !== 1 ? 's' : ''}
                </div>
              )}
              {(item.original_language as string) && (
                <div className="flex items-center gap-1.5 text-[#A3A3A3]">
                  <Globe size={14} />
                  {(item.original_language as string).toUpperCase()}
                </div>
              )}
            </div>

            {/* External ratings */}
            {omdb && (
              <div className="flex flex-wrap gap-3 mb-5">
                {omdb.imdbRating && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[#181818] border border-[#262626] rounded-lg">
                    <span className="text-amber-400 font-bold text-sm">IMDb</span>
                    <span className="text-white text-sm font-semibold">{omdb.imdbRating}</span>
                  </div>
                )}
                {omdb.rottenTomatoes && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[#181818] border border-[#262626] rounded-lg">
                    <span className="text-red-400 font-bold text-sm">RT</span>
                    <span className="text-white text-sm font-semibold">{omdb.rottenTomatoes}</span>
                  </div>
                )}
                {omdb.metacritic && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[#181818] border border-[#262626] rounded-lg">
                    <span className="text-emerald-400 font-bold text-sm">MC</span>
                    <span className="text-white text-sm font-semibold">{omdb.metacritic}</span>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              <PlayerButton item={mediaItem} />
              <WatchlistButton item={mediaItem} />
              {session && (
                <AddToCollectionButton
                  tmdbId={tmdbId}
                  mediaType={type as 'movie' | 'tv'}
                  title={title as string}
                  posterPath={item.poster_path as string | null}
                />
              )}
            </div>

            {overview && (
              <p className="text-[#A3A3A3] leading-relaxed max-w-2xl">{overview}</p>
            )}

            {directors.length > 0 && (
              <p className="mt-3 text-sm text-[#525252]">
                Dirección:{' '}
                {directors.map((d, i) => (
                  <span key={d.id}>
                    {i > 0 && ', '}
                    <Link href={`/personas/${d.id}`} className="text-[#A3A3A3] hover:text-amber-400 transition-colors">
                      {d.name}
                    </Link>
                  </span>
                ))}
              </p>
            )}

            {omdb?.awards && (
              <p className="mt-3 text-xs text-[#525252] italic">{omdb.awards}</p>
            )}
          </div>
        </div>

        {/* Cast */}
        {(() => {
          const cast = credits?.cast?.slice(0, 12) || [];
          if (!cast.length) return null;
          return (
            <div className="mt-10">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Users size={18} className="text-amber-400" />
                Reparto
              </h2>
              <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2">
                {cast.map(person => (
                  <Link
                    key={person.id}
                    href={`/personas/${person.id}`}
                    className="shrink-0 w-24 group"
                  >
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-[#181818] border border-[#262626] group-hover:border-amber-500/40 transition-colors mb-2">
                      {person.profile_path ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                          alt={person.name}
                          width={96} height={96}
                          className="object-cover object-top w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-bold text-[#333333]">
                          {person.name[0]}
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-medium text-white line-clamp-2 leading-tight">{person.name}</p>
                    <p className="text-xs text-[#525252] line-clamp-1 mt-0.5">{person.character}</p>
                  </Link>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Tags */}
        <div className="mt-10">
          <TagSection
            tmdbId={tmdbId}
            mediaType={type as 'movie' | 'tv'}
            userId={session?.sub}
          />
        </div>

        {/* Reviews */}
        <div className="mt-8 mb-12">
          <ReviewSection
            item={mediaItem}
            userId={session?.sub}
          />
        </div>

        {/* Similar */}
        {similar.length > 0 && (
          <Carousel
            title="También te puede gustar"
            items={similar}
            accent="#f59e0b"
          />
        )}
      </div>
    </div>
  );
}
