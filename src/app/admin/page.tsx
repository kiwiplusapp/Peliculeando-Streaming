'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Shield } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Error de autenticación');
      } else {
        router.push('/admin/dashboard');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 bg-[#FFE600] flex items-center justify-center">
            <Shield size={16} className="text-black" />
          </div>
          <div>
            <p className="text-[9px] font-black font-mono tracking-[0.3em] text-[#525252]">PELICULEANDO</p>
            <p className="text-[11px] font-black font-mono tracking-[0.2em] text-white">ADMIN PANEL</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[9px] font-black font-mono tracking-widest text-[#525252] mb-2">
              USUARIO
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-[#141414] border border-[#1f1f1f] px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-[#FFE600] transition-colors"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="block text-[9px] font-black font-mono tracking-widest text-[#525252] mb-2">
              CONTRASEÑA
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#141414] border border-[#1f1f1f] px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-[#FFE600] transition-colors pr-12"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#525252] hover:text-white transition-colors">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-[11px] font-mono text-red-400 border border-red-400/20 bg-red-400/5 px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FFE600] text-black text-[11px] font-black font-mono tracking-widest py-3 hover:opacity-90 transition-opacity disabled:opacity-50 mt-2">
            {loading ? 'VERIFICANDO...' : 'ACCEDER'}
          </button>
        </form>

        <p className="mt-6 text-[9px] font-mono text-[#333] text-center tracking-widest">
          ACCESO RESTRINGIDO — SOLO ADMINISTRADORES
        </p>
      </div>
    </div>
  );
}
