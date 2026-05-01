// ─── XP Actions ───────────────────────────────────────────────────────────────

export const XP_ACTIONS = {
  watch_movie: 25,
  watch_episode: 10,
  write_review: 50,
  helpful_vote_received: 15,
  add_to_watchlist: 5,
  create_collection: 20,
} as const;

export type XPAction = keyof typeof XP_ACTIONS;

// ─── Levels ───────────────────────────────────────────────────────────────────

export interface Level {
  index: number;
  name: string;
  minXP: number;
  maxXP: number;
  color: string;    // accent color
  gradient: string; // gradient for bar/badge
}

export const LEVELS: Level[] = [
  { index: 0, name: 'Espectador',        minXP: 0,    maxXP: 150,   color: '#6b7280', gradient: 'from-gray-500 to-gray-400' },
  { index: 1, name: 'Cinéfilo',          minXP: 150,  maxXP: 400,   color: '#3b82f6', gradient: 'from-blue-500 to-cyan-400' },
  { index: 2, name: 'Crítico Amateur',   minXP: 400,  maxXP: 900,   color: '#8b5cf6', gradient: 'from-violet-500 to-purple-400' },
  { index: 3, name: 'Crítico',           minXP: 900,  maxXP: 2000,  color: '#f59e0b', gradient: 'from-amber-500 to-yellow-400' },
  { index: 4, name: 'Crítico Senior',    minXP: 2000, maxXP: 4000,  color: '#f97316', gradient: 'from-orange-500 to-amber-400' },
  { index: 5, name: 'Maestro del Cine',  minXP: 4000, maxXP: 8000,  color: '#ef4444', gradient: 'from-red-500 to-pink-400' },
  { index: 6, name: 'Leyenda',           minXP: 8000, maxXP: Infinity, color: '#ec4899', gradient: 'from-pink-500 via-purple-500 to-indigo-500' },
];

export function getLevelForXP(xp: number): Level {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getXPProgress(xp: number): { level: Level; pct: number; xpInLevel: number; xpNeeded: number } {
  const level = getLevelForXP(xp);
  if (level.index === LEVELS.length - 1) {
    return { level, pct: 100, xpInLevel: xp - level.minXP, xpNeeded: 0 };
  }
  const xpInLevel = xp - level.minXP;
  const range = level.maxXP - level.minXP;
  return {
    level,
    pct: Math.min(100, Math.round((xpInLevel / range) * 100)),
    xpInLevel,
    xpNeeded: range - xpInLevel,
  };
}

// ─── Achievements ──────────────────────────────────────────────────────────────

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;     // lucide icon name
  xpReward: number;
  category: 'watching' | 'reviewing' | 'social' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  check: (stats: AchievementStats) => boolean;
}

