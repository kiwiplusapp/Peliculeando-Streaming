import { CollectionsPage } from '@/components/media/CollectionsPage';
import { getSession } from '@/lib/auth';

export const metadata = { title: 'Colecciones — Peliculeando' };

export default async function ColeccionesPage() {
  const session = await getSession();
  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-[1400px] mx-auto px-6">
        <CollectionsPage userId={session?.sub} />
      </div>
    </div>
  );
}
