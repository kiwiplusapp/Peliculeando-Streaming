import { Trophy, Star, ThumbsUp, MessageSquare, TrendingUp } from 'lucide-react';
import { LeaderboardContent } from '@/components/media/LeaderboardContent';
import { WeeklyTopContent } from '@/components/media/WeeklyTopContent';

export const metadata = { title: 'Comunidad — Peliculeando' };

export default function CommunidadPage() {
  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-[1400px] mx-auto px-6">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">Comunidad</h1>
          <p className="text-[#A3A3A3]">Los mejores críticos y lo más visto esta semana</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Leaderboard - 1/3 */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-6 h-6 rounded-md bg-amber-500 flex items-center justify-center">
                <Trophy size={13} className="text-black" />
              </div>
              <h2 className="font-bold text-lg text-white">Mejores críticos</h2>
            </div>
            <div className="text-xs text-[#525252] flex gap-4 mb-4">
              <span className="flex items-center gap-1"><MessageSquare size={11} /> Reseñas × 10</span>
              <span className="flex items-center gap-1"><ThumbsUp size={11} /> Votos útiles × 3</span>
              <span className="flex items-center gap-1"><Star size={11} /> Tags × 1</span>
            </div>
            <LeaderboardContent />
          </div>

          {/* Weekly top - 2/3 */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-6 h-6 rounded-md bg-amber-500 flex items-center justify-center">
                <TrendingUp size={13} className="text-black" />
              </div>
              <h2 className="font-bold text-lg text-white">Top semanal</h2>
              <span className="text-xs text-[#525252] ml-auto">Basado en actividad real de usuarios</span>
            </div>
            <WeeklyTopContent />
          </div>
        </div>
      </div>
    </div>
  );
}
