'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { AuthModal } from './AuthModal';
import {
  Search, BookOpen, ListVideo, User, LogOut,
  ChevronDown, Zap, Film, Tv, Compass, Clapperboard,
} from 'lucide-react';

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
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explorar?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { href: '/',         label: 'Inicio',    icon: Clapperboard },
    { href: '/peliculas',label: 'Películas', icon: Film },
    { href: '/series',   label: 'Series',    icon: Tv },
    { href: '/explorar', label: 'Explorar',  icon: Compass },
    { href: '/que-ver',  label: '¿Qué ver?', icon: Zap },
  ];

  const initial = user?.username?.[0]?.toUpperCase() || '?';

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#0A0A0A]/95 border-b border-[#262626] backdrop-blur-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 flex items-center h-16 gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-black font-black text-sm">
              P
            </div>
            <span className="font-black tracking-widest text-sm text-white uppercase hidden sm:block">
              Peliculeando
            </span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-0.5 flex-1">
            {navLinks.map(link => {
              const Icon = link.icon;
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? 'text-amber-400 bg-amber-500/10'
                      : 'text-[#A3A3A3] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={14} className={active ? 'text-amber-400' : ''} />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Premium CTA */}
            <button
              onClick={() => document.dispatchEvent(new CustomEvent('open-subscription'))}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-400 border border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/5 rounded-lg transition-all"
            >
              <Zap size={12} />
              Premium
            </button>

            {/* Search */}
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center">
                <input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onBlur={() => !searchQuery && setSearchOpen(false)}
                  onKeyDown={e => e.key === 'Escape' && setSearchOpen(false)}
                  placeholder="Buscar..."
                  className="bg-[#181818] border border-[#333333] rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-[#525252] w-48 focus:outline-none focus:border-amber-500"
                />
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-[#A3A3A3] hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <Search size={18} />
              </button>
            )}

            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(v => !v)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-black text-xs font-black">
                    {initial}
                  </div>
                  <span className="text-sm text-white font-medium hidden sm:block">{user.username}</span>
                  <ChevronDown size={14} className="text-[#525252]" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-[#131313] border border-[#262626] rounded-xl py-1 shadow-2xl shadow-black/70 animate-fade-in">
                    <Link href="/perfil" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#A3A3A3] hover:text-white hover:bg-white/5 transition-colors">
                      <User size={15} /> Mi perfil
                    </Link>
                    <Link href="/mi-lista" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#A3A3A3] hover:text-white hover:bg-white/5 transition-colors">
                      <ListVideo size={15} /> Mi lista
                    </Link>
                    <Link href="/mis-resenas" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#A3A3A3] hover:text-white hover:bg-white/5 transition-colors">
                      <BookOpen size={15} /> Mis reseñas
                    </Link>
                    <Link href="/colecciones" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#A3A3A3] hover:text-white hover:bg-white/5 transition-colors">
                      <Film size={15} /> Colecciones
                    </Link>
                    <div className="my-1 border-t border-[#1A1A1A]" />
                    <button
                      onClick={() => { setUserMenuOpen(false); logout(); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut size={15} /> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAuthOpen('login')}
                  className="px-3 py-1.5 text-sm text-[#A3A3A3] hover:text-white transition-colors font-medium"
                >
                  Iniciar sesión
                </button>
                <button
                  onClick={() => setAuthOpen('register')}
                  className="px-3 py-1.5 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-black rounded-lg transition-colors"
                >
                  Registrarse
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {authOpen && (
        <AuthModal
          initialTab={authOpen}
          onClose={() => setAuthOpen(null)}
        />
      )}
    </>
  );
}
