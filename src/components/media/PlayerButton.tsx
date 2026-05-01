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
      className="flex items-center gap-2 px-5 py-2.5 text-[11px] font-black tracking-widest text-black hover:opacity-90 transition-opacity"
      style={{ background: '#FFE600', fontFamily: 'Space Grotesk' }}
    >
      <Play size={12} fill="#000" /> VER AHORA
    </button>
  );
}
