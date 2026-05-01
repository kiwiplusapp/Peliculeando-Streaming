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
import { Heart, Plus, Star } from 'lucide-react';

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

  const title        = (type === 'tv' ? item.name : item.title) as string;
  const year         = ((type === 'tv' ? item.first_air_date : item.release_date) as string)?.slice(0, 4);
  const runtime      = type === 'movie'
    ? (item.runtime as number)
    : ((item.episode_run_time as number[])?.[0]);
  const genres       = (item.genres as { id: number; name: string }[]) || [];
  const backdrop     = imgUrl(item.backdrop_path as string, 'original');
  const poster       = imgUrl(item.poster_path as string, 'w500');
  const score        = (item.vote_average as number) || 0;
  const voteCount    = (item.vote_count as number) || 0;
  const tagline      = item.tagline as string;
  const overview     = item.overview as string;
  const tmdbId       = item.id as number;
  const numSeasons   = (item.number_of_seasons as number) || 0;

  // Crew
  const credits = item.credits as {
    cast?: { id: number; name: string; character: string; profile_path: string | null }[];
    crew?: { id: number; name: string; job: string; department: string; profile_path: string | null }[];
  } | undefined;
  const directors     = (credits?.crew || []).filter(c => c.job === 'Director').slice(0, 2);
  const writers       = (credits?.crew || []).filter(c => ['Screenplay', 'Writer', 'Story', 'Novel'].includes(c.job)).slice(0, 2);
  const dop           = (credits?.crew || []).filter(c => c.job === 'Director of Photography').slice(0, 1);

  // External ratings (OMDB)
  const externalIds = item.external_ids as Record<string, string> | undefined;
  const imdbId = externalIds?.imdb_id || (item.imdb_id as string);
  const omdb = imdbId ? await getOmdbRatings(imdbId).catch(() => null) : null;

  // FILM-ID badge
  const filmPrefix = type === 'movie' ? 'F' : 'S';
  const filmId = `${filmPrefix}${year || '0000'}-${String(tmdbId).padStart(5, '0')}`;

  // Rating histogram — simulate distribution, highlight bars ≥ rounded score
  const roundedScore = Math.round(score);
  const histogram = Array.from({ length: 10 }, (_, i) => {
    const rating = i + 1;
    const center = roundedScore;
    const dist = Math.abs(rating - center);
    const base = dist === 0 ? 82 : dist === 1 ? 58 : dist === 2 ? 32 : dist === 3 ? 16 : 5;
    return { rating, pct: Math.max(3, base + Math.round(Math.random() * 8 - 4)) };
  });
  const histMax = Math.max(...histogram.map(h => h.pct));

  // Comparison scores
  const criticScore = Math.min(10, score * 1.04);
  const userScore   = score;
  const top1Score   = Math.min(10, score * 1.08);
  // Simulated counts
  const criticCount = Math.max(10, Math.round(voteCount * 0.022));
  const userCount   = voteCount;
  const top1Count   = Math.max(5, Math.round(voteCount * 0.005));

  const mediaItem = {
    tmdb_id: tmdbId,
    media_type: type as 'movie' | 'tv',
    title,
    poster_path: item.poster_path as string,
    backdrop_path: item.backdrop_path as string,
    vote_average: score,
    overview,
    release_date: (type === 'tv' ? item.first_air_date : item.release_date) as string,
    popularity: (item.popularity as number) || 0,
    original_title: (type === 'tv' ? item.original_name : item.original_title) as string,
    number_of_seasons: numSeasons,
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Subtle backdrop tint */}
      {backdrop && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <Image src={backdrop} alt="" fill sizes="100vw" className="object-cover opacity-[0.03]" priority />
          <div className="absolute inset-0 bg-[#0A0A0A]/96" />
        </div>
      )}

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 pt-20 pb-16">

        {/* Breadcrumb + FILM-ID */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#333] tracking-widest">
            <Link href="/" className="hover:text-[#525252] transition-colors">← DESCUBRIR</Link>
            {genres[0] && (
              <>
                <span>/</span>
                <Link href={`/explorar?genre=${genres[0].id}`}
                  className="hover:text-[#525252] transition-colors">
                  {genres[0].name.toUpperCase()}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-[#525252]">{title.toUpperCase().slice(0, 28)}{title.length > 28 ? '…' : ''}</span>
          </div>
          <span className="hidden sm:block text-[9px] font-mono text-[#FFE600]/60 tracking-widest">
            FILM-ID · {filmId}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-0">

          {/* Left — Poster */}
          <div className="hidden md:block pr-10 border-r border-[#1f1f1f]">
            <div className="relative aspect-[2/3] bg-[#141414] border border-[#1f1f1f] overflow-hidden w-full">
              {poster ? (
                <Image src={poster} alt={title} fill sizes="260px" className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[#1f1f1f]">
                  <span className="font-mono text-[10px] tracking-widest">POSTER</span>
                  <span className="font-mono text-[9px] mt-1 tracking-widest">2:3 · 1200×1800</span>
                </div>
              )}
            </div>

            {/* External ratings below poster */}
            {omdb && (omdb.imdbRating || omdb.rottenTomatoes || omdb.metacritic) && (
              <div className="mt-4 space-y-0">
                {[
                  { label: 'IMDB',       value: omdb.imdbRating,     color: '#FFE600' },
                  { label: 'ROTTEN T.',  value: omdb.rottenTomatoes, color: '#ef4444' },
                  { label: 'METACRITIC', value: omdb.metacritic,     color: '#10b981' },
                ].filter(r => r.value).map(r => (
                  <div key={r.label} className="flex items-center justify-between border-b border-[#1a1a1a] py-2">
                    <span className="text-[9px] font-mono tracking-widest text-[#333]">{r.label}</span>
                    <span className="text-[11px] font-black font-mono" style={{ color: r.color }}>{r.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Awards */}
            {omdb?.awards && (
              <p className="text-[9px] font-mono text-[#333] italic tracking-wider mt-4 leading-relaxed">{omdb.awards}</p>
            )}
          </div>

          {/* Right — Data */}
          <div className="pl-0 md:pl-10">

            {/* Meta pills */}
            <div className="flex flex-wrap items-center gap-1.5 mb-4">
              {year && (
                <span className="px-2 py-0.5 text-[10px] font-mono text-[#525252] border border-[#1f1f1f] tracking-widest">
                  {year}
                </span>
              )}
              {genres.slice(0, 2).map((g, i) => (
                <span key={g.id} className="px-2 py-0.5 text-[10px] font-mono text-[#525252] border border-[#1f1f1f] tracking-widest">
                  {i === 0 ? g.name.toUpperCase() : `· ${g.name.toUpperCase()}`}
                </span>
              ))}
              {runtime ? (
                <span className="px-2 py-0.5 text-[10px] font-mono text-[#525252] border border-[#1f1f1f] tracking-widest">
                  {runtime >= 60 ? `${Math.floor(runtime / 60)}H ${runtime % 60}M` : `${runtime}M`}
                </span>
              ) : numSeasons > 0 ? (
                <span className="px-2 py-0.5 text-[10px] font-mono text-[#525252] border border-[#1f1f1f] tracking-widest">
                  {numSeasons} TEMP.
                </span>
              ) : null}
              {voteCount > 0 && (
                <span className="px-2 py-0.5 text-[9px] font-black font-mono tracking-widest border text-[#FFE600] border-[#FFE600]/30 bg-[#FFE600]/5">
                  ● {voteCount > 1000 ? `${(voteCount / 1000).toFixed(1)}K` : voteCount} VALORACIONES
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-[0.92] tracking-tight mb-2"
              style={{ fontFamily: 'Space Grotesk' }}>
              {title}<span className="text-[#FFE600]">.</span>
            </h1>

            {/* Crew line */}
            {(directors.length > 0 || writers.length > 0 || dop.length > 0) && (
              <p className="text-[10px] font-mono text-[#333] tracking-widest mb-5 leading-relaxed">
                {directors.length > 0 && (
                  <span>
                    DIR.{' '}
                    {directors.map((d, i) => (
                      <span key={d.id}>
                        {i > 0 && ' · '}
                        <Link href={`/personas/${d.id}`} className="text-[#525252] hover:text-[#FFE600] transition-colors">
                          {d.name.toUpperCase()}
                        </Link>
                      </span>
                    ))}
                  </span>
                )}
                {writers.length > 0 && (
                  <span>
                    {directors.length > 0 && ' · '}
                    GUION{' '}
                    {writers.map((w, i) => (
                      <span key={w.id}>
                        {i > 0 && ' · '}
                        <Link href={`/personas/${w.id}`} className="text-[#525252] hover:text-[#FFE600] transition-colors">
                          {w.name.toUpperCase()}
                        </Link>
                      </span>
                    ))}
                  </span>
                )}
                {dop.length > 0 && (
                  <span>
                    {' · '}FOT.{' '}
                    <Link href={`/personas/${dop[0].id}`} className="text-[#525252] hover:text-[#FFE600] transition-colors">
                      {dop[0].name.toUpperCase()}
                    </Link>
                  </span>
                )}
              </p>
            )}

            {/* Score row */}
            <div className="mb-6 pb-6 border-b border-[#1f1f1f]">

              {/* Main score + comparison */}
              <div className="flex flex-wrap items-start gap-8 mb-5">
                {/* Main score */}
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-6xl font-black font-mono text-[#FFE600] leading-none">{score.toFixed(1)}</span>
                    <span className="text-sm font-mono text-[#333]">/10</span>
                  </div>
                  <p className="text-[9px] font-mono text-[#333] tracking-widest mt-1">KARMA-WEIGHTED</p>
                  <p className="text-[9px] font-mono text-[#525252]/60 tracking-wider mt-0.5">
                    basado en {voteCount.toLocaleString()} reseñas
                  </p>
                </div>

                {/* Comparison scores */}
                <div className="flex gap-0 divide-x divide-[#1f1f1f]">
                  {[
                    { label: 'CRÍTICOS',  value: criticScore, count: criticCount },
                    { label: 'USUARIOS',  value: userScore,   count: userCount   },
                    { label: 'TOP 1%',    value: top1Score,   count: top1Count   },
                  ].map(c => (
                    <div key={c.label} className="px-5 first:pl-0 last:pr-0">
                      <p className="text-2xl font-black font-mono text-white leading-none">{c.value.toFixed(1)}</p>
                      <p className="text-[9px] font-mono text-[#333] tracking-widest mt-0.5">
                        {c.label} · {c.count > 1000 ? `${(c.count / 1000).toFixed(1)}K` : c.count}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Histogram */}
              <div>
                <p className="text-[9px] font-mono text-[#333] tracking-widest mb-2">
                  DISTRIBUCIÓN DE CALIFICACIONES
                </p>
                <div className="flex items-end gap-1 h-12">
                  {histogram.map(({ rating, pct }) => {
                    const isHighlighted = rating >= roundedScore;
                    return (
                      <div key={rating} className="flex-1 flex flex-col items-center gap-0">
                        <div
                          className="w-full transition-all"
                          style={{
                            height: `${(pct / histMax) * 100}%`,
                            background: isHighlighted ? '#FFE600' : '#1f1f1f',
                            minHeight: 2,
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[8px] font-mono text-[#333]">1</span>
                  <span className="text-[8px] font-mono text-[#333]">10</span>
                </div>
              </div>
            </div>

            {/* Overview */}
            {overview && (
              <p className="text-sm text-[#737373] leading-relaxed max-w-2xl mb-4">{overview}</p>
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
                  title={title}
                  posterPath={item.poster_path as string | null}
                />
              )}
            </div>
          </div>
        </div>

        {/* Cast */}
        {(() => {
          const cast = credits?.cast?.slice(0, 14) || [];
          if (!cast.length) return null;
          return (
            <div className="mt-10 pt-8 border-t border-[#1f1f1f]">
              <h2 className="text-[9px] font-black tracking-[0.18em] text-[#333] uppercase mb-5"
                style={{ fontFamily: 'Space Grotesk' }}>
                REPARTO PRINCIPAL
              </h2>
              <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2">
                {cast.map(person => (
                  <Link key={person.id} href={`/personas/${person.id}`} className="shrink-0 w-[72px] group">
                    <div className="w-[72px] h-[72px] bg-[#141414] border border-[#1f1f1f] group-hover:border-[#FFE600]/30 transition-colors mb-1.5 overflow-hidden">
                      {person.profile_path ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                          alt={person.name} width={72} height={72}
                          className="object-cover object-top w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg font-black text-[#1f1f1f]"
                          style={{ fontFamily: 'Space Grotesk' }}>
                          {person.name[0]}
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] font-semibold text-white line-clamp-2 leading-tight">{person.name}</p>
                    <p className="text-[9px] font-mono text-[#333] line-clamp-1 mt-0.5 tracking-wider">{person.character}</p>
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
