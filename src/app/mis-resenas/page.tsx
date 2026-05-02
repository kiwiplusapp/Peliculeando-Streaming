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
        <div className="mb-8 pt-4">
          <p className="text-[9px] font-mono text-[#333] tracking-[0.25em] mb-2">PERFIL · MIS</p>
          <h1 className="text-5xl font-black text-white leading-[0.9] tracking-tight mb-1"
            style={{ fontFamily: 'Space Grotesk' }}>
            Mis Reseñas<span className="text-[#FFE600]">.</span>
          </h1>
        </div>
        <MyReviewsContent />
      </div>
    </div>
  );
}
