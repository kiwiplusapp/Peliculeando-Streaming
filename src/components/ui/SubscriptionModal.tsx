'use client';

import { useState, useEffect } from 'react';
import { X, Zap, Check, Star, Shield } from 'lucide-react';
import { toast } from '@/components/ui/Toaster';
import { useAuth } from '@/components/layout/AuthProvider';

const PERKS = [
  'Sin anuncios en ninguna página',
  'Acceso prioritario a nuevas funciones',
  'Badge de colaborador en tu perfil',
  'Soporte directo al equipo',
];

export function SubscriptionModal() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    document.addEventListener('open-subscription', handler);
    return () => document.removeEventListener('open-subscription', handler);
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch('/api/subscription')
      .then(r => r.json())
      .then(d => setSubscribed(d.active))
      .catch(() => {});
  }, [user]);

  const handleSubscribe = async (months: number) => {
    if (!user) {
      toast('Inicia sesión primero', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ months }),
      });
      if (res.ok) {
        setSubscribed(true);
        toast('¡Bienvenido a Premium! Los anuncios se eliminarán al recargar.');
        setTimeout(() => setOpen(false), 1500);
      }
    } catch {
      toast('Error procesando la suscripción', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div className="bg-[#111111] border border-[#262626] rounded-2xl w-full max-w-md animate-fade-up overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 text-center border-b border-[#1A1A1A]">
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 text-[#525252] hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-3">
            <Zap size={22} className="text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Peliculeando Premium</h2>
          <p className="text-sm text-[#A3A3A3] mt-1">Apoya el proyecto y disfruta sin interrupciones</p>
        </div>

        {/* Perks */}
        <div className="px-6 py-4 space-y-2.5">
          {PERKS.map(perk => (
            <div key={perk} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                <Check size={11} className="text-amber-400" />
              </div>
              <span className="text-sm text-[#A3A3A3]">{perk}</span>
            </div>
          ))}
        </div>

        {/* Plans */}
        {subscribed ? (
          <div className="px-6 pb-6">
            <div className="flex items-center justify-center gap-2 py-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
              <Star size={16} className="text-amber-400" fill="#f59e0b" />
              <span className="text-amber-400 font-semibold text-sm">Ya eres Premium</span>
            </div>
          </div>
        ) : (
          <div className="px-6 pb-6 space-y-3">
            <button
              onClick={() => handleSubscribe(1)}
              disabled={loading}
              className="w-full flex items-center justify-between px-4 py-3.5 bg-[#181818] hover:bg-amber-500/10 border border-[#333333] hover:border-amber-500/50 rounded-xl transition-all group"
            >
              <div className="text-left">
                <p className="text-sm font-semibold text-white">1 mes</p>
                <p className="text-xs text-[#525252]">Renovación manual</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-amber-400">$2 USD</p>
              </div>
            </button>

            <button
              onClick={() => handleSubscribe(12)}
              disabled={loading}
              className="w-full flex items-center justify-between px-4 py-3.5 bg-amber-500/10 border border-amber-500/30 hover:border-amber-500 rounded-xl transition-all relative overflow-hidden"
            >
              <span className="absolute top-0 right-0 text-[10px] font-bold bg-amber-500 text-black px-2 py-0.5 rounded-bl-lg">
                AHORRA 30%
              </span>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">1 año</p>
                <p className="text-xs text-[#525252]">$1.40/mes</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-amber-400">$17 USD</p>
              </div>
            </button>

            <div className="flex items-center gap-2 justify-center pt-1">
              <Shield size={12} className="text-[#525252]" />
              <p className="text-xs text-[#525252]">
                Pago seguro · Cancela en cualquier momento
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
