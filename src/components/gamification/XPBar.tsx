'use client';

import { useEffect, useRef, useState } from 'react';
import { getXPProgress, LEVELS } from '@/lib/xp';
import { LevelBadge } from './LevelBadge';
import { Zap } from 'lucide-react';

interface XPBarProps {
  xp: number;
  animated?: boolean;
}

export function XPBar({ xp, animated = true }: XPBarProps) {
  const { level, pct, xpInLevel, xpNeeded } = getXPProgress(xp);
  const isMax = level.index === LEVELS.length - 1;
  const nextLevel = !isMax ? LEVELS[level.index + 1] : null;

  const [displayPct, setDisplayPct] = useState(animated ? 0 : pct);
  const [displayXP, setDisplayXP] = useState(animated ? 0 : xp);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!animated) return;
    let start: number | null = null;
    const duration = 1200;
    const startXP = 0;
    const endXP = xp;
    const startPct = 0;
    const endPct = pct;

    const step = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const t = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplayPct(Math.round(startPct + (endPct - startPct) * ease));
      setDisplayXP(Math.round(startXP + (endXP - startXP) * ease));
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [xp, pct, animated]);

  return (
    <div className="space-y-3">
      {/* Level header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LevelBadge xp={xp} size="lg" />
          {nextLevel && (
            <span className="text-xs text-[#525252]">
              → {nextLevel.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-sm font-semibold"
          style={{ color: level.color }}>
          <Zap size={14} />
          <span>{displayXP.toLocaleString()} XP</span>
        </div>
      </div>

      {/* Bar */}
      <div className="relative h-2.5 bg-[#1a1a1a] rounded-full overflow-hidden border border-[#262626]">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${level.gradient} transition-none relative overflow-hidden`}
          style={{ width: `${displayPct}%` }}
        >
          {/* shimmer */}
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
        </div>
      </div>

      {/* Sub-label */}
      <div className="flex justify-between text-xs text-[#525252]">
        <span>{xpInLevel.toLocaleString()} XP en este nivel</span>
        {!isMax && <span>{xpNeeded.toLocaleString()} XP para subir</span>}
        {isMax && <span className="text-amber-400 font-medium">Nivel máximo alcanzado</span>}
      </div>
    </div>
  );
}
