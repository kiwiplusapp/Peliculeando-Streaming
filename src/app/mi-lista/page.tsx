import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { WatchlistContent } from '@/components/media/WatchlistContent';

export const metadata = { title: 'Mi Lista — Peliculeando' };

export default async function MiListaPage() {
  const session = await getSession();
  if (!session) redirect('/');

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="mb-8 pt-4 border-b border-[#1f1f1f] pb-6">
          <p className="text-[9px] font-mono text-[#333] tracking-[0.25em] mb-2">
            QUIERO VER · WATCHLIST
          </p>
          <h1
            className="text-5xl sm:text-6xl font-black text-white leading-[0.9] tracking-tight"
            style={{ fontFamily: 'Space Grotesk' }}>
            Mi Lista<span className="text-[#FFE600]">.</span>
          </h1>
        </div>

        <WatchlistContent />
      </div>
    </div>
  );
}
