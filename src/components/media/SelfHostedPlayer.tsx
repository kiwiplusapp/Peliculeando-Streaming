'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface Caption {
  id: string;
  language: string;
  url: string;
  type: string;
}

interface AudioTrack {
  id: number;
  name: string;
  lang?: string;
}

/**
 * Self-hosted player: plays an HLS master playlist (already routed through
 * /api/hls-proxy) with a native <video> + hls.js, exposing an audio-track
 * selector. No ads, no popups — we own the player.
 */
export function SelfHostedPlayer({
  playlistUrl,
  captions = [],
}: {
  playlistUrl: string;
  captions?: Caption[];
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [currentAudio, setCurrentAudio] = useState<number>(-1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Safari / iOS can play HLS natively
    if (!Hls.isSupported()) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = playlistUrl;
      } else {
        setError('Tu navegador no soporta HLS.');
      }
      return;
    }

    const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
    hlsRef.current = hls;
    hls.loadSource(playlistUrl);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.play().catch(() => {});
    });

    hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, () => {
      const tracks = hls.audioTracks.map((t, i) => ({
        id: i,
        name: t.name || t.lang || `Audio ${i + 1}`,
        lang: t.lang,
      }));
      setAudioTracks(tracks);
      setCurrentAudio(hls.audioTrack);
    });

    hls.on(Hls.Events.ERROR, (_e, data) => {
      if (data.fatal) setError(`Error de reproducción: ${data.details}`);
    });

    return () => {
      hls.destroy();
      hlsRef.current = null;
    };
  }, [playlistUrl]);

  const switchAudio = (id: number) => {
    if (hlsRef.current) {
      hlsRef.current.audioTrack = id;
      setCurrentAudio(id);
    }
  };

  return (
    <div className="relative w-full h-full bg-black flex flex-col">
      <video
        ref={videoRef}
        controls
        playsInline
        crossOrigin="anonymous"
        className="w-full h-full flex-1 bg-black"
      >
        {captions.map((c) => (
          <track
            key={c.id}
            kind="subtitles"
            srcLang={c.language}
            label={c.language}
            src={`/api/hls-proxy?url=${encodeURIComponent(c.url)}`}
          />
        ))}
      </video>

      {audioTracks.length > 1 && (
        <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-[#0A0A0A] border-t border-[#1f1f1f] overflow-x-auto">
          <span className="text-[10px] font-black tracking-widest text-[#525252] shrink-0">
            AUDIO
          </span>
          {audioTracks.map((t) => (
            <button
              key={t.id}
              onClick={() => switchAudio(t.id)}
              className={`px-3 py-1.5 text-[11px] font-semibold shrink-0 border transition-colors ${
                t.id === currentAudio
                  ? 'bg-[#FFE600] text-black border-[#FFE600]'
                  : 'bg-[#141414] text-[#A3A3A3] hover:text-white border-[#1f1f1f]'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-center p-6 text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
