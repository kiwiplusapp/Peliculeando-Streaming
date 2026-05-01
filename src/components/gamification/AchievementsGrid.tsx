'use client';

import { useEffect, useState } from 'react';
import {
  Play, Film, Clapperboard, Award, Tv, Tv2, Clock, Radio,
  PenLine, BookOpen, ThumbsUp, Star, Skull, FolderHeart,
  ListVideo, Crown, Projector, Feather, Lock,
} from 'lucide-react';
import { ACHIEVEMENTS, RARITY_COLORS } from '@/lib/xp';

const ICON_MAP: Record<string, React.ElementType> = {
  Play, Film, Clapperboard, Award, Tv, Tv2, Clock, Radio,
  PenLine, BookOpen, ThumbsUp, Star, Skull, FolderHeart,
  ListVideo, Crown, Projector, Feather,
};

interface AchievementData {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  unlockedAt: string | null;
}

type FilterCategory = 'all' | 'watching' | 'reviewing' | 'social' | 'special';

export function AchievementsGrid() {
  const [data, setData] = useState<AchievementData[]>([]);
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/achievements')
      .then(r => r.ok ? r.json() : [])
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  const categories: { key: FilterCategory; label: string }[] = [
    { key: 'all',       label: 'Todos' },
    { key: 'watching',  label: 'Ver' },
    { key: 'reviewing', label: 'Reseñas' },
    { key: 'social',    label: 'Social' },
    { key: 'special',   label: 'Especial' },
  ];

  const filtered = filter === 'all' ? data : data.filter(a => a.category === filter);
  const unlockedCount = data.filter(a => a.unlocked).length;

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="skeleton h-[100px] rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white text-sm">Logros</h3>
          <p className="text-xs text-[#525252] mt-0.5">
            {unlockedCount} / {ACHIEVEMENTS.length} desbloqueados
          </p>
        </div>
        {/* Progress ring */}
        <svg width="44" height="44" viewBox="0 0 44 44" className="shrink-0">
          <circle cx="22" cy="22" r="18" fill="none" stroke="#1f1f1f" strokeWidth="4" />
          <circle
            cx="22" cy="22" r="18"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${(unlockedCount / ACHIEVEMENTS.length) * 113} 113`}
            transform="rotate(-90 22 22)"
            className="transition-all duration-700"
          />
          <text x="22" y="26" textAnchor="middle" fontSize="10" fontWeight="700" fill="#f5f5f5">
            {Math.round((unlockedCount / ACHIEVEMENTS.length) * 100)}%
          </text>
        </svg>
      </div>

      {/* Category filter pills */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(c => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            className={`tag-pill ${filter === c.key ? 'active' : ''}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {filtered.map(ach => {
          const Icon = ICON_MAP[ach.icon] ?? Award;
          const rarity = RARITY_COLORS[ach.rarity];
          const isUnlocked = ach.unlocked;

          return (
            <div
              key={ach.id}
              className="relative rounded-xl p-3.5 border transition-all duration-200"
              style={isUnlocked ? {
                background: rarity.bg,
                borderColor: rarity.border,
                boxShadow: ach.rarity === 'legendary'
                  ? `0 0 20px ${rarity.text}18`
                  : ach.rarity === 'epic'
                  ? `0 0 12px ${rarity.text}14`
                  : undefined,
              } : {
                background: '#0f0f0f',
                borderColor: '#1a1a1a',
              }}
            >
              {/* Rarity label */}
              <span
                className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider"
                style={{ color: isUnlocked ? rarity.text : '#333' }}
              >
                {rarity.label}
              </span>

              {/* Icon */}
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center mb-2.5"
                style={isUnlocked ? {
                  background: `${rarity.text}18`,
                  border: `1px solid ${rarity.text}30`,
                } : {
                  background: '#181818',
                  border: '1px solid #262626',
                }}
              >
                {isUnlocked
                  ? <Icon size={18} style={{ color: rarity.text }} />
                  : <Lock size={16} className="text-[#333]" />
                }
              </div>

              {/* Title */}
              <p className={`text-xs font-semibold leading-tight mb-1 ${isUnlocked ? 'text-white' : 'text-[#404040]'}`}>
                {ach.title}
              </p>

              {/* Description */}
              <p className={`text-[10px] leading-snug ${isUnlocked ? 'text-[#737373]' : 'text-[#2a2a2a]'}`}>
                {ach.description}
              </p>

              {/* XP reward */}
              {isUnlocked && (
                <div className="mt-2 flex items-center gap-1">
                  <span className="text-[10px] font-bold" style={{ color: rarity.text }}>
                    +{ach.xpReward} XP
                  </span>
                </div>
              )}

              {/* Unlocked date */}
              {isUnlocked && ach.unlockedAt && (
                <p className="text-[9px] text-[#404040] mt-0.5">
                  {new Date(ach.unlockedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
