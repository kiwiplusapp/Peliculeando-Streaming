'use client';

import { useState } from 'react';
import { SelfHostedPlayer } from '@/components/media/SelfHostedPlayer';

interface StreamResp {
  sourceId: string;
  type: 'hls' | 'file';
  playlist?: string;
  qualities?: Record<string, { type: string; url: string }>;
  headers: Record<string, string>;
  captions: { id: string; language: string; url: string; type: string }[];
}

export default function ReproductorTest() {
  const [type, setType] = useState<'movie' | 'tv'>('movie');
  const [id, setId] = useState('550'); // Fight Club
  const [season, setSeason] = useState('1');
  const [episode, setEpisode] = useState('1');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<StreamResp | null>(null);
  const [error, setError] = useState<string | null>(null);

  const proxiedPlaylist = (d: StreamResp) => {
    if (!d.playlist) return '';
    const h = btoa(JSON.stringify(d.headers || {}));
    return `/api/hls-proxy?url=${encodeURIComponent(d.playlist)}&h=${encodeURIComponent(h)}`;
  };

  const run = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const params = new URLSearchParams({ type, id });
      if (type === 'tv') {
        params.set('season', season);
        params.set('episode', episode);
      }
      const r = await fetch(`/api/stream?${params.toString()}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || j.error || 'Error');
      setData(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 max-w-3xl mx-auto">
      <h1 className="text-lg font-black tracking-widest text-[#FFE600] mb-1">
        REPRODUCTOR — PRUEBA (self-hosted)
      </h1>
      <p className="text-xs text-[#737373] mb-4">
        Sin anuncios · player propio · selector de audio. TMDB id + tipo.
      </p>

      <div className="flex flex-wrap items-end gap-2 mb-4">
        <label className="flex flex-col text-[10px] text-[#737373]">
          TIPO
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'movie' | 'tv')}
            className="bg-[#141414] border border-[#1f1f1f] px-2 py-1.5 text-sm text-white"
          >
            <option value="movie">Película</option>
            <option value="tv">Serie</option>
          </select>
        </label>
        <label className="flex flex-col text-[10px] text-[#737373]">
          TMDB ID
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="bg-[#141414] border border-[#1f1f1f] px-2 py-1.5 text-sm text-white w-24"
          />
        </label>
        {type === 'tv' && (
          <>
            <label className="flex flex-col text-[10px] text-[#737373]">
              TEMP
              <input
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="bg-[#141414] border border-[#1f1f1f] px-2 py-1.5 text-sm text-white w-16"
              />
            </label>
            <label className="flex flex-col text-[10px] text-[#737373]">
              EP
              <input
                value={episode}
                onChange={(e) => setEpisode(e.target.value)}
                className="bg-[#141414] border border-[#1f1f1f] px-2 py-1.5 text-sm text-white w-16"
              />
            </label>
          </>
        )}
        <button
          onClick={run}
          disabled={loading}
          className="bg-[#FFE600] text-black font-bold px-4 py-2 text-sm disabled:opacity-50"
        >
          {loading ? 'Buscando…' : 'Reproducir'}
        </button>
      </div>

      {error && (
        <div className="text-red-400 text-sm border border-red-900 bg-red-950/30 p-3 mb-4">
          {error}
        </div>
      )}

      {data && data.type === 'hls' && data.playlist && (
        <>
          <div className="text-[11px] text-[#737373] mb-2">
            Fuente: <span className="text-[#FFE600]">{data.sourceId}</span> · {data.captions.length} subtítulos
          </div>
          <div className="aspect-video w-full">
            <SelfHostedPlayer playlistUrl={proxiedPlaylist(data)} captions={data.captions} />
          </div>
        </>
      )}

      {data && data.type === 'file' && (
        <div className="text-amber-400 text-sm">
          La fuente devolvió archivo directo (mp4), no HLS. Fuente: {data.sourceId}. Calidades:{' '}
          {Object.keys(data.qualities || {}).join(', ')}
        </div>
      )}
    </div>
  );
}
