'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import { PlayerModal } from './PlayerModal';

interface PlayerButtonProps {
  item: {
    tmdb_id: number;
    media_type: 'movie' | 'tv';
    title: string;
    poster_path?: string | null;
    release_date?: string;
    number_of_seasons?: number;
  };
}

export function PlayerButton({ item }: PlayerButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold text-sm rounded-xl hover:bg-amber-400 transition-colors shadow-lg"
      >
        <Play size={16} fill="black" /> Reproducir
      </button>

      {open && <PlayerModal item={item} onClose={() => setOpen(false)} />}
    </>
  );
}
