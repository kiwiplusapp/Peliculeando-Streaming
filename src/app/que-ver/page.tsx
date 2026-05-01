import { DecisionHelper } from '@/components/media/DecisionHelper';

export const metadata = { title: '¿Qué ver? — Peliculeando' };

export default function QueVerPage() {
  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">¿Qué ver ahora?</h1>
          <p className="text-[#A3A3A3]">
            Dinos cómo te sientes y te decimos qué poner
          </p>
        </div>
        <DecisionHelper />
      </div>
    </div>
  );
}
