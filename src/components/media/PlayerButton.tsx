'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import { PlayerModal } from './PlayerModal';

interface PlayerButtonProps {
  item: {
    tmdb_id: number;
    media_type: 'movie' | 'tv';
    title: string;
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
        className="flex items-center gap-2 px-5 py-2.5 bg-white text-black font-semibold text-sm rounded-lg hover:bg-white/90 transition-colors"
      >
        <Play size={16} fill="black" /> Reproducir
      </button>

      {open && <PlayerModal item={item} onClose={() => setOpen(false)} />}
    </>
  );
}
