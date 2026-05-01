import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { WatchlistContent } from '@/components/media/WatchlistContent';

export const metadata = { title: 'Mi lista — Peliculeando' };

export default async function MiListaPage() {
  const session = await getSession();
  if (!session) redirect('/');

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-[1400px] mx-auto px-6">
        <h1 className="text-2xl font-bold text-white mb-6">Mi lista</h1>
        <WatchlistContent />
      </div>
    </div>
  );
}
