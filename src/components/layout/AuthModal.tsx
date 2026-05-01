'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { X } from 'lucide-react';

interface AuthModalProps {
  initialTab: 'login' | 'register';
  onClose: () => void;
}

export function AuthModal({ initialTab, onClose }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const form = e.currentTarget;
    const data: Record<string, string> = {};
    new FormData(form).forEach((v, k) => { data[k] = v as string; });

    const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Error'); return; }
      setUser(json.user);
      onClose();
      window.location.reload();
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full bg-[#181818] border border-[#262626] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-[#525252] focus:outline-none focus:border-amber-500 transition-colors';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#111111] border border-[#262626] rounded-2xl w-full max-w-sm p-6 animate-fade-up shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1 bg-[#181818] p-1 rounded-lg">
            {(['login', 'register'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                  tab === t ? 'bg-amber-500 text-black' : 'text-[#A3A3A3] hover:text-white'
                }`}
              >
                {t === 'login' ? 'Iniciar sesión' : 'Registrarse'}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="text-[#525252] hover:text-white p-1 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-[#A3A3A3] mb-1.5 uppercase tracking-wide">Usuario</label>
              <input name="username" required placeholder="cinefilo123" className={inputClass} />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-[#A3A3A3] mb-1.5 uppercase tracking-wide">Email</label>
            <input name="email" type="email" required placeholder="tu@email.com" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#A3A3A3] mb-1.5 uppercase tracking-wide">Contraseña</label>
            <input name="password" type="password" required placeholder="••••••••" className={inputClass} />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Cargando...' : tab === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  );
}
