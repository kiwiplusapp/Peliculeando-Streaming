'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { AuthModal } from './AuthModal';
import { Search, X, Menu } from 'lucide-react';

function useUserKarma(enabled: boolean) {
  const [karma, setKarma] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    fetch('/api/leaderboard?me=1').then(r => r.ok ? r.json() : null).then(d => { if (d?.karma) setKarma(d.karma); }).catch(() => {});
  }, [enabled]);
  return karma;
}

const NAV_LINKS = [
  { href: '/',            label: 'DESCUBRIR' },
  { href: '/explorar',    label: 'EXPLORAR'  },
  { href: '/comunidad',   label: 'RANKING'   },
  { href: '/mi-lista',    label: 'LISTAS'    },
  { href: '/mis-resenas', label: 'RESEÑAS'   },
  { href: '/perfil',      label: 'DIARIO'    },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [authOpen, setAuthOpen] = useState<'login' | 'register' | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const karma = useUserKarma(!!user);

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

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

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
        scrolled ? 'bg-[#0A0A0A]/98 border-b border-[#1f1f1f] backdrop-blur-sm' : 'bg-[#0A0A0A] border-b border-[#1f1f1f]'
      }`}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center h-14 gap-4 sm:gap-8">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-6 h-6 bg-[#FFE600] flex items-center justify-center">
              <span className="text-black font-black text-xs" style={{ fontFamily: 'Space Grotesk' }}>P</span>
            </div>
            <span className="font-black text-xs tracking-[0.18em] text-white uppercase hidden sm:block"
              style={{ fontFamily: 'Space Grotesk' }}>
              Peliculeando
            </span>
          </Link>

          {/* Nav links — desktop only */}
          <div className="hidden md:flex items-center gap-0 flex-1">
            {NAV_LINKS.map(link => {
              const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link key={link.href} href={link.href}
                  className={`relative px-3 py-4 text-[11px] font-semibold tracking-[0.1em] transition-colors ${
                    active ? 'text-[#FFE600]' : 'text-[#525252] hover:text-[#A3A3A3]'
                  }`}
                  style={{ fontFamily: 'Space Grotesk' }}>
                  {link.label}
                  {active && <span className="absolute bottom-0 left-3 right-3 h-px bg-[#FFE600]" />}
                </Link>
              );
            })}
          </div>

          {/* Spacer on mobile */}
          <div className="flex-1 md:hidden" />

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search */}
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Escape' && setSearchOpen(false)}
                  placeholder="Buscar..."
                  className="bg-transparent border-b border-[#333] focus:border-[#FFE600] px-0 py-1 text-xs text-white placeholder:text-[#333] w-36 sm:w-52 focus:outline-none transition-colors"
                />
                <button type="button" onClick={() => setSearchOpen(false)} className="text-[#525252] hover:text-white">
                  <X size={14} />
                </button>
              </form>
            ) : (
              <button onClick={() => setSearchOpen(true)} className="text-[#525252] hover:text-white transition-colors p-1">
                <Search size={15} />
              </button>
            )}

            {user ? (
              <>
                {/* Karma — desktop only */}
                {karma > 0 && (
                  <Link href="/comunidad"
                    className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 border border-[#FFE600]/30 bg-[#FFE600]/8 hover:bg-[#FFE600]/15 transition-colors">
                    <span className="text-[10px] font-black font-mono text-[#FFE600] tracking-wider">
                      {karma.toLocaleString()} K
                    </span>
                  </Link>
                )}

                {/* Avatar + dropdown */}
                <div className="relative hidden md:block" ref={menuRef}>
                  <button onClick={() => setUserMenuOpen(v => !v)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="w-7 h-7 flex items-center justify-center text-black text-[11px] font-black"
                      style={{ background: '#FFE600' }}>
                      {initial}
                    </div>
                    <span className="text-[11px] font-semibold text-white leading-none tracking-wide hidden lg:block">
                      {user.username}
                    </span>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-[#0f0f0f] border border-[#1f1f1f] py-1 shadow-2xl z-50">
                      {[
                        { href: '/perfil',      label: 'MI PERFIL' },
                        { href: '/mi-lista',    label: 'MI LISTA' },
                        { href: '/mis-resenas', label: 'MIS RESEÑAS' },
                        { href: '/colecciones', label: 'COLECCIONES' },
                        { href: '/ajustes',     label: 'AJUSTES' },
                      ].map(item => (
                        <Link key={item.href} href={item.href} onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2.5 text-[10px] font-semibold tracking-widest text-[#737373] hover:text-white hover:bg-white/[0.03] transition-colors"
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
              <div className="hidden md:flex items-center gap-3">
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

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(v => !v)}
              className="md:hidden text-[#525252] hover:text-white transition-colors p-1"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#1f1f1f] bg-[#0A0A0A]">
            <div className="px-4 py-2">
              {NAV_LINKS.map(link => {
                const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
                return (
                  <Link key={link.href} href={link.href}
                    className={`flex items-center justify-between py-3 text-[11px] font-semibold tracking-widest border-b border-[#111] transition-colors ${
                      active ? 'text-[#FFE600]' : 'text-[#525252] hover:text-white'
                    }`}
                    style={{ fontFamily: 'Space Grotesk' }}>
                    {link.label}
                    {active && <span className="w-1.5 h-1.5 bg-[#FFE600]" />}
                  </Link>
                );
              })}

              {/* Auth in mobile menu */}
              <div className="pt-3 pb-1">
                {user ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 py-2 border-b border-[#111]">
                      <div className="w-6 h-6 flex items-center justify-center text-black text-[10px] font-black"
                        style={{ background: '#FFE600' }}>
                        {initial}
                      </div>
                      <span className="text-[11px] font-semibold text-white">{user.username}</span>
                      {karma > 0 && (
                        <span className="ml-auto text-[10px] font-black font-mono text-[#FFE600]">
                          {karma.toLocaleString()} K
                        </span>
                      )}
                    </div>
                    <button onClick={() => { setMobileMenuOpen(false); logout(); }}
                      className="w-full text-left py-2.5 text-[10px] font-semibold tracking-widest text-red-500"
                      style={{ fontFamily: 'Space Grotesk' }}>
                      CERRAR SESIÓN
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3 pt-1">
                    <button onClick={() => { setMobileMenuOpen(false); setAuthOpen('login'); }}
                      className="flex-1 py-2.5 text-[11px] font-semibold tracking-widest text-[#525252] border border-[#2a2a2a] hover:text-white hover:border-[#525252] transition-colors"
                      style={{ fontFamily: 'Space Grotesk' }}>
                      ENTRAR
                    </button>
                    <button onClick={() => { setMobileMenuOpen(false); setAuthOpen('register'); }}
                      className="flex-1 py-2.5 text-[11px] font-black tracking-widest text-black hover:opacity-90 transition-opacity"
                      style={{ background: '#FFE600', fontFamily: 'Space Grotesk' }}>
                      REGISTRO
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {authOpen && <AuthModal initialTab={authOpen} onClose={() => setAuthOpen(null)} />}
    </>
  );
}
