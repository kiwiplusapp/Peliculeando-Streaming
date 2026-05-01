'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Tag } from 'lucide-react';
import { toast } from '@/components/ui/Toaster';

interface TagData {
  tag: string;
  count: string;
  user_voted: boolean;
}

const SUGGESTIONS = [
  'plot twist', 'mind-blowing', 'slow burn', 'feel-good', 'tear-jerker',
  'edge of your seat', 'hidden gem', 'binge-worthy', 'dark', 'thought-provoking',
  'happy ending', 'sad ending', 'cult classic', 'based on true events',
];

export function TagSection({
  tmdbId,
  mediaType,
  userId,
}: {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  userId?: string;
}) {
  const [tags, setTags] = useState<TagData[]>([]);
  const [input, setInput] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchTags = async () => {
    try {
      const r = await fetch(`/api/tags?tmdb_id=${tmdbId}&media_type=${mediaType}`);
      const d = await r.json();
      setTags(d.tags || []);
    } catch {}
  };

  useEffect(() => { fetchTags(); }, [tmdbId]);

  const voteTag = async (tag: string, hasVoted: boolean) => {
    if (!userId) { toast('Inicia sesión para votar tags', 'error'); return; }
    try {
      const method = hasVoted ? 'DELETE' : 'POST';
      const res = await fetch('/api/tags', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmdb_id: tmdbId, media_type: mediaType, tag }),
      });
      if (res.ok) {
        const d = await res.json();
        setTags(d.tags || []);
      }
    } catch {}
  };

  const addTag = async (tag: string) => {
    const clean = tag.trim().toLowerCase();
    if (!clean) return;
    if (!userId) { toast('Inicia sesión para añadir tags', 'error'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmdb_id: tmdbId, media_type: mediaType, tag: clean }),
      });
      if (res.ok) {
        const d = await res.json();
        setTags(d.tags || []);
        setInput('');
        setShowInput(false);
        toast('Tag añadido ✓');
      }
    } catch { toast('Error', 'error'); } finally { setLoading(false); }
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <Tag size={14} className="text-amber-400" />
        Tags de la comunidad
      </h3>

      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map(t => (
          <button
            key={t.tag}
            onClick={() => voteTag(t.tag, t.user_voted)}
            className={`tag-pill ${t.user_voted ? 'active' : ''}`}
          >
            {t.tag}
            <span className="text-[#525252] text-[10px]">{t.count}</span>
          </button>
        ))}

        {userId && (
          showInput ? (
            <div className="flex items-center gap-1">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addTag(input); if (e.key === 'Escape') setShowInput(false); }}
                placeholder="Nuevo tag..."
                autoFocus
                className="bg-[#181818] border border-[#333333] rounded-full px-3 py-1 text-xs text-white placeholder:text-[#525252] focus:outline-none focus:border-amber-500 w-32"
              />
              <button onClick={() => addTag(input)} disabled={loading} className="tag-pill active">
                <Plus size={12} />
              </button>
              <button onClick={() => setShowInput(false)} className="tag-pill">
                <X size={12} />
              </button>
            </div>
          ) : (
            <button onClick={() => setShowInput(true)} className="tag-pill">
              <Plus size={12} /> Añadir tag
            </button>
          )
        )}
      </div>

      {/* Suggestions when input is open */}
      {showInput && (
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.filter(s => !tags.find(t => t.tag === s)).slice(0, 6).map(s => (
            <button key={s} onClick={() => addTag(s)} className="text-xs px-2 py-1 bg-[#181818] text-[#525252] hover:text-[#A3A3A3] rounded-full border border-[#262626] transition-colors">
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
