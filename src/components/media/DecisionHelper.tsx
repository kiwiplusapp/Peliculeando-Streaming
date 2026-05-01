'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { imgUrl, MediaItem } from '@/lib/tmdb';
import {
  Star, RefreshCw, Zap, Clock, Timer,
  Smile, Heart, Ghost, Lightbulb, Coffee, Search, Sparkles,
  User, Users, Users2, Film, Tv, Layers,
} from 'lucide-react';

const TIEMPO_OPTIONS = [
  { value: 'poco',      label: '< 1h 40min',      icon: Zap,   desc: 'Tengo poco tiempo' },
  { value: 'medio',     label: '1h 40m – 2h 20m', icon: Clock, desc: 'Un par de horas' },
  { value: 'cualquiera',label: 'Sin límite',       icon: Timer, desc: 'Tengo todo el día' },
];

const MOOD_OPTIONS = [
  { value: 'alegre',     label: 'Alegre',     icon: Smile },
  { value: 'emocionante',label: 'Emoción',    icon: Zap },
  { value: 'romantico',  label: 'Romántico',  icon: Heart },
  { value: 'terror',     label: 'Terror',     icon: Ghost },
  { value: 'reflexivo',  label: 'Reflexivo',  icon: Lightbulb },
  { value: 'relajado',   label: 'Relajado',   icon: Coffee },
  { value: 'misterio',   label: 'Misterio',   icon: Search },
  { value: 'fantasia',   label: 'Fantasía',   icon: Sparkles },
];

const COMPANIA_OPTIONS = [
  { value: 'solo',    label: 'Solo/a',      icon: User },
  { value: 'pareja',  label: 'En pareja',   icon: Heart },
  { value: 'amigos',  label: 'Con amigos',  icon: Users },
  { value: 'familia', label: 'En familia',  icon: Users2 },
];

const TIPO_OPTIONS = [
  { value: 'movie', label: 'Película', icon: Film },
  { value: 'tv',    label: 'Serie',    icon: Tv },
  { value: 'any',   label: 'Lo que sea', icon: Layers },
];

export function DecisionHelper() {
  const [step, setStep] = useState<'form' | 'results'>('form');
  const [tiempo, setTiempo] = useState('');
  const [mood, setMood] = useState('');
  const [compania, setCompania] = useState('');
  const [tipo, setTipo] = useState('movie');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!mood) return;
    setLoading(true);
    try {
      const res = await fetch('/api/que-ver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiempo, mood, compania, tipo }),
      });
      const d = await res.json();
      setResults(d.results || []);
      setStep('results');
    } catch {} finally { setLoading(false); }
  };

  const reset = () => {
    setStep('form');
    setTiempo('');
    setMood('');
    setCompania('');
    setTipo('movie');
    setResults([]);
  };

  if (step === 'results') {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Perfecto para ti ahora mismo</h2>
          <button onClick={reset} className="flex items-center gap-2 text-sm text-[#A3A3A3] hover:text-white transition-colors">
            <RefreshCw size={14} /> Buscar de nuevo
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {results.map(item => {
            const poster = imgUrl(item.poster_path, 'w342');
            const score = item.vote_average || 0;
            const year = item.release_date?.slice(0, 4);
            const scoreColor = score >= 7 ? '#10b981' : score >= 5 ? '#f59e0b' : '#ef4444';

            return (
              <Link
                key={`${item.tmdb_id}-${item.media_type}`}
                href={`/${item.media_type}/${item.tmdb_id}`}
                className="group bg-[#111111] border border-[#262626] rounded-xl overflow-hidden hover:border-amber-500/40 transition-colors"
              >
                <div className="relative aspect-[2/3] overflow-hidden">
                  {poster ? (
                    <Image src={poster} alt={item.title} fill sizes="200px" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="absolute inset-0 bg-[#181818]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div
                    className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-bold"
                    style={{ background: `${scoreColor}20`, color: scoreColor, border: `1px solid ${scoreColor}40` }}
                  >
                    <Star size={10} fill={scoreColor} /> {score.toFixed(1)}
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-semibold text-white text-sm line-clamp-2">{item.title}</p>
                  <p className="text-xs text-[#525252] mt-0.5">{year}</p>
                  <p className="text-xs text-[#A3A3A3] mt-1 line-clamp-2">{item.overview}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  const canSubmit = !!mood;

  const activeClass = 'bg-amber-500/10 border-amber-500 text-amber-400';
  const inactiveClass = 'bg-[#111111] border-[#262626] text-[#A3A3A3] hover:border-[#333333] hover:text-white';

  return (
    <div className="space-y-8">
      {/* Tipo */}
      <div>
        <p className="text-sm font-semibold text-white mb-3">¿Qué tipo?</p>
        <div className="flex gap-2">
          {TIPO_OPTIONS.map(o => {
            const Icon = o.icon;
            return (
              <button
                key={o.value}
                onClick={() => setTipo(o.value)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg border transition-colors ${tipo === o.value ? activeClass : inactiveClass}`}
              >
                <Icon size={15} />
                {o.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tiempo */}
      <div>
        <p className="text-sm font-semibold text-white mb-3">¿Cuánto tiempo tienes?</p>
        <div className="grid grid-cols-3 gap-2">
          {TIEMPO_OPTIONS.map(o => {
            const Icon = o.icon;
            return (
              <button
                key={o.value}
                onClick={() => setTiempo(tiempo === o.value ? '' : o.value)}
                className={`p-4 rounded-xl border text-center transition-colors ${tiempo === o.value ? activeClass : inactiveClass}`}
              >
                <Icon size={22} className="mx-auto mb-2" />
                <div className="text-xs font-semibold">{o.label}</div>
                <div className="text-xs text-[#525252] mt-0.5">{o.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mood */}
      <div>
        <p className="text-sm font-semibold text-white mb-3">
          ¿Cómo te sientes? <span className="text-amber-500">*</span>
        </p>
        <div className="grid grid-cols-4 gap-2">
          {MOOD_OPTIONS.map(o => {
            const Icon = o.icon;
            return (
              <button
                key={o.value}
                onClick={() => setMood(mood === o.value ? '' : o.value)}
                className={`p-3 rounded-xl border text-center transition-colors ${mood === o.value ? activeClass : inactiveClass}`}
              >
                <Icon size={20} className="mx-auto mb-1.5" />
                <div className="text-xs font-medium">{o.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Compañía */}
      <div>
        <p className="text-sm font-semibold text-white mb-3">¿Con quién?</p>
        <div className="grid grid-cols-4 gap-2">
          {COMPANIA_OPTIONS.map(o => {
            const Icon = o.icon;
            return (
              <button
                key={o.value}
                onClick={() => setCompania(compania === o.value ? '' : o.value)}
                className={`p-3 rounded-xl border text-center transition-colors ${compania === o.value ? activeClass : inactiveClass}`}
              >
                <Icon size={20} className="mx-auto mb-1.5" />
                <div className="text-xs font-medium">{o.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!canSubmit || loading}
        className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl disabled:opacity-40 transition-colors text-sm flex items-center justify-center gap-2"
      >
        <Sparkles size={16} />
        {loading ? 'Buscando...' : 'Encontrar opciones'}
      </button>
    </div>
  );
}
