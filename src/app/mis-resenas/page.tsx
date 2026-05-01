import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { MyReviewsContent } from '@/components/media/MyReviewsContent';

export const metadata = { title: 'Mis reseñas — Peliculeando' };

export default async function MisResenasPage() {
  const session = await getSession();
  if (!session) redirect('/');

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-[1400px] mx-auto px-6">
        <h1 className="text-2xl font-bold text-white mb-6">Mis reseñas</h1>
        <MyReviewsContent />
      </div>
    </div>
  );
}
