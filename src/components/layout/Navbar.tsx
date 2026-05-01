'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { AuthModal } from './AuthModal';
import { LevelBadge } from '@/components/gamification/LevelBadge';
import { Search, X } from 'lucide-react';

function useUserXP(enabled: boolean) {
  const [xp, setXP] = useState(0);
  const [karma, setKarma] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    fetch('/api/xp').then(r => r.ok ? r.json() : null).then(d => { if (d?.xp) setXP(d.xp); }).catch(() => {});
    fetch('/api/leaderboard?me=1').then(r => r.ok ? r.json() : null).then(d => { if (d?.karma) setKarma(d.karma); }).catch(() => {});
  }, [enabled]);
  return { xp, karma };
}

const NAV_LINKS = [
  { href: '/',          label: 'DESCUBRIR' },
  { href: '/explorar',  label: 'EXPLORAR'  },
  { href: '/comunidad', label: 'RANKING'   },
  { href: '/mi-lista',  label: 'LISTAS'    },
  { href: '/mis-resenas', label: 'RESEÑAS' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [authOpen, setAuthOpen] = useState<'login' | 'register' | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { xp, karma } = useUserXP(!!user);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explorar?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const initial = user?.username?.[0]?.toUpperCase() || '?';

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled ? 'bg-[#0A0A0A]/98 border-b border-[#1f1f1f] backdrop-blur-sm' : 'bg-[#0A0A0A]'
      }`}>
        <div className="max-w-[1400px] mx-auto px-6 flex items-center h-14 gap-8">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-6 h-6 bg-[#FFE600] flex items-center justify-center">
              <span className="text-black font-black text-xs" style={{ fontFamily: 'Space Grotesk' }}>P</span>
            </div>
            <span className="font-black text-xs tracking-[0.18em] text-white uppercase hidden sm:block"
              style={{ fontFamily: 'Space Grotesk', letterSpacing: '0.18em' }}>
              Peliculeando
            </span>
            <span className="text-[10px] font-mono text-[#333] hidden sm:block">×2.4</span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-0 flex-1">
            {NAV_LINKS.map(link => {
              const active = link.href === '/'
                ? pathname === '/'
                : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3 py-4 text-[11px] font-semibold tracking-[0.1em] transition-colors ${
                    active ? 'text-[#FFE600]' : 'text-[#525252] hover:text-[#A3A3A3]'
                  }`}
                  style={{ fontFamily: 'Space Grotesk' }}
                >
                  {link.label}
                  {active && (
                    <span className="absolute bottom-0 left-3 right-3 h-px bg-[#FFE600]" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Search */}
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Escape' && setSearchOpen(false)}
                  placeholder="Buscar título, director, año..."
                  className="bg-transparent border-b border-[#333] focus:border-[#FFE600] px-0 py-1 text-xs text-white placeholder:text-[#333] w-52 focus:outline-none transition-colors"
                />
                <button type="button" onClick={() => setSearchOpen(false)} className="text-[#525252] hover:text-white">
                  <X size={14} />
                </button>
              </form>
            ) : (
              <button onClick={() => setSearchOpen(true)}
                className="text-[#525252] hover:text-white transition-colors p-1">
                <Search size={15} />
              </button>
            )}

            {user ? (
              <>
                {/* Karma badge */}
                {karma > 0 && (
                  <Link href="/comunidad"
                    className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 border border-[#FFE600]/30 bg-[#FFE600]/8 hover:bg-[#FFE600]/15 transition-colors">
                    <span className="text-[10px] font-black font-mono text-[#FFE600] tracking-wider">
                      KARMA {karma.toLocaleString()}
                    </span>
                  </Link>
                )}

                {/* Avatar + menu */}
                <div className="relative" ref={menuRef}>
                  <button onClick={() => setUserMenuOpen(v => !v)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="w-7 h-7 flex items-center justify-center text-black text-[11px] font-black"
                      style={{ background: '#FFE600' }}>
                      {initial}
                    </div>
                    <div className="hidden sm:flex flex-col items-start">
                      <span className="text-[11px] font-semibold text-white leading-none tracking-wide">{user.username}</span>
                      {xp > 0 && <LevelBadge xp={xp} size="sm" showName />}
                    </div>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-[#0f0f0f] border border-[#1f1f1f] py-1 shadow-2xl animate-fade-in z-50">
                      {[
                        { href: '/perfil',      label: 'MI PERFIL' },
                        { href: '/mi-lista',    label: 'MI LISTA' },
                        { href: '/mis-resenas', label: 'MIS RESEÑAS' },
                        { href: '/colecciones', label: 'COLECCIONES' },
                      ].map(item => (
                        <Link key={item.href} href={item.href} onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2.5 text-[10px] font-semibold tracking-widest text-[#737373] hover:text-white hover:bg-white/3 transition-colors"
                          style={{ fontFamily: 'Space Grotesk' }}>
                          {item.label}
                        </Link>
                      ))}
                      <div className="my-1 border-t border-[#1a1a1a]" />
                      <button onClick={() => { setUserMenuOpen(false); logout(); }}
                        className="w-full text-left px-4 py-2.5 text-[10px] font-semibold tracking-widest text-red-500 hover:bg-red-500/8 transition-colors"
                        style={{ fontFamily: 'Space Grotesk' }}>
                        CERRAR SESIÓN
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <button onClick={() => setAuthOpen('login')}
                  className="text-[11px] font-semibold tracking-widest text-[#525252] hover:text-white transition-colors"
                  style={{ fontFamily: 'Space Grotesk' }}>
                  ENTRAR
                </button>
                <button onClick={() => setAuthOpen('register')}
                  className="px-3 py-1.5 text-[11px] font-black tracking-widest text-black hover:opacity-90 transition-opacity"
                  style={{ background: '#FFE600', fontFamily: 'Space Grotesk' }}>
                  REGISTRO
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {authOpen && <AuthModal initialTab={authOpen} onClose={() => setAuthOpen(null)} />}
    </>
  );
}
