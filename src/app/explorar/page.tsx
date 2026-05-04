import { Suspense } from 'react';
import { AdvancedFilters } from '@/components/media/AdvancedFilters';

export const metadata = { title: 'Explorar — Peliculeando' };

export default function ExplorarPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="mb-8 pt-4 border-b border-[#1f1f1f] pb-6">
          <p className="text-[9px] font-mono text-[#333] tracking-[0.25em] mb-2">
            CATÁLOGO · BÚSQUEDA AVANZADA
          </p>
          <h1
            className="text-5xl sm:text-6xl font-black text-white leading-[0.9] tracking-tight"
            style={{ fontFamily: 'Space Grotesk' }}>
            Explorar<span className="text-[#FFE600]">.</span>
          </h1>
        </div>

        <Suspense fallback={
          <div className="space-y-4">
            <div className="h-12 bg-[#141414] border border-[#1f1f1f] animate-pulse" />
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i}>
                  <div className="aspect-[2/3] bg-[#141414] animate-pulse border border-[#1f1f1f]" />
                  <div className="h-2 bg-[#141414] animate-pulse mt-2 w-3/4" />
                </div>
              ))}
            </div>
          </div>
        }>
          <AdvancedFilters initialParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
