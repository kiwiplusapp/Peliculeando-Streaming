'use client';

import { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { Zap, ChevronUp, Trophy } from 'lucide-react';
import { ACHIEVEMENTS, getLevelForXP, LEVELS, RARITY_COLORS } from '@/lib/xp';

// ─── Context ──────────────────────────────────────────────────────────────────

interface XPEvent {
  id: string;
  type: 'xp' | 'levelup' | 'achievement';
  xpGained?: number;
  levelName?: string;
  levelColor?: string;
  achievementTitle?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

interface XPNotifCtx {
  showXP: (xpGained: number, totalXP: number, unlockedIds: string[]) => void;
}

const Ctx = createContext<XPNotifCtx>({ showXP: () => {} });

export function useXPNotification() {
  return useContext(Ctx);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function XPNotificationProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<XPEvent[]>([]);

  const showXP = useCallback((xpGained: number, totalXP: number, unlockedIds: string[]) => {
    const id = `${Date.now()}-${Math.random()}`;
    const newEvents: XPEvent[] = [];

    // XP gain notification
    newEvents.push({ id: id + '-xp', type: 'xp', xpGained });

    // Level up check
    const oldXP = totalXP - xpGained;
    const oldLevel = getLevelForXP(oldXP);
    const newLevel = getLevelForXP(totalXP);
    if (newLevel.index > oldLevel.index) {
      newEvents.push({
        id: id + '-lvl',
        type: 'levelup',
        levelName: newLevel.name,
        levelColor: newLevel.color,
      });
    }

    // Achievement unlocks
    unlockedIds.forEach((achId, i) => {
      const ach = ACHIEVEMENTS.find(a => a.id === achId);
      if (!ach) return;
      newEvents.push({
        id: id + '-ach-' + i,
        type: 'achievement',
        achievementTitle: ach.title,
        rarity: ach.rarity,
        xpGained: ach.xpReward,
      });
    });

    setEvents(prev => [...prev, ...newEvents]);
    // Auto-dismiss
    setTimeout(() => {
      setEvents(prev => prev.filter(e => !newEvents.some(n => n.id === e.id)));
    }, 3500);
  }, []);

  return (
    <Ctx.Provider value={{ showXP }}>
      {children}
      {/* Toast stack — bottom-right */}
      <div className="fixed bottom-6 right-4 z-[300] flex flex-col gap-2 items-end pointer-events-none">
        {events.map(ev => (
          <XPToast key={ev.id} event={ev} />
        ))}
      </div>
    </Ctx.Provider>
  );
}

// ─── Single Toast ──────────────────────────────────────────────────────────────

function XPToast({ event }: { event: XPEvent }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  if (event.type === 'xp') {
    return (
      <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-amber-500/20 bg-[#111] shadow-lg shadow-black/40 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Zap size={14} className="text-amber-400" />
        </div>
        <span className="text-sm font-bold text-amber-400">+{event.xpGained} XP</span>
      </div>
    );
  }

  if (event.type === 'levelup') {
    return (
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg shadow-black/40 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        style={{ borderColor: `${event.levelColor}40`, background: `${event.levelColor}0e` }}>
        <ChevronUp size={18} style={{ color: event.levelColor }} />
        <div>
          <p className="text-xs text-[#737373]">¡Subiste de nivel!</p>
          <p className="text-sm font-bold" style={{ color: event.levelColor }}>{event.levelName}</p>
        </div>
      </div>
    );
  }

  if (event.type === 'achievement') {
    const rarity = RARITY_COLORS[event.rarity ?? 'common'];
    return (
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg shadow-black/40 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        style={{ borderColor: rarity.border, background: rarity.bg }}>
        <Trophy size={16} style={{ color: rarity.text }} />
        <div>
          <p className="text-xs text-[#737373]">Logro desbloqueado</p>
          <p className="text-sm font-bold" style={{ color: rarity.text }}>{event.achievementTitle}</p>
        </div>
      </div>
    );
  }

  return null;
}
