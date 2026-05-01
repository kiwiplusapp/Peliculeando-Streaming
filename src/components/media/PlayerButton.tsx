'use client';

import { useRouter } from 'next/navigation';
import { Play } from 'lucide-react';

interface PlayerButtonProps {
  item: {
    tmdb_id: number;
    media_type: 'movie' | 'tv';
    title: string;
    poster_path?: string | null;
    number_of_seasons?: number;
  };
}

export function PlayerButton({ item }: PlayerButtonProps) {
  const router = useRouter();

  const handlePlay = () => {
    const params = new URLSearchParams();
    if (item.number_of_seasons) params.set('seasons', String(item.number_of_seasons));
    router.push(`/watch/${item.media_type}/${item.tmdb_id}?${params.toString()}`);
  };

  return (
    <button
      onClick={handlePlay}
      className="flex items-center gap-2.5 px-6 py-3 bg-white text-black font-bold text-sm rounded-xl hover:bg-amber-400 transition-colors shadow-lg"
    >
      <Play size={16} fill="black" /> Reproducir
    </button>
  );
}
