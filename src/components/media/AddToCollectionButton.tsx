'use client';

import { useState, useEffect, useRef } from 'react';
import { FolderPlus, Check, ChevronDown, Loader2, Plus, X } from 'lucide-react';
import { toast } from '@/components/ui/Toaster';
import { useAuth } from '@/components/layout/AuthProvider';

interface Collection {
  id: number;
  title: string;
  item_count: string;
}

interface Props {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
}

export function AddToCollectionButton({ tmdbId, mediaType, title, posterPath }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<number | null>(null);
  const [added, setAdded] = useState<Set<number>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchCollections = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/collections?user_id=${user.sub}`);
      const d = await r.json();
      setCollections(d.collections || []);
    } catch {
      toast('Error cargando colecciones', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    if (!user) { toast('Inicia sesión para añadir a colecciones', 'error'); return; }
    setOpen(v => !v);
    if (!open) fetchCollections();
  };

  const addToCollection = async (collectionId: number) => {
    if (adding) return;
    setAdding(collectionId);
    try {
      const res = await fetch('/api/collections/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection_id: collectionId,
          tmdb_id: tmdbId,
          media_type: mediaType,
          title,
          poster_path: posterPath,
        }),
      });
      if (res.ok) {
        setAdded(prev => new Set(prev).add(collectionId));
        toast('Añadido a la colección');
      } else {
        const j = await res.json();
        toast(j.error || 'Error', 'error');
      }
    } catch {
      toast('Error de conexión', 'error');
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-4 py-2.5 bg-[#1A1A1A] hover:bg-[#222222] border border-[#333333] hover:border-amber-500/50 text-white font-medium text-sm rounded-lg transition-all"
      >
        <FolderPlus size={16} className="text-amber-400" />
        Añadir a colección
        <ChevronDown size={14} className={`text-[#A3A3A3] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-64 bg-[#181818] border border-[#262626] rounded-xl shadow-2xl shadow-black/60 z-30 animate-fade-in overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#262626]">
            <span className="text-sm font-semibold text-white">Mis colecciones</span>
            <button onClick={() => setOpen(false)} className="text-[#525252] hover:text-white transition-colors">
              <X size={14} />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={18} className="animate-spin text-amber-500" />
            </div>
          ) : collections.length === 0 ? (
            <div className="py-6 px-4 text-center">
              <p className="text-sm text-[#525252] mb-3">No tienes colecciones todavía</p>
              <a
                href="/colecciones"
                className="text-xs text-amber-400 hover:text-amber-300 underline"
              >
                Crear una colección
              </a>
            </div>
          ) : (
            <ul className="max-h-60 overflow-y-auto py-1">
              {collections.map(col => {
                const isAdded = added.has(col.id);
                const isAdding = adding === col.id;
                return (
                  <li key={col.id}>
                    <button
                      onClick={() => !isAdded && addToCollection(col.id)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                        isAdded
                          ? 'text-amber-400 bg-amber-500/5 cursor-default'
                          : 'text-[#A3A3A3] hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium">{col.title}</p>
                        <p className="text-xs text-[#525252]">{col.item_count} títulos</p>
                      </div>
                      {isAdding ? (
                        <Loader2 size={14} className="animate-spin text-amber-500 shrink-0" />
                      ) : isAdded ? (
                        <Check size={14} className="text-amber-400 shrink-0" />
                      ) : (
                        <Plus size={14} className="shrink-0 opacity-0 group-hover:opacity-100" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