export interface AchievementStats {
  moviesWatched: number;
  tvWatched: number;
  reviewsWritten: number;
  helpfulVotesReceived: number;
  collectionsCreated: number;
  watchlistSize: number;
  movies90sWatched: number;
  movies80sWatched: number;
  moviesClassicWatched: number; // before 1970
  ratingsGiven10: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  // ── Watching ──
  {
    id: 'first_watch',
    title: 'Primera Proyección',
    description: 'Viste tu primera película',
    icon: 'Play',
    xpReward: 50,
    category: 'watching',
    rarity: 'common',
    check: s => s.moviesWatched >= 1,
  },
  {
    id: 'ten_movies',
    title: 'Maratonista',
    description: 'Viste 10 películas',
    icon: 'Film',
    xpReward: 100,
    category: 'watching',
    rarity: 'common',
    check: s => s.moviesWatched >= 10,
  },
  {
    id: 'fifty_movies',
    title: 'Cinéfilo Dedicado',
    description: 'Viste 50 películas',
    icon: 'Clapperboard',
    xpReward: 250,
    category: 'watching',
    rarity: 'rare',
    check: s => s.moviesWatched >= 50,
  },
  {
    id: 'hundred_movies',
    title: 'Centurión',
    description: 'Viste 100 películas',
    icon: 'Award',
    xpReward: 500,
    category: 'watching',
    rarity: 'epic',
    check: s => s.moviesWatched >= 100,
  },
  {
    id: 'first_series',
    title: 'Seriéfilo',
    description: 'Empezaste a ver tu primera serie',
    icon: 'Tv',
    xpReward: 50,
    category: 'watching',
    rarity: 'common',
    check: s => s.tvWatched >= 1,
  },
  {
    id: 'ten_series',
    title: 'Maratonista de Series',
    description: 'Empezaste 10 series distintas',
    icon: 'Tv2',
    xpReward: 150,
    category: 'watching',
    rarity: 'rare',
    check: s => s.tvWatched >= 10,
  },
  {
    id: 'nostalgia_90s',
    title: 'Nostálgico de los 90',
    description: 'Viste 20 películas de los años 90',
    icon: 'Clock',
    xpReward: 200,
    category: 'watching',
    rarity: 'rare',
    check: s => s.movies90sWatched >= 20,
  },
  {
    id: 'child_80s',
    title: 'Hijo de los 80',
    description: 'Viste 20 películas de los años 80',
    icon: 'Radio',
    xpReward: 200,
    category: 'watching',
    rarity: 'rare',
    check: s => s.movies80sWatched >= 20,
  },
  {
    id: 'classic_lover',
    title: 'Amante del Clásico',
    description: 'Viste 10 películas anteriores a 1970',
    icon: 'Projector',
    xpReward: 300,
    category: 'watching',
    rarity: 'epic',
    check: s => s.moviesClassicWatched >= 10,
  },
  // ── Reviewing ──
  {
    id: 'first_review',
    title: 'Primera Crítica',
    description: 'Escribiste tu primera reseña',
    icon: 'PenLine',
    xpReward: 75,
    category: 'reviewing',
    rarity: 'common',
    check: s => s.reviewsWritten >= 1,
  },
  {
    id: 'ten_reviews',
    title: 'Crítico en Formación',
    description: 'Escribiste 10 reseñas',
    icon: 'BookOpen',
    xpReward: 150,
    category: 'reviewing',
    rarity: 'common',
    check: s => s.reviewsWritten >= 10,
  },
  {
    id: 'fifty_reviews',
    title: 'Pluma de Oro',
    description: 'Escribiste 50 reseñas',
    icon: 'Feather',
    xpReward: 400,
    category: 'reviewing',
    rarity: 'rare',
    check: s => s.reviewsWritten >= 50,
  },
  {
    id: 'helpful_critic',
    title: 'Crítico Útil',
    description: 'Recibiste 10 votos útiles en tus reseñas',
    icon: 'ThumbsUp',
    xpReward: 100,
    category: 'reviewing',
    rarity: 'common',
    check: s => s.helpfulVotesReceived >= 10,
  },
  {
    id: 'elite_critic',
    title: 'Crítico de Élite',
    description: 'Recibiste 50 votos útiles en tus reseñas',
    icon: 'Star',
    xpReward: 400,
    category: 'reviewing',
    rarity: 'epic',
    check: s => s.helpfulVotesReceived >= 50,
  },
  {
    id: 'harsh_critic',
    title: 'Sin Piedad',
    description: 'Diste 10 reseñas con puntuación 1-3',
    icon: 'Skull',
    xpReward: 75,
    category: 'reviewing',
    rarity: 'common',
    check: s => s.ratingsGiven10 >= 10, // reuse field for now
  },
  // ── Social ──
  {
    id: 'collector',
    title: 'Coleccionista',
    description: 'Creaste 5 colecciones',
    icon: 'FolderHeart',
    xpReward: 100,
    category: 'social',
    rarity: 'common',
    check: s => s.collectionsCreated >= 5,
  },
  {
    id: 'big_watchlist',
    title: 'Pendiente Infinita',
    description: 'Tienes 50 títulos en tu lista',
    icon: 'ListVideo',
    xpReward: 75,
    category: 'social',
    rarity: 'common',
    check: s => s.watchlistSize >= 50,
  },
  // ── Special ──
  {
    id: 'legend_xp',
    title: 'Leyenda',
    description: 'Alcanzaste el nivel máximo: Leyenda',
    icon: 'Crown',
    xpReward: 1000,
    category: 'special',
    rarity: 'legendary',
    check: s => s.moviesWatched >= 100 && s.reviewsWritten >= 50 && s.helpfulVotesReceived >= 50,
  },
];

export const RARITY_COLORS: Record<Achievement['rarity'], { text: string; bg: string; border: string; label: string }> = {
  common:    { text: '#A3A3A3', bg: 'rgba(163,163,163,0.08)', border: 'rgba(163,163,163,0.2)',  label: 'Común' },
  rare:      { text: '#3b82f6', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.25)',  label: 'Raro' },
  epic:      { text: '#a855f7', bg: 'rgba(168,85,247,0.08)',  border: 'rgba(168,85,247,0.25)',  label: 'Épico' },
  legendary: { text: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.3)',   label: 'Legendario' },
};
