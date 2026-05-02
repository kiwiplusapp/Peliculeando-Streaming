'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, X } from 'lucide-react';
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
      toast('Colección creada');
      setNewTitle(''); setNewDesc(''); setShowCreate(false);
      await fetchMine(); setTab('mine');
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
      {/* ── HEADER ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[8px] font-mono text-[#333] tracking-[0.25em] mb-1">LISTAS · COMUNIDAD</p>
          <h1 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
            Colecciones<span className="text-[#FFE600]">.</span>
          </h1>
          <p className="text-xs text-[#525252] mt-1 font-mono tracking-wide">
            Playlists creadas por la comunidad
          </p>
        </div>
        {userId && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 text-[10px] font-black tracking-widest text-black bg-[#FFE600] hover:opacity-90 transition-opacity"
            style={{ fontFamily: 'Space Grotesk' }}>
            <Plus size={13} /> NUEVA LISTA
          </button>
        )}
      </div>

      {/* ── CREATE MODAL ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="border border-[#2a2a2a] p-6 w-full max-w-md" style={{ background: '#0D0D0D' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[8px] font-mono text-[#333] tracking-widest mb-0.5">NUEVA</p>
                <h3 className="text-sm font-black text-white tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
                  CREAR COLECCIÓN
                </h3>
              </div>
              <button onClick={() => setShowCreate(false)} className="text-[#333] hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="NOMBRE DE LA COLECCIÓN"
                className="w-full bg-[#111] border border-[#2a2a2a] px-3 py-2.5 text-sm text-white placeholder:text-[#333] focus:outline-none focus:border-[#FFE600]/30 font-mono text-[11px] tracking-wide"
              />
              <textarea
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Descripción (opcional)"
                rows={2}
                className="w-full bg-[#111] border border-[#2a2a2a] px-3 py-2.5 text-sm text-white placeholder:text-[#333] focus:outline-none focus:border-[#FFE600]/30 resize-none font-mono text-[11px]"
              />
              <label className="flex items-center gap-2 cursor-pointer text-[9px] font-mono text-[#525252] tracking-widest">
                <input type="checkbox" checked={newPublic} onChange={e => setNewPublic(e.target.checked)} className="accent-[#FFE600]" />
                COLECCIÓN PÚBLICA
              </label>
              <button onClick={createCollection} disabled={!newTitle.trim()}
                className="w-full py-2.5 text-[10px] font-black tracking-widest text-black bg-[#FFE600] hover:opacity-90 disabled:opacity-40 transition-opacity"
                style={{ fontFamily: 'Space Grotesk' }}>
                CREAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TABS ── */}
      <div className="flex items-center gap-0 mb-6 border-b border-[#1f1f1f]">
        {[{ key: 'discover', label: 'DESCUBRIR' }, { key: 'mine', label: 'MIS LISTAS' }].map(t => (
          (t.key === 'mine' && !userId) ? null : (
            <button key={t.key}
              onClick={() => setTab(t.key as 'discover' | 'mine')}
              className={`px-4 py-2.5 text-[10px] font-black tracking-widest border-b-2 -mb-px transition-colors ${
                tab === t.key ? 'text-[#FFE600] border-[#FFE600]' : 'text-[#333] border-transparent hover:text-[#525252]'
              }`}
              style={{ fontFamily: 'Space Grotesk' }}>
              {t.label}
            </button>
          )
        ))}
      </div>

      {/* ── GRID ── */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-0 border border-[#1f1f1f]">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-[#141414] border-r border-b border-[#1f1f1f] animate-pulse" />
          ))}
        </div>
      ) : displayedCollections.length === 0 ? (
        <div className="border border-[#1f1f1f] px-6 py-16 text-center">
          <p className="text-[10px] font-mono text-[#333] tracking-widest">
            {tab === 'mine' ? 'SIN COLECCIONES AÚN' : 'SIN COLECCIONES PÚBLICAS'}
          </p>
          {tab === 'mine' && userId && (
            <button onClick={() => setShowCreate(true)}
              className="mt-4 px-4 py-2 text-[10px] font-black tracking-widest text-black bg-[#FFE600] hover:opacity-90 transition-opacity"
              style={{ fontFamily: 'Space Grotesk' }}>
              CREAR LA PRIMERA
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 border border-[#1f1f1f]">
          {displayedCollections.map((col, idx) => (
            <div key={col.id} className="relative group border-r border-b border-[#1f1f1f] last:border-r-0">
              <Link href={`/colecciones/${col.id}`}
                className="block hover:bg-white/[0.02] transition-colors">
                {/* Cover */}
                <div className="relative aspect-[16/9] bg-[#141414] overflow-hidden">
                  {col.cover_poster ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w500${col.cover_poster}`}
                      alt={col.title}
                      fill sizes="300px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center"
                      style={{ background: 'repeating-linear-gradient(45deg, #0A0A0A, #0A0A0A 4px, #141414 4px, #141414 8px)' }}>
                      <span className="text-[#1f1f1f] text-2xl font-black font-mono">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {!col.is_public && (
                    <div className="absolute top-2 right-2">
                      <span className="text-[7px] font-mono tracking-widest bg-black/80 text-[#525252] px-1.5 py-0.5">
                        PRIVADA
                      </span>
                    </div>
                  )}
                </div>

                {/* Meta */}
                <div className="p-3">
                  <p className="text-[11px] font-bold text-white line-clamp-1 group-hover:text-[#FFE600] transition-colors">
                    {col.title.toUpperCase()}
                  </p>
                  {col.description && (
                    <p className="text-[9px] text-[#525252] mt-0.5 line-clamp-1">{col.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-2 text-[8px] font-mono tracking-widest">
                    <span className="text-[#333]">{col.item_count} TÍTULOS</span>
                    <span className="text-[#1f1f1f]">@{col.username}</span>
                  </div>
                </div>
              </Link>

              {/* Delete button for mine */}
              {tab === 'mine' && (
                <button onClick={() => deleteCollection(col.id)}
                  className="absolute top-2 left-2 w-5 h-5 flex items-center justify-center text-[#333] hover:text-red-400 bg-black/60 opacity-0 group-hover:opacity-100 transition-all border border-[#2a2a2a]">
                  <X size={9} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
