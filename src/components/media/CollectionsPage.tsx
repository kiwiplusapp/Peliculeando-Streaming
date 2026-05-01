'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { imgUrl } from '@/lib/tmdb';
import { Plus, Globe, Lock, BookMarked, X } from 'lucide-react';
import { toast } from '@/components/ui/Toaster';

interface Collection {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  is_public: boolean;
  cover_poster: string | null;
  username: string;
  item_count: string;
  follower_count?: string;
  updated_at: string;
}

export function CollectionsPage({ userId }: { userId?: string }) {
  const [publicCollections, setPublicCollections] = useState<Collection[]>([]);
  const [myCollections, setMyCollections] = useState<Collection[]>([]);
  const [tab, setTab] = useState<'discover' | 'mine'>('discover');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPublic, setNewPublic] = useState(true);

  const fetchPublic = async () => {
    const r = await fetch('/api/collections?public=1');
    const d = await r.json();
    setPublicCollections(d.collections || []);
  };

  const fetchMine = async () => {
    if (!userId) return;
    const r = await fetch(`/api/collections?user_id=${userId}`);
    const d = await r.json();
    setMyCollections(d.collections || []);
  };

  useEffect(() => {
    Promise.all([fetchPublic(), fetchMine()]).finally(() => setLoading(false));
  }, [userId]);

  const createCollection = async () => {
    if (!newTitle.trim()) return;
    const res = await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, description: newDesc, is_public: newPublic }),
    });
    if (res.ok) {
      toast('Colección creada ✓');
      setNewTitle(''); setNewDesc(''); setShowCreate(false);
      await fetchMine();
      setTab('mine');
    } else {
      const j = await res.json();
      if (res.status === 401) { toast('Inicia sesión', 'error'); return; }
      toast(j.error || 'Error', 'error');
    }
  };

  const deleteCollection = async (id: number) => {
    await fetch('/api/collections', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    toast('Colección eliminada');
    setMyCollections(prev => prev.filter(c => c.id !== id));
  };

  const displayedCollections = tab === 'mine' ? myCollections : publicCollections;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Colecciones</h1>
          <p className="text-sm text-[#A3A3A3] mt-0.5">Playlists de películas y series creadas por la comunidad</p>
        </div>
        {userId && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold rounded-lg transition-colors"
          >
            <Plus size={15} /> Nueva colección
          </button>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="bg-[#111111] border border-[#262626] rounded-2xl p-6 w-full max-w-md animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Nueva colección</h3>
              <button onClick={() => setShowCreate(false)} className="text-[#A3A3A3] hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Nombre de la colección"
                className="w-full bg-[#181818] border border-[#262626] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-[#525252] focus:outline-none focus:border-amber-500"
              />
              <textarea
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Descripción (opcional)"
                rows={2}
                className="w-full bg-[#181818] border border-[#262626] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-[#525252] focus:outline-none focus:border-amber-500 resize-none"
              />
              <label className="flex items-center gap-2 cursor-pointer text-sm text-[#A3A3A3]">
                <input type="checkbox" checked={newPublic} onChange={e => setNewPublic(e.target.checked)} className="accent-amber-500" />
                Colección pública (visible para todos)
              </label>
              <button
                onClick={createCollection}
                disabled={!newTitle.trim()}
                className="w-full py-2.5 bg-brand text-black font-bold font-medium text-sm rounded-lg hover:opacity-90 disabled:opacity-40"
              >
                Crear colección
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-[#111111] p-1 rounded-xl mb-6 w-fit">
        <button onClick={() => setTab('discover')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'discover' ? 'bg-[#262626] text-white' : 'text-[#A3A3A3] hover:text-white'}`}>
          <Globe size={14} className="inline mr-1.5" />Descubrir
        </button>
        {userId && (
          <button onClick={() => setTab('mine')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'mine' ? 'bg-[#262626] text-white' : 'text-[#A3A3A3] hover:text-white'}`}>
            <BookMarked size={14} className="inline mr-1.5" />Mis colecciones
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton aspect-[3/4] rounded-xl" />)}
        </div>
      ) : displayedCollections.length === 0 ? (
        <div className="text-center py-16 text-[#525252]">
          <BookMarked size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium text-[#A3A3A3]">{tab === 'mine' ? 'Aún no tienes colecciones' : 'No hay colecciones públicas'}</p>
          {tab === 'mine' && userId && (
            <button onClick={() => setShowCreate(true)} className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-lg transition-colors">
              Crear la primera
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayedCollections.map(col => (
            <div key={col.id} className="relative group">
              <Link href={`/colecciones/${col.id}`}
                className="block bg-[#111111] border border-[#262626] rounded-xl overflow-hidden hover:border-amber-500/40 transition-colors">
                <div className="relative aspect-[16/9] bg-[#181818] overflow-hidden">
                  {col.cover_poster ? (
                    <Image src={`https://image.tmdb.org/t/p/w500${col.cover_poster}`} alt={col.title} fill sizes="300px" className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookMarked size={32} className="text-[#333333]" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  {!col.is_public && (
                    <div className="absolute top-2 right-2 p-1 bg-black/60 rounded-lg">
                      <Lock size={12} className="text-[#A3A3A3]" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-semibold text-white text-sm line-clamp-1">{col.title}</p>
                  {col.description && (
                    <p className="text-xs text-[#A3A3A3] mt-0.5 line-clamp-2">{col.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-[#525252]">
                    <span>{col.item_count} títulos</span>
                    <span>·</span>
                    <span>@{col.username}</span>
                  </div>
                </div>
              </Link>

              {tab === 'mine' && (
                <button
                  onClick={() => deleteCollection(col.id)}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center text-[#A3A3A3] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
