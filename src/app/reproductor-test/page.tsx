'use client';

import { useState } from 'react';
import { SelfHostedPlayer } from '@/components/media/SelfHostedPlayer';
import { loadSubtitles, type Sub } from '@/lib/subtitles';

interface Attempt {
  provider: string;
  stage: string;
  ok: boolean;
  note?: string;
}

interface StreamResp {
  sourceId?: string;
  type?: 'hls' | 'file';
  playlist?: string;
  fallbacks?: string[];
  qualities?: Record<string, { type: string; url: string }>;
  headers?: Record<string, string>;
  imdbId?: string;
  attempts?: Attempt[];
  media?: { title: string; year: number };
  error?: string;
  detail?: string;
}

export default function ReproductorTest() {
  const [type, setType] = useState<'movie' | 'tv'>('movie');
  const [id, setId] = useState('550'); // Fight Club
  const [season, setSeason] = useState('1');
  const [episode, setEpisode] = useState('1');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<StreamResp | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serverIdx, setServerIdx] = useState(0);
  const [subs, setSubs] = useState<Sub[]>([]);

  const proxied = (url: string, headers: Record<string, string> = {}) => {
    const h = btoa(JSON.stringify(headers));
    return `/api/hls-proxy?url=${encodeURIComponent(url)}&h=${encodeURIComponent(h)}`;
  };

  const mirrors = (d: StreamResp): string[] =>
    [d.playlist, ...(d.fallbacks || [])].filter(Boolean) as string[];

  const run = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    setServerIdx(0);
    setSubs([]);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 65_000); // never spin forever
    try {
      const params = new URLSearchParams({ type, id });
      if (type === 'tv') {
        params.set('season', season);
        params.set('episode', episode);
      }
      const r = await fetch(`/api/stream?${params.toString()}`, { signal: ctrl.signal });
      const j: StreamResp = await r.json();
      setData(j); // keep attempts even on failure
      if (!r.ok) setError(j.detail || j.error || `HTTP ${r.status}`);
      else if (j.imdbId) {
        loadSubtitles(j.imdbId, type, Number(season), Number(episode))
          .then(setSubs)
          .catch(() => {});
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        setError('Timeout: la búsqueda tardó más de 65s (todas las fuentes colgaron).');
      } else {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 max-w-3xl mx-auto">
      <h1 className="text-lg font-black tracking-widest text-[#FFE600] mb-1">
        REPRODUCTOR — PRUEBA (self-hosted)
      </h1>
      <p className="text-xs text-[#737373] mb-4">
        Sin anuncios · player propio · diagnóstico por fuente.
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

      {/* Diagnostics: what each source did */}
      {data?.attempts && data.attempts.length > 0 && (
        <div className="mb-4 border border-[#1f1f1f] bg-[#0A0A0A] p-3">
          <div className="text-[10px] font-black tracking-widest text-[#525252] mb-2">
            DIAGNÓSTICO {data.media ? `· ${data.media.title} (${data.media.year})` : ''}
          </div>
          <ul className="space-y-1 text-xs font-mono">
            {data.attempts.map((a, i) => (
              <li key={i} className={a.ok ? 'text-green-400' : 'text-[#a3a3a3]'}>
                {a.ok ? '✅' : '❌'} {a.provider} · {a.stage}
                {a.note ? ` · ${a.note}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data?.type === 'hls' && data.playlist && (
        <>
          <div className="text-[11px] text-[#737373] mb-2">
            Fuente: <span className="text-[#FFE600]">{data.sourceId}</span> ·{' '}
            {subs.length} subtítulos · {mirrors(data).length} servidores
          </div>
          <div className="aspect-video w-full">
            <SelfHostedPlayer
              key={serverIdx}
              src={proxied(mirrors(data)[serverIdx], data.headers || {})}
              captions={subs}
            />
          </div>

          {mirrors(data).length > 1 && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-[10px] font-black tracking-widest text-[#525252]">SERVIDOR</span>
              {mirrors(data).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setServerIdx(i)}
                  className={`px-3 py-1.5 text-[11px] font-bold border transition-colors ${
                    i === serverIdx
                      ? 'bg-[#FFE600] text-black border-[#FFE600]'
                      : 'bg-[#141414] text-[#A3A3A3] hover:text-white border-[#1f1f1f]'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {data?.type === 'file' && (
        <div className="text-amber-400 text-sm">
          Fuente devolvió archivo directo (mp4): {data.sourceId}. Calidades:{' '}
          {Object.keys(data.qualities || {}).join(', ')}
        </div>
      )}
    </div>
  );
}
