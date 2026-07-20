'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Settings, Check,
  RotateCcw, RotateCw, Loader2,
} from 'lucide-react';

interface Caption {
  id: string;
  lang: string;
  label: string;
  url: string;
}

type MenuTab = 'main' | 'quality' | 'audio' | 'subs' | 'speed' | 'server';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function fmt(s: number): string {
  if (!isFinite(s) || s < 0) s = 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  return `${h > 0 ? h + ':' : ''}${mm}:${String(sec).padStart(2, '0')}`;
}

export function SelfHostedPlayer({
  src,
  captions = [],
  servers = 0,
  server = 0,
  onServer,
}: {
  src: string;
  captions?: Caption[];
  servers?: number;
  server?: number;
  onServer?: (i: number) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimer = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef(false);
  const controlsRef = useRef(true);
  const isMouseRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [fs, setFs] = useState(false);
  const [controls, setControls] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [levels, setLevels] = useState<{ i: number; label: string }[]>([]);
  const [curLevel, setCurLevel] = useState(-1); // -1 = auto
  const [audioTracks, setAudioTracks] = useState<{ i: number; label: string }[]>([]);
  const [curAudio, setCurAudio] = useState(-1);
  const [curSub, setCurSub] = useState(-1); // -1 = off
  const [speed, setSpeed] = useState(1);

  const [menu, setMenu] = useState(false);
  const [tab, setTab] = useState<MenuTab>('main');
  const [subText, setSubText] = useState('');

  useEffect(() => { menuRef.current = menu; }, [menu]);
  useEffect(() => {
    // Real pointer (mouse/trackpad) vs touch. iOS fakes mouse events on tap,
    // so pointerType can't be trusted — matchMedia can.
    isMouseRef.current =
      typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }, []);

  // ── Controls visibility (ref-driven to avoid stale closures) ─────────────────
  const setCtl = (v: boolean) => { controlsRef.current = v; setControls(v); };
  const scheduleHide = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused && !menuRef.current) setCtl(false);
    }, 3500);
  };
  const showControls = () => { setCtl(true); scheduleHide(); };
  // Single tap handler for the whole surface.
  const onTapSurface = () => {
    if (menuRef.current) { setMenu(false); showControls(); return; }
    if (controlsRef.current) setCtl(false);
    else showControls();
  };

  // ── HLS setup ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setError(null);
    setReady(false);

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setReady(true);
        setLevels(
          hls.levels.map((l, i) => ({
            i,
            label: l.height ? `${l.height}p` : `${Math.round((l.bitrate || 0) / 1000)}k`,
          })),
        );
        video.play().then(() => setPlaying(true)).catch(() => {});
      });
      hls.on(Hls.Events.LEVEL_SWITCHED, (_e, d) => setCurLevel(hls.autoLevelEnabled ? -1 : d.level));
      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, () => {
        setAudioTracks(hls.audioTracks.map((t, i) => ({ i, label: t.name || t.lang || `Audio ${i + 1}` })));
        setCurAudio(hls.audioTrack);
      });
      hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (_e, d) => setCurAudio(d.id));
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
          else setError(`Error: ${data.details}`);
        }
      });

      return () => { hls.destroy(); hlsRef.current = null; };
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src; // Safari native HLS
      setReady(true);
      video.play().then(() => setPlaying(true)).catch(() => {});
      return;
    }
    setError('Tu navegador no soporta HLS.');
  }, [src]);

  // ── Quality / audio / subtitle actions ──────────────────────────────────────
  const pickQuality = (i: number) => {
    if (hlsRef.current) hlsRef.current.currentLevel = i; // -1 = auto
    setCurLevel(i);
    setMenu(false);
  };
  const pickAudio = (i: number) => {
    if (hlsRef.current) hlsRef.current.audioTrack = i;
    setCurAudio(i);
    setMenu(false);
  };
  const pickSub = (i: number) => {
    setCurSub(i);
    setMenu(false);
  };
  const pickSpeed = (s: number) => {
    if (videoRef.current) videoRef.current.playbackRate = s;
    setSpeed(s);
    setMenu(false);
  };

  // ── Basic controls ───────────────────────────────────────────────────────────
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
  };
  const seek = (t: number) => { if (videoRef.current) videoRef.current.currentTime = t; };
  const skip = (d: number) => { if (videoRef.current) videoRef.current.currentTime += d; };
  const toggleMute = () => {
    const v = videoRef.current; if (!v) return;
    v.muted = !v.muted; setMuted(v.muted);
  };
  const changeVolume = (val: number) => {
    const v = videoRef.current; if (!v) return;
    v.volume = val; v.muted = val === 0; setVolume(val); setMuted(val === 0);
  };
  const toggleFs = () => {
    const el = wrapRef.current; if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.();
  };
  const openMenu = () => {
    setTab('main');
    setMenu((m) => !m);
    setCtl(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
  };

  // ── Video element events ─────────────────────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    const onTime = () => {
      setCur(v.currentTime);
      if (v.buffered.length) setBuffered(v.buffered.end(v.buffered.length - 1));
    };
    const onDur = () => setDur(v.duration);
    const onWait = () => setWaiting(true);
    const onPlaying = () => { setWaiting(false); setPlaying(true); showControls(); };
    const onPause = () => {
      setPlaying(false);
      setCtl(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('durationchange', onDur);
    v.addEventListener('waiting', onWait);
    v.addEventListener('playing', onPlaying);
    v.addEventListener('pause', onPause);
    const onFs = () => setFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('durationchange', onDur);
      v.removeEventListener('waiting', onWait);
      v.removeEventListener('playing', onPlaying);
      v.removeEventListener('pause', onPause);
      document.removeEventListener('fullscreenchange', onFs);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Custom subtitle rendering (native ::cue positions them off-screen) ───────
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const tracks = v.textTracks;
    let active: TextTrack | null = null;
    for (let i = 0; i < tracks.length; i++) {
      if (i === curSub) { tracks[i].mode = 'hidden'; active = tracks[i]; }
      else tracks[i].mode = 'disabled';
    }
    setSubText('');
    if (!active) return;

    const onCue = () => {
      const cues = active!.activeCues;
      if (!cues || cues.length === 0) { setSubText(''); return; }
      let txt = '';
      for (let i = 0; i < cues.length; i++) txt += (cues[i] as VTTCue).text + '\n';
      setSubText(txt.trim().replace(/<[^>]+>/g, ''));
    };
    active.addEventListener('cuechange', onCue);
    onCue();
    return () => active?.removeEventListener('cuechange', onCue);
  }, [curSub, captions]);

  return (
    <div
      ref={wrapRef}
      className="relative w-full h-full bg-black overflow-hidden select-none"
      onMouseMove={() => { if (isMouseRef.current) showControls(); }}
      onClick={onTapSurface}
      style={{ cursor: controls ? 'default' : 'none' }}
    >
      {/* pointerEvents:none so iOS doesn't swallow taps meant for the surface */}
      <video ref={videoRef} playsInline className="w-full h-full" style={{ pointerEvents: 'none' }}>
        {captions.map((c) => (
          <track key={c.id} kind="subtitles" srcLang={c.lang} label={c.label} src={c.url} />
        ))}
      </video>

      {/* Custom subtitle overlay */}
      {subText && (
        <div
          className="absolute left-0 right-0 flex justify-center px-4 pointer-events-none transition-all"
          style={{ bottom: controls ? 76 : 24 }}
        >
          <span
            className="bg-black/70 text-white text-center rounded px-2 py-0.5"
            style={{ whiteSpace: 'pre-line', fontSize: 'clamp(14px, 2.6vw, 24px)', lineHeight: 1.35, textShadow: '0 1px 3px #000' }}
          >
            {subText}
          </span>
        </div>
      )}

      {/* Buffering spinner */}
      {(waiting || !ready) && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 className="animate-spin text-[#FFE600]" size={44} />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-center p-6 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Center controls */}
      {controls && ready && !error && (
        <div className="absolute inset-0 flex items-center justify-center gap-8 pointer-events-none">
          <button onClick={(e) => { e.stopPropagation(); skip(-10); showControls(); }} className="pointer-events-auto text-white/90 hover:text-white">
            <RotateCcw size={30} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); togglePlay(); showControls(); }} className="pointer-events-auto text-white bg-black/40 rounded-full p-3 hover:bg-black/60">
            {playing ? <Pause size={30} /> : <Play size={30} />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); skip(10); showControls(); }} className="pointer-events-auto text-white/90 hover:text-white">
            <RotateCw size={30} />
          </button>
        </div>
      )}

      {/* Settings menu */}
      {menu && (
        <div
          className="absolute bottom-16 right-3 z-30 w-56 max-h-[60%] overflow-y-auto bg-[#0d0d0d]/95 border border-[#2a2a2a] rounded-lg text-sm text-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {tab === 'main' && (
            <ul className="py-1">
              <li><button className="w-full text-left px-4 py-2.5 hover:bg-white/5 flex justify-between" onClick={() => setTab('quality')}>
                Calidad <span className="text-[#FFE600]">{curLevel === -1 ? 'Auto' : levels.find(l => l.i === curLevel)?.label}</span>
              </button></li>
              {audioTracks.length > 1 && (
                <li><button className="w-full text-left px-4 py-2.5 hover:bg-white/5 flex justify-between" onClick={() => setTab('audio')}>
                  Audio <span className="text-[#FFE600]">{audioTracks.find(a => a.i === curAudio)?.label || '—'}</span>
                </button></li>
              )}
              <li><button className="w-full text-left px-4 py-2.5 hover:bg-white/5 flex justify-between" onClick={() => setTab('subs')}>
                Subtítulos <span className="text-[#FFE600]">{curSub === -1 ? 'Off' : captions[curSub]?.label}</span>
              </button></li>
              <li><button className="w-full text-left px-4 py-2.5 hover:bg-white/5 flex justify-between" onClick={() => setTab('speed')}>
                Velocidad <span className="text-[#FFE600]">{speed}x</span>
              </button></li>
              {servers > 1 && (
                <li><button className="w-full text-left px-4 py-2.5 hover:bg-white/5 flex justify-between" onClick={() => setTab('server')}>
                  Servidor <span className="text-[#FFE600]">{server + 1}</span>
                </button></li>
              )}
            </ul>
          )}

          {tab === 'quality' && (
            <MenuList title="Calidad" onBack={() => setTab('main')}>
              <Row active={curLevel === -1} label="Auto" onClick={() => pickQuality(-1)} />
              {levels.slice().reverse().map((l) => (
                <Row key={l.i} active={curLevel === l.i} label={l.label} onClick={() => pickQuality(l.i)} />
              ))}
            </MenuList>
          )}

          {tab === 'audio' && (
            <MenuList title="Audio" onBack={() => setTab('main')}>
              {audioTracks.map((a) => (
                <Row key={a.i} active={curAudio === a.i} label={a.label} onClick={() => pickAudio(a.i)} />
              ))}
            </MenuList>
          )}

          {tab === 'subs' && (
            <MenuList title="Subtítulos" onBack={() => setTab('main')}>
              <Row active={curSub === -1} label="Off" onClick={() => pickSub(-1)} />
              {captions.map((c, i) => (
                <Row key={c.id} active={curSub === i} label={c.label} onClick={() => pickSub(i)} />
              ))}
              {captions.length === 0 && <div className="px-4 py-2.5 text-[#737373] text-xs">Sin subtítulos disponibles</div>}
            </MenuList>
          )}

          {tab === 'speed' && (
            <MenuList title="Velocidad" onBack={() => setTab('main')}>
              {SPEEDS.map((s) => (
                <Row key={s} active={speed === s} label={`${s}x`} onClick={() => pickSpeed(s)} />
              ))}
            </MenuList>
          )}

          {tab === 'server' && (
            <MenuList title="Servidor" onBack={() => setTab('main')}>
              {Array.from({ length: servers }, (_, i) => (
                <Row
                  key={i}
                  active={server === i}
                  label={`Servidor ${i + 1}`}
                  onClick={() => { onServer?.(i); setMenu(false); }}
                />
              ))}
            </MenuList>
          )}
        </div>
      )}

      {/* Bottom control bar */}
      {controls && !error && (
        <div
          className="absolute bottom-0 left-0 right-0 z-20 px-3 pb-2 pt-8 bg-gradient-to-t from-black/90 to-transparent"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Seek bar */}
          <div className="relative h-1.5 mb-2 group">
            <div className="absolute inset-0 bg-white/20 rounded-full" />
            <div className="absolute inset-y-0 left-0 bg-white/30 rounded-full" style={{ width: `${dur ? (buffered / dur) * 100 : 0}%` }} />
            <div className="absolute inset-y-0 left-0 bg-[#FFE600] rounded-full" style={{ width: `${dur ? (cur / dur) * 100 : 0}%` }} />
            <input
              type="range" min={0} max={dur || 0} step="any" value={cur}
              onChange={(e) => { seek(Number(e.target.value)); showControls(); }}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-3 text-white">
            <button onClick={() => { togglePlay(); showControls(); }}>{playing ? <Pause size={20} /> : <Play size={20} />}</button>

            <div className="flex items-center gap-1 group">
              <button onClick={toggleMute}>{muted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}</button>
              <input
                type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
                onChange={(e) => changeVolume(Number(e.target.value))}
                className="w-0 group-hover:w-16 transition-all accent-[#FFE600] cursor-pointer"
              />
            </div>

            <span className="text-xs font-mono text-white/80">{fmt(cur)} / {fmt(dur)}</span>

            <div className="flex-1" />

            <button
              onClick={openMenu}
              className={menu ? 'text-[#FFE600]' : 'text-white hover:text-[#FFE600]'}
            >
              <Settings size={20} />
            </button>
            <button onClick={toggleFs}><Maximize size={20} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuList({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div className="py-1">
      <button onClick={onBack} className="w-full text-left px-4 py-2 text-[#737373] hover:text-white text-xs border-b border-[#2a2a2a] mb-1">
        ‹ {title}
      </button>
      {children}
    </div>
  );
}

function Row({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left px-4 py-2.5 hover:bg-white/5 flex items-center justify-between">
      <span className={active ? 'text-[#FFE600]' : ''}>{label}</span>
      {active && <Check size={15} className="text-[#FFE600]" />}
    </button>
  );
}
