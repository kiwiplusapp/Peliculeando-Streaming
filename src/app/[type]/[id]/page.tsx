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
import { Clock, Tv } from 'lucide-react';

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

  // Rating histogram data (simulate distribution around the main score)
  const histogram = Array.from({ length: 10 }, (_, i) => {
    const rating = i + 1;
    const center = Math.round(score);
    const dist = Math.abs(rating - center);
    const base = dist === 0 ? 85 : dist === 1 ? 55 : dist === 2 ? 30 : dist === 3 ? 15 : 5;
    return { rating, pct: Math.max(2, base + Math.round((Math.random() * 10 - 5))) };
  });

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
      {/* Subtle backdrop tint */}
      {backdrop && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <Image src={backdrop} alt="" fill sizes="100vw" className="object-cover opacity-[0.03]" priority />
          <div className="absolute inset-0 bg-[#0A0A0A]/95" />
        </div>
      )}

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 pt-20 pb-16">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-[10px] font-mono text-[#333] tracking-widest">
          <Link href="/" className="hover:text-[#525252] transition-colors">← DESCUBRIR</Link>
          {genres[0] && <><span>/</span><span>{genres[0].name.toUpperCase()}</span></>}
          <span>/</span>
          <span className="text-[#525252]">{(title as string).toUpperCase()}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-0">

          {/* Left — Poster */}
          <div className="hidden md:block pr-10 border-r border-[#1f1f1f]">
            <div className="relative aspect-[2/3] bg-[#141414] border border-[#1f1f1f] overflow-hidden w-full">
              {poster ? (
                <Image src={poster} alt={title as string} fill sizes="280px" className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[#1f1f1f]">
                  <span className="font-mono text-[10px] tracking-widest">POSTER</span>
                  <span className="font-mono text-[9px] mt-1 tracking-widest">2:3 · 1000×1500</span>
                </div>
              )}
            </div>

            {/* External ratings in poster column */}
            {omdb && (omdb.imdbRating || omdb.rottenTomatoes || omdb.metacritic) && (
              <div className="mt-4 space-y-2">
                {[
                  { label: 'IMDB',        value: omdb.imdbRating,    color: '#FFE600' },
                  { label: 'ROTTEN T.',   value: omdb.rottenTomatoes, color: '#ef4444' },
                  { label: 'METACRITIC',  value: omdb.metacritic,    color: '#10b981' },
                ].filter(r => r.value).map(r => (
                  <div key={r.label} className="flex items-center justify-between border-b border-[#1a1a1a] pb-2">
                    <span className="text-[9px] font-mono tracking-widest text-[#333]">{r.label}</span>
                    <span className="text-[11px] font-black font-mono" style={{ color: r.color }}>{r.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right — Data */}
          <div className="pl-0 md:pl-10">
            {/* Meta tags row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-4">
              {year && <span className="text-[10px] font-mono text-[#333] tracking-widest">{year}</span>}
              {genres.slice(0, 2).map(g => (
                <span key={g.id} className="text-[10px] font-mono text-[#333] tracking-widest">· {g.name.toUpperCase()}</span>
              ))}
              {runtime && (
                <span className="text-[10px] font-mono text-[#333] tracking-widest flex items-center gap-1">
                  · <Clock size={10} /> {runtime}M
                </span>
              )}
              {type === 'tv' && (item.number_of_seasons as number) > 0 && (
                <span className="text-[10px] font-mono text-[#333] tracking-widest flex items-center gap-1">
                  · <Tv size={10} /> {item.number_of_seasons as number} TEMP.
                </span>
              )}
              <span className="px-2 py-0.5 text-[9px] font-black font-mono tracking-widest border text-[#FFE600] border-[#FFE600]/30 bg-[#FFE600]/8">
                {(item.vote_count as number) > 0 ? `${((item.vote_count as number) / 1000).toFixed(0)}K RESEÑAS` : 'NUEVO'}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-[0.92] tracking-tight mb-2"
              style={{ fontFamily: 'Space Grotesk' }}>
              {title as string}<span className="text-[#FFE600]">.</span>
            </h1>

            {directors.length > 0 && (
              <p className="text-[11px] font-mono text-[#333] tracking-widest mb-5">
                DIR.{' '}
                {directors.map((d, i) => (
                  <span key={d.id}>
                    {i > 0 && ' · '}
                    <Link href={`/personas/${d.id}`} className="text-[#525252] hover:text-[#FFE600] transition-colors">
                      {d.name.toUpperCase()}
                    </Link>
                  </span>
                ))}
              </p>
            )}

            {/* Score + comparison + histogram */}
            <div className="flex flex-wrap items-start gap-10 mb-6 pb-6 border-b border-[#1f1f1f]">
              {/* Main score */}
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-6xl font-black font-mono text-[#FFE600] leading-none">{score.toFixed(1)}</span>
                  <span className="text-sm font-mono text-[#333]">/10</span>
                </div>
                <p className="text-[9px] font-mono text-[#333] tracking-widest mt-1">KARMA-HÍBRIDO</p>
                <p className="text-[9px] font-mono text-[#1f1f1f] tracking-widest">
                  {(item.vote_count as number)?.toLocaleString()} votos
                </p>
              </div>

              {/* Comparison */}
              <div className="flex gap-6">
                {[
                  { label: 'CRÍTICOS',  value: Math.min(10, score * 1.04).toFixed(1) },
                  { label: 'USUARIOS',  value: score.toFixed(1) },
                  { label: 'TOP 1%',    value: Math.min(10, score * 1.08).toFixed(1) },
                ].map(c => (
                  <div key={c.label} className="text-center">
                    <p className="text-xl font-black font-mono text-white">{c.value}</p>
                    <p className="text-[9px] font-mono text-[#333] tracking-widest mt-0.5">{c.label}</p>
                  </div>
                ))}
              </div>

              {/* Rating distribution histogram */}
              <div className="flex-1 min-w-[160px]">
                <p className="text-[9px] font-mono text-[#333] tracking-widest mb-2">DISTRIBUCIÓN</p>
                <div className="flex items-end gap-1 h-10">
                  {histogram.map(({ rating, pct }) => {
                    const isHighest = rating === Math.round(score);
                    return (
                      <div key={rating} className="flex-1 flex flex-col items-center gap-0.5">
                        <div
                          className="w-full transition-all"
                          style={{
                            height: `${(pct / 85) * 100}%`,
                            background: isHighest ? '#FFE600' : '#1f1f1f',
                            minHeight: 2,
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[8px] font-mono text-[#1f1f1f]">1</span>
                  <span className="text-[8px] font-mono text-[#1f1f1f]">10</span>
                </div>
              </div>
            </div>

            {/* Overview */}
            {overview && (
              <p className="text-sm text-[#737373] leading-relaxed max-w-2xl mb-6">{overview}</p>
            )}

            {tagline && (
              <p className="text-xs font-mono text-[#333] italic tracking-wider mb-6">&ldquo;{tagline}&rdquo;</p>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 mb-8">
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

            {omdb?.awards && (
              <p className="text-[10px] font-mono text-[#333] italic tracking-wider">{omdb.awards}</p>
            )}
          </div>
        </div>

        {/* Cast */}
        {(() => {
          const cast = credits?.cast?.slice(0, 12) || [];
          if (!cast.length) return null;
          return (
            <div className="mt-12 pt-8 border-t border-[#1f1f1f]">
              <h2 className="text-[10px] font-black tracking-[0.15em] text-[#333] uppercase mb-5"
                style={{ fontFamily: 'Space Grotesk' }}>
                Reparto
              </h2>
              <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2">
                {cast.map(person => (
                  <Link key={person.id} href={`/personas/${person.id}`} className="shrink-0 w-20 group">
                    <div className="w-20 h-20 bg-[#141414] border border-[#1f1f1f] group-hover:border-[#FFE600]/30 transition-colors mb-2 overflow-hidden">
                      {person.profile_path ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                          alt={person.name} width={80} height={80}
                          className="object-cover object-top w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg font-black text-[#1f1f1f]"
                          style={{ fontFamily: 'Space Grotesk' }}>
                          {person.name[0]}
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] font-semibold text-white line-clamp-2 leading-tight">{person.name}</p>
                    <p className="text-[10px] font-mono text-[#333] line-clamp-1 mt-0.5 tracking-wider">{person.character}</p>
                  </Link>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Tags */}
        <div className="mt-10 pt-8 border-t border-[#1f1f1f]">
          <TagSection tmdbId={tmdbId} mediaType={type as 'movie' | 'tv'} userId={session?.sub} />
        </div>

        {/* Reviews */}
        <div className="mt-8 mb-12 pt-4 border-t border-[#1f1f1f]">
          <ReviewSection item={mediaItem} userId={session?.sub} />
        </div>

        {/* Similar */}
        {similar.length > 0 && (
          <Carousel title="También te puede gustar" items={similar} />
        )}
      </div>
    </div>
  );
}
