import { Suspense } from 'react';
import { AdvancedFilters } from '@/components/media/AdvancedFilters';

export const metadata = { title: 'Explorar — Peliculeando' };

export default function ExplorarPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-[1400px] mx-auto px-6">
        <h1 className="text-2xl font-bold text-white mb-6">Explorar</h1>
        <Suspense fallback={null}>
          <AdvancedFilters initialParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
