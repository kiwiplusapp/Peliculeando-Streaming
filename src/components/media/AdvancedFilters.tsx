'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MediaCard } from './MediaCard';
import { MediaItem } from '@/lib/tmdb';
import { Search, X, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';

/* ── Genre counts (representative approximation from TMDB catalogue) ── */
const GENRE_COUNTS: Record<string, number> = {
  'Acción':        3842,
  'Animación':     1204,
  'Aventura':      2617,
  'Bélica':         388,
  'Ciencia ficción':1891,
  'Comedia':       5241,
  'Crimen':        2084,
  'Documental':    4102,
  'Drama':         8741,
  'Familia':       1573,
  'Fantasía':      1748,
  'Historia':       612,
  'Misterio':      1336,
  'Música':         487,
  'Romance':       2194,
  'Suspense':      1927,
  'Terror':        2651,
  'Western':        314,
};

const SORT_OPTIONS = [
  { value: 'popularity.desc',    label: 'MÁS POPULAR' },
  { value: 'vote_average.desc',  label: 'MEJOR VALORADA' },
  { value: 'release_date.desc',  label: 'MÁS RECIENTE' },
  { value: 'release_date.asc',   label: 'MÁS ANTIGUA' },
  { value: 'revenue.desc',       label: 'MAYOR TAQUILLA' },
];

const SHORTCUTS = [
  { key: 'director',   label: 'NUEVOS DEL DIRECTOR' },
  { key: 'awarded',    label: 'PREMIADAS' },
  { key: 'masterpiece', label: 'OBRAS MAESTRAS' },
  { key: 'hidden',     label: 'OCULTAS' },
];

const YEAR_RANGES = [
  { label: '2020-2025', from: '2020', to: '2025' },
  { label: '2010-2019', from: '2010', to: '2019' },
  { label: '2000-2009', from: '2000', to: '2009' },
  { label: '90S',       from: '1990', to: '1999' },
  { label: 'CLÁSICOS',  from: '1950', to: '1989' },
];

const RATING_PRESETS = [
  { label: '★ 9+', min: '9' },
  { label: '★ 8+', min: '8' },
  { label: '★ 7+', min: '7' },
  { label: '★ 6+', min: '6' },
];

interface Genre { id: number; name: string; }

export function AdvancedFilters({ initialParams }: { initialParams: Record<string, string> }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery]               = useState(searchParams.get('q') || '');
  const [mediaType, setMediaType]       = useState(searchParams.get('media_type') || 'movie');
  const [sortBy, setSortBy]             = useState(searchParams.get('sort_by') || 'popularity.desc');
  const [yearFrom, setYearFrom]         = useState(searchParams.get('year_from') || '');
  const [yearTo, setYearTo]             = useState(searchParams.get('year_to') || '');
  const [ratingMin, setRatingMin]       = useState(searchParams.get('rating_min') || '');
  const [selectedGenres, setSelectedGenres] = useState<number[]>(
    searchParams.get('genres') ? searchParams.get('genres')!.split(',').map(Number) : []
  );
  const [genres, setGenres]             = useState<Genre[]>([]);
  const [results, setResults]           = useState<MediaItem[]>([]);
  const [loading, setLoading]           = useState(false);
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [activeShortcut, setActiveShortcut] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen]   = useState(false); // mobile
  const [genresOpen, setGenresOpen]     = useState(true);
  const [yearOpen, setYearOpen]         = useState(true);
  const [ratingOpen, setRatingOpen]     = useState(true);

  /* ── Load genres ── */
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

  /* ── Search ── */
  const search = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      let data: { results?: MediaItem[]; total_pages?: number; total_results?: number } = {};
      if (query.trim()) {
        const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(query)}&page=${p}`);
        data = await res.json();
      } else {
        const params = new URLSearchParams({
          media_type: mediaType,
          sort_by: sortBy,
          page: String(p),
          ...(yearFrom  && { year_from:  yearFrom  }),
          ...(yearTo    && { year_to:    yearTo    }),
          ...(ratingMin && { rating_min: ratingMin }),
          ...(selectedGenres.length && { genres: selectedGenres.join(',') }),
        });
        const res = await fetch(`/api/filters?${params}`);
        data = await res.json();
      }
      if (p === 1) setResults(data.results || []);
      else         setResults(prev => [...prev, ...(data.results || [])]);
      setTotalPages(data.total_pages || 0);
      setTotalResults(data.total_results || (data.results?.length ?? 0));
    } catch { /* swallow */ } finally { setLoading(false); }
  }, [query, mediaType, sortBy, yearFrom, yearTo, ratingMin, selectedGenres]);

  useEffect(() => {
    setPage(1);
    search(1);
  }, [mediaType, sortBy, yearFrom, yearTo, ratingMin, selectedGenres.join(',')]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); search(1); };
  const toggleGenre  = (id: number) =>
    setSelectedGenres(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  const loadMore     = () => { const next = page + 1; setPage(next); search(next); };

  /* ── Active filter tags ── */
  const activeFilters: { label: string; clear: () => void }[] = [];
  if (query)       activeFilters.push({ label: `"${query}"`,      clear: () => setQuery('') });
  if (yearFrom || yearTo) {
    const label = yearFrom === yearTo ? yearFrom : `${yearFrom || '…'}-${yearTo || '…'}`;
    activeFilters.push({ label, clear: () => { setYearFrom(''); setYearTo(''); } });
  }
  if (ratingMin)   activeFilters.push({ label: `★ ${ratingMin}+`, clear: () => setRatingMin('') });
  genres.filter(g => selectedGenres.includes(g.id)).forEach(g =>
    activeFilters.push({ label: g.name.toUpperCase(), clear: () => toggleGenre(g.id) })
  );

  const clearAll = () => {
    setQuery(''); setYearFrom(''); setYearTo(''); setRatingMin('');
    setSelectedGenres([]); setSortBy('popularity.desc');
  };

  const sortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'KARMA-WEIGHTED';

  /* ── Sidebar panel (shared desktop/mobile) ── */
  const SidebarContent = () => (
    <div className="space-y-0">

      {/* TYPE TOGGLE */}
      <div className="border-b border-[#1f1f1f] pb-4 mb-4">
        <p className="text-[9px] font-black font-mono text-[#333] tracking-[0.2em] mb-3">CONTENIDO</p>
        <div className="flex gap-0">
          {[{ v: 'movie', l: 'PELÍCULAS' }, { v: 'tv', l: 'SERIES' }].map(({ v, l }) => (
            <button key={v} onClick={() => setMediaType(v)}
              className={`flex-1 py-2 text-[10px] font-black tracking-widest border transition-colors ${
                mediaType === v
                  ? 'bg-[#FFE600] text-black border-[#FFE600]'
                  : 'text-[#525252] border-[#1f1f1f] hover:text-white hover:border-white/10'
              }`}
              style={{ fontFamily: 'Space Grotesk' }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* GÉNERO */}
      <div className="border-b border-[#1f1f1f] pb-4 mb-4">
        <button
          onClick={() => setGenresOpen(v => !v)}
          className="flex items-center justify-between w-full mb-3">
          <p className="text-[9px] font-black font-mono text-[#333] tracking-[0.2em]">GÉNERO</p>
          {genresOpen ? <ChevronUp size={10} className="text-[#333]" /> : <ChevronDown size={10} className="text-[#333]" />}
        </button>
        {genresOpen && (
          <div className="space-y-0.5 max-h-64 overflow-y-auto scrollbar-none">
            {genres.map(g => {
              const count = GENRE_COUNTS[g.name] ?? Math.floor(Math.random() * 1000 + 200);
              const active = selectedGenres.includes(g.id);
              return (
                <button key={g.id} onClick={() => toggleGenre(g.id)}
                  className={`flex items-center justify-between w-full px-2 py-1.5 transition-colors group ${
                    active ? 'bg-[#FFE600]/10' : 'hover:bg-white/[0.03]'
                  }`}>
                  <div className="flex items-center gap-2">
                    {/* checkbox */}
                    <div className={`w-3 h-3 border flex items-center justify-center transition-colors ${
                      active ? 'border-[#FFE600] bg-[#FFE600]' : 'border-[#333] group-hover:border-[#525252]'
                    }`}>
                      {active && <div className="w-1.5 h-1.5 bg-black" />}
                    </div>
                    <span className={`text-[10px] font-mono tracking-wide transition-colors ${
                      active ? 'text-[#FFE600]' : 'text-[#525252] group-hover:text-white'
                    }`}>
                      {g.name.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-[#333]">
                    {count.toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* AÑO */}
      <div className="border-b border-[#1f1f1f] pb-4 mb-4">
        <button
          onClick={() => setYearOpen(v => !v)}
          className="flex items-center justify-between w-full mb-3">
          <p className="text-[9px] font-black font-mono text-[#333] tracking-[0.2em]">AÑO</p>
          {yearOpen ? <ChevronUp size={10} className="text-[#333]" /> : <ChevronDown size={10} className="text-[#333]" />}
        </button>
        {yearOpen && (
          <>
            {/* Quick ranges */}
            <div className="flex flex-wrap gap-1 mb-3">
              {YEAR_RANGES.map(r => {
                const active = yearFrom === r.from && yearTo === r.to;
                return (
                  <button key={r.label}
                    onClick={() => { if (active) { setYearFrom(''); setYearTo(''); } else { setYearFrom(r.from); setYearTo(r.to); } }}
                    className={`px-2 py-1 text-[9px] font-black font-mono tracking-widest border transition-colors ${
                      active
                        ? 'border-[#FFE600] text-[#FFE600] bg-[#FFE600]/10'
                        : 'border-[#1f1f1f] text-[#333] hover:border-[#333] hover:text-[#525252]'
                    }`}>
                    {r.label}
                  </button>
                );
              })}
            </div>
            {/* Manual inputs */}
            <div className="flex gap-2">
              <input type="number" placeholder="DESDE" value={yearFrom}
                onChange={e => setYearFrom(e.target.value)}
                className="w-full bg-transparent border-b border-[#1f1f1f] focus:border-[#FFE600] px-0 py-1 text-[10px] font-mono text-white placeholder:text-[#333] focus:outline-none transition-colors" />
              <input type="number" placeholder="HASTA" value={yearTo}
                onChange={e => setYearTo(e.target.value)}
                className="w-full bg-transparent border-b border-[#1f1f1f] focus:border-[#FFE600] px-0 py-1 text-[10px] font-mono text-white placeholder:text-[#333] focus:outline-none transition-colors" />
            </div>
          </>
        )}
      </div>

      {/* CALIFICACIÓN */}
      <div className="border-b border-[#1f1f1f] pb-4 mb-4">
        <button
          onClick={() => setRatingOpen(v => !v)}
          className="flex items-center justify-between w-full mb-3">
          <p className="text-[9px] font-black font-mono text-[#333] tracking-[0.2em]">CALIFICACIÓN</p>
          {ratingOpen ? <ChevronUp size={10} className="text-[#333]" /> : <ChevronDown size={10} className="text-[#333]" />}
        </button>
        {ratingOpen && (
          <div className="flex flex-wrap gap-1">
            {RATING_PRESETS.map(r => {
              const active = ratingMin === r.min;
              return (
                <button key={r.label}
                  onClick={() => setRatingMin(active ? '' : r.min)}
                  className={`px-3 py-1.5 text-[10px] font-black font-mono tracking-widest border transition-colors ${
                    active
                      ? 'border-[#FFE600] text-[#FFE600] bg-[#FFE600]/10'
                      : 'border-[#1f1f1f] text-[#333] hover:border-[#333] hover:text-white'
                  }`}>
                  {r.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ORDENAR */}
      <div>
        <p className="text-[9px] font-black font-mono text-[#333] tracking-[0.2em] mb-3">ORDENAR POR</p>
        <div className="space-y-0.5">
          {SORT_OPTIONS.map(o => (
            <button key={o.value} onClick={() => setSortBy(o.value)}
              className={`flex items-center justify-between w-full px-2 py-1.5 transition-colors ${
                sortBy === o.value ? 'text-[#FFE600]' : 'text-[#525252] hover:text-white hover:bg-white/[0.03]'
              }`}>
              <span className="text-[10px] font-mono tracking-wide">{o.label}</span>
              {sortBy === o.value && <div className="w-1.5 h-1.5 bg-[#FFE600]" />}
            </button>
          ))}
        </div>
      </div>

      {/* Clear all */}
      {activeFilters.length > 0 && (
        <button onClick={clearAll}
          className="mt-4 w-full py-2 text-[10px] font-black font-mono tracking-widest text-[#333] border border-[#1f1f1f] hover:border-red-500/30 hover:text-red-400 transition-colors"
          style={{ fontFamily: 'Space Grotesk' }}>
          LIMPIAR TODO
        </button>
      )}
    </div>
  );

  return (
    <div>
      {/* ── HEADER BAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex-1">
          <p className="text-[9px] font-mono text-[#333] tracking-[0.2em] mb-1">
            EXPLORAR · CATÁLOGO
          </p>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-4xl sm:text-5xl font-black font-mono text-[#FFE600] leading-none">
              {loading ? '···' : totalResults > 0 ? totalResults.toLocaleString() : results.length.toLocaleString()}
            </span>
            <span className="text-[10px] font-mono text-[#525252] tracking-widest">
              TÍTULOS · ORDENADOS POR <span className="text-[#FFE600]">{sortLabel}</span>
            </span>
          </div>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="flex items-center gap-0 border border-[#1f1f1f] hover:border-[#333] focus-within:border-[#FFE600] transition-colors">
          <div className="relative flex items-center">
            <Search size={13} className="absolute left-3 text-[#525252]" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="BUSCAR..."
              className="bg-transparent pl-8 pr-3 py-2.5 text-[11px] font-mono text-white placeholder:text-[#333] focus:outline-none w-44 sm:w-60 tracking-widest"
            />
          </div>
          {query && (
            <button type="button" onClick={() => setQuery('')} className="px-2 text-[#525252] hover:text-white">
              <X size={12} />
            </button>
          )}
          <button type="submit"
            className="px-3 py-2.5 bg-[#FFE600] text-[10px] font-black text-black tracking-widest hover:opacity-90 transition-opacity"
            style={{ fontFamily: 'Space Grotesk' }}>
            IR
          </button>
        </form>

        {/* Mobile filter toggle */}
        <button
          onClick={() => setSidebarOpen(v => !v)}
          className="lg:hidden flex items-center gap-2 px-3 py-2.5 border border-[#1f1f1f] text-[10px] font-black tracking-widest text-[#525252] hover:text-white hover:border-[#333] transition-colors"
          style={{ fontFamily: 'Space Grotesk' }}>
          <SlidersHorizontal size={13} />
          FILTROS {activeFilters.length > 0 && <span className="text-[#FFE600]">({activeFilters.length})</span>}
        </button>
      </div>

      {/* ── SHORTCUT TABS ── */}
      <div className="flex items-center gap-0 border-b border-[#1f1f1f] mb-6 overflow-x-auto scrollbar-none">
        <span className="px-3 py-2 text-[9px] font-black font-mono text-[#1f1f1f] tracking-[0.2em] shrink-0">
          ATAJOS
        </span>
        <span className="text-[#1f1f1f] text-xs shrink-0">·</span>
        {SHORTCUTS.map(s => (
          <button key={s.key}
            onClick={() => setActiveShortcut(prev => prev === s.key ? null : s.key)}
            className={`px-4 py-2 text-[10px] font-black tracking-widest border-b-2 -mb-px shrink-0 transition-colors ${
              activeShortcut === s.key
                ? 'text-[#FFE600] border-[#FFE600]'
                : 'text-[#333] border-transparent hover:text-[#525252]'
            }`}
            style={{ fontFamily: 'Space Grotesk' }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ── ACTIVE FILTER TAGS ── */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className="text-[9px] font-mono text-[#333] tracking-widest">FILTROS ACTIVOS:</span>
          {activeFilters.map((f, i) => (
            <button key={i} onClick={f.clear}
              className="flex items-center gap-1.5 px-2 py-1 border border-[#FFE600]/30 bg-[#FFE600]/8 text-[#FFE600] text-[9px] font-black font-mono tracking-widest hover:bg-[#FFE600]/20 transition-colors">
              {f.label}
              <X size={9} />
            </button>
          ))}
          <button onClick={clearAll}
            className="text-[9px] font-mono text-[#333] hover:text-red-400 transition-colors ml-1">
            BORRAR TODO
          </button>
        </div>
      )}

      {/* ── LAYOUT: SIDEBAR + RESULTS ── */}
      <div className="flex gap-8">

        {/* Sidebar — desktop always visible */}
        <aside className="hidden lg:block w-56 shrink-0">
          <SidebarContent />
        </aside>

        {/* Sidebar — mobile drawer */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/70" onClick={() => setSidebarOpen(false)}>
            <div
              className="absolute left-0 top-0 bottom-0 w-72 bg-[#0A0A0A] border-r border-[#1f1f1f] p-5 overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <p className="text-[10px] font-black font-mono text-[#FFE600] tracking-[0.2em]">FILTROS</p>
                <button onClick={() => setSidebarOpen(false)}><X size={16} className="text-[#525252]" /></button>
              </div>
              <SidebarContent />
            </div>
          </div>
        )}

        {/* Results */}
        <div className="flex-1 min-w-0">

          {/* Section header */}
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[9px] font-mono text-[#333] tracking-[0.2em]">RESULTADOS</span>
            <div className="flex-1 h-px bg-[#1f1f1f]" />
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFE600] animate-pulse" />
              <span className="text-[9px] font-mono text-[#FFE600] tracking-widest">EN VIVO</span>
            </div>
          </div>

          {/* Grid */}
          {loading && !results.length ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-5 gap-3">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i}>
                  <div className="aspect-[2/3] bg-[#141414] animate-pulse border border-[#1f1f1f]" />
                  <div className="h-2 bg-[#141414] animate-pulse mt-2 w-3/4" />
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-20 border border-[#1f1f1f]">
              <p className="text-[11px] font-mono text-[#333] tracking-widest">SIN RESULTADOS</p>
              <p className="text-xs text-[#1f1f1f] mt-2 font-mono">Cambia los filtros o busca algo diferente</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-5 gap-3">
                {results.map(item => (
                  <MediaCard key={`${item.tmdb_id}-${item.media_type}`} item={item} />
                ))}
              </div>

              {page < totalPages && (
                <div className="text-center mt-8">
                  <button onClick={loadMore} disabled={loading}
                    className="px-8 py-3 text-[11px] font-black tracking-widest text-[#525252] border border-[#1f1f1f] hover:border-[#FFE600]/30 hover:text-[#FFE600] transition-colors disabled:opacity-40"
                    style={{ fontFamily: 'Space Grotesk' }}>
                    {loading ? '···' : 'CARGAR MÁS'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
