'use client';

import { useEffect, useState } from 'react';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { SelfHostedPlayer } from './SelfHostedPlayer';
import { loadSubtitles, type Sub } from '@/lib/subtitles';

/**
 * Resolves a stream via /api/stream, builds proxied HLS URLs, loads subtitles
 * client-side from OpenSubtitles, and renders the self-hosted player.
 */
export function StreamPlayer({
  type,
  id,
  season,
  episode,
}: {
  type: 'movie' | 'tv';
  id: number | string;
  season?: number;
  episode?: number;
}) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [sources, setSources] = useState<string[]>([]);
  const [captions, setCaptions] = useState<Sub[]>([]);
  const [server, setServer] = useState(0);
  const [errMsg, setErrMsg] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 65_000);

    setStatus('loading');
    setServer(0);
    setCaptions([]);

    const params = new URLSearchParams({ type, id: String(id) });
    if (type === 'tv') {
      params.set('season', String(season || 1));
      params.set('episode', String(episode || 1));
    }

    fetch(`/api/stream?${params.toString()}`, { signal: ctrl.signal })
      .then(async (r) => ({ ok: r.ok, j: await r.json() }))
      .then(({ ok, j }) => {
        if (cancelled) return;
        if (!ok || !j.playlist) {
          setErrMsg(j.error || 'No se encontró una fuente reproducible.');
          setStatus('error');
          return;
        }
        const h = btoa(JSON.stringify(j.headers || {}));
        const proxy = (u: string) =>
          `/api/hls-proxy?url=${encodeURIComponent(u)}&h=${encodeURIComponent(h)}`;
        const mirrors = [j.playlist, ...(j.fallbacks || [])]
          .filter(Boolean)
          .map((u: string) => proxy(u));
        setSources(mirrors);
        setStatus('ready');

        // Subtitles are loaded in the browser (OpenSubtitles blocks datacenter IPs)
        if (j.imdbId) {
          loadSubtitles(j.imdbId, type, season, episode)
            .then((subs) => { if (!cancelled) setCaptions(subs); })
            .catch(() => {});
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setErrMsg(e?.name === 'AbortError' ? 'La búsqueda tardó demasiado.' : 'Error de red.');
        setStatus('error');
      })
      .finally(() => clearTimeout(timer));

    return () => {
      cancelled = true;
      ctrl.abort();
      clearTimeout(timer);
    };
  }, [type, id, season, episode, reload]);

  if (status === 'loading') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-black text-[#737373]">
        <Loader2 className="animate-spin text-[#FFE600]" size={40} />
        <span className="text-xs tracking-widest">CARGANDO…</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-black text-center px-6">
        <AlertTriangle className="text-[#FFE600]" size={36} />
        <p className="text-sm text-[#A3A3A3] max-w-xs">{errMsg}</p>
        <button
          onClick={() => setReload((n) => n + 1)}
          className="flex items-center gap-2 bg-[#FFE600] text-black font-bold px-4 py-2 text-sm"
        >
          <RefreshCw size={15} /> Reintentar
        </button>
      </div>
    );
  }

  return (
    <SelfHostedPlayer
      src={sources[server]}
      captions={captions}
      servers={sources.length}
      server={server}
      onServer={setServer}
    />
  );
}
