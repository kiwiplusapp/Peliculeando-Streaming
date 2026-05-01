'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MediaCard } from './MediaCard';
import { MediaItem } from '@/lib/tmdb';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';

const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'Inglés' },
  { code: 'fr', label: 'Francés' },
  { code: 'de', label: 'Alemán' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Portugués' },
  { code: 'ja', label: 'Japonés' },
  { code: 'ko', label: 'Coreano' },
  { code: 'zh', label: 'Chino' },
];

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Más populares' },
  { value: 'vote_average.desc', label: 'Mejor valoradas' },
  { value: 'release_date.desc', label: 'Más recientes' },
  { value: 'release_date.asc', label: 'Más antiguas' },
  { value: 'revenue.desc', label: 'Mayor recaudación' },
];

interface Genre { id: number; name: string; }

export function AdvancedFilters({ initialParams }: { initialParams: Record<string, string> }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [mediaType, setMediaType] = useState(searchParams.get('media_type') || 'movie');
  const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'popularity.desc');
  const [yearFrom, setYearFrom] = useState(searchParams.get('year_from') || '');
  const [yearTo, setYearTo] = useState(searchParams.get('year_to') || '');
  const [ratingMin, setRatingMin] = useState(searchParams.get('rating_min') || '');
  const [ratingMax, setRatingMax] = useState(searchParams.get('rating_max') || '');
  const [runtimeMin, setRuntimeMin] = useState(searchParams.get('runtime_min') || '');
  const [runtimeMax, setRuntimeMax] = useState(searchParams.get('runtime_max') || '');
  const [language, setLanguage] = useState(searchParams.get('language') || '');
  const [selectedGenres, setSelectedGenres] = useState<number[]>(
    searchParams.get('genres') ? searchParams.get('genres')!.split(',').map(Number) : []
  );
  const [genres, setGenres] = useState<Genre[]>([]);
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [showFilters, setShowFilters] = useState(true);

  // Load genres
  useEffect(() => {
    fetch('/api/filters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: mediaType }),
    })
      .then(r => r.json())
      .then(d => setGenres(d.genres || []))
      .catch(() => {});
  }, [mediaType]);

  const search = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      if (query.trim()) {
        const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(query)}&page=${p}`);
        const d = await res.json();
        if (p === 1) setResults(d.results || []);
        else setResults(prev => [...prev, ...(d.results || [])]);
        setTotalPages(d.total_pages || 0);
      } else {
        const params = new URLSearchParams({
          media_type: mediaType,
          sort_by: sortBy,
          page: String(p),
          ...(yearFrom && { year_from: yearFrom }),
          ...(yearTo && { year_to: yearTo }),
          ...(ratingMin && { rating_min: ratingMin }),
          ...(ratingMax && { rating_max: ratingMax }),
          ...(runtimeMin && { runtime_min: runtimeMin }),
          ...(runtimeMax && { runtime_max: runtimeMax }),
          ...(language && { language }),
          ...(selectedGenres.length && { genres: selectedGenres.join(',') }),
        });
        const res = await fetch(`/api/filters?${params}`);
        const d = await res.json();
        if (p === 1) setResults(d.results || []);
        else setResults(prev => [...prev, ...(d.results || [])]);
        setTotalPages(d.total_pages || 0);
      }
    } catch {} finally { setLoading(false); }
  }, [query, mediaType, sortBy, yearFrom, yearTo, ratingMin, ratingMax, runtimeMin, runtimeMax, language, selectedGenres]);

  useEffect(() => { setPage(1); search(1); }, [mediaType, sortBy, yearFrom, yearTo, ratingMin, ratingMax, runtimeMin, runtimeMax, language, selectedGenres.join(',')]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); search(1); };

  const toggleGenre = (id: number) => {
    setSelectedGenres(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  };

  const loadMore = () => { const next = page + 1; setPage(next); search(next); };

  const clearFilters = () => {
    setYearFrom(''); setYearTo(''); setRatingMin(''); setRatingMax('');
    setRuntimeMin(''); setRuntimeMax(''); setLanguage(''); setSelectedGenres([]);
    setSortBy('popularity.desc');
  };

  const hasFilters = yearFrom || yearTo || ratingMin || ratingMax || runtimeMin || runtimeMax || language || selectedGenres.length;

  return (
    <div className="flex gap-6">
      {/* Filters sidebar */}
      {showFilters && (
        <div className="w-64 shrink-0 space-y-5">
          {/* Media type */}
          <div>
            <p className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider mb-2">Tipo</p>
            <div className="flex gap-2">
              {[{ v: 'movie', l: 'Películas' }, { v: 'tv', l: 'Series' }].map(({ v, l }) => (
                <button key={v} onClick={() => setMediaType(v)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${mediaType === v ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-[#111111] border-[#262626] text-[#A3A3A3] hover:text-white'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div>
            <p className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider mb-2">Ordenar por</p>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="w-full bg-[#111111] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 appearance-none"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Year range */}
          <div>
            <p className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider mb-2">Año</p>
            <div className="flex gap-2">
              <input type="number" placeholder="Desde" value={yearFrom} onChange={e => setYearFrom(e.target.value)}
                min="1900" max="2025" className="filter-input" />
              <input type="number" placeholder="Hasta" value={yearTo} onChange={e => setYearTo(e.target.value)}
                min="1900" max="2025" className="filter-input" />
            </div>
          </div>

          {/* Rating */}
          <div>
            <p className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider mb-2">
              Puntuación TMDB ({ratingMin || '0'} – {ratingMax || '10'})
            </p>
            <div className="flex gap-2">
              <input type="number" placeholder="Min" value={ratingMin} onChange={e => setRatingMin(e.target.value)}
                min="0" max="10" step="0.5" className="filter-input" />
              <input type="number" placeholder="Max" value={ratingMax} onChange={e => setRatingMax(e.target.value)}
                min="0" max="10" step="0.5" className="filter-input" />
            </div>
          </div>

          {/* Runtime (movie only) */}
          {mediaType === 'movie' && (
            <div>
              <p className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider mb-2">Duración (min)</p>
              <div className="flex gap-2">
                <input type="number" placeholder="Min" value={runtimeMin} onChange={e => setRuntimeMin(e.target.value)} className="filter-input" />
                <input type="number" placeholder="Max" value={runtimeMax} onChange={e => setRuntimeMax(e.target.value)} className="filter-input" />
              </div>
            </div>
          )}

          {/* Language */}
          <div>
            <p className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider mb-2">Idioma original</p>
            <select value={language} onChange={e => setLanguage(e.target.value)}
              className="w-full bg-[#111111] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 appearance-none">
              <option value="">Todos</option>
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>

          {/* Genres */}
          <div>
            <p className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider mb-2">Géneros</p>
            <div className="flex flex-wrap gap-1.5">
              {genres.map(g => (
                <button key={g.id} onClick={() => toggleGenre(g.id)}
                  className={`tag-pill text-[11px] ${selectedGenres.includes(g.id) ? 'active' : ''}`}>
                  {g.name}
                </button>
              ))}
            </div>
          </div>

          {hasFilters && (
            <button onClick={clearFilters} className="w-full py-2 text-sm text-[#A3A3A3] hover:text-white flex items-center justify-center gap-2 border border-[#262626] rounded-lg hover:border-[#333333] transition-colors">
              <X size={14} /> Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Results */}
      <div className="flex-1">
        {/* Search bar + toggle */}
        <div className="flex gap-3 mb-6">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#525252]" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar películas, series..."
                className="w-full bg-[#111111] border border-[#262626] rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-[#525252] focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <button type="submit" className="px-4 py-2.5 bg-amber-500 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors">
              Buscar
            </button>
          </form>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg border transition-colors ${showFilters ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-[#111111] border-[#262626] text-[#A3A3A3] hover:text-white'}`}>
            <SlidersHorizontal size={15} />
          </button>
        </div>

        {loading && !results.length ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i}>
                <div className="skeleton aspect-[2/3] rounded-lg" />
                <div className="skeleton h-3 mt-2 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <p className="text-xs text-[#525252] mb-4">
              {results.length} resultado{results.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4">
              {results.map(item => (
                <MediaCard key={`${item.tmdb_id}-${item.media_type}`} item={item} />
              ))}
            </div>
            {page < totalPages && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#111111] border border-[#262626] text-white text-sm rounded-lg hover:border-amber-500 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Cargando...' : 'Cargar más'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .filter-input {
          width: 100%;
          background: #111111;
          border: 1px solid #262626;
          border-radius: 8px;
          padding: 6px 10px;
          font-size: 13px;
          color: white;
          outline: none;
          transition: border-color 0.15s;
        }
        .filter-input:focus { border-color: #f59e0b; }
        .filter-input::placeholder { color: #525252; }
      `}</style>
    </div>
  );
}
