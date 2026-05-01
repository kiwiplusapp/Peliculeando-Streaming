'use client';

import { getLevelForXP, LEVELS } from '@/lib/xp';
import { Crown, Zap, Star, Film, BookOpen, Clapperboard, Award } from 'lucide-react';

const LEVEL_ICONS = [Film, Zap, BookOpen, Star, Clapperboard, Award, Crown];

interface LevelBadgeProps {
  xp: number;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export function LevelBadge({ xp, size = 'md', showName = true }: LevelBadgeProps) {
  const level = getLevelForXP(xp);
  const Icon = LEVEL_ICONS[level.index] ?? Crown;

  const sizes = {
    sm: { wrap: 'px-2 py-0.5 text-xs gap-1.5', icon: 10 },
    md: { wrap: 'px-2.5 py-1 text-xs gap-1.5', icon: 12 },
    lg: { wrap: 'px-3 py-1.5 text-sm gap-2', icon: 14 },
  }[size];

  const isLegend = level.index === LEVELS.length - 1;

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${sizes.wrap}`}
      style={{
        color: level.color,
        background: `${level.color}14`,
        borderColor: `${level.color}35`,
        boxShadow: isLegend ? `0 0 12px ${level.color}30` : undefined,
      }}
    >
      <Icon size={sizes.icon} />
      {showName && <span>{level.name}</span>}
    </span>
  );
}
