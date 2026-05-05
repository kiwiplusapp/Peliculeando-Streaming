'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { ChevronRight, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';

const AVATAR_COLORS = [
  '#FFE600', '#FF6B35', '#FF3B5C', '#E040FB',
  '#7C4DFF', '#2979FF', '#00B0FF', '#00E5FF',
  '#00E676', '#FFEA00', '#FF6D00', '#FF1744',
];

const SECTIONS = [
  { id: 'cuenta',     label: 'CUENTA',        num: '01' },
  { id: 'perfil',     label: 'PERFIL PÚBLICO', num: '02' },
  { id: 'noticias',   label: 'NOTIFICACIONES', num: '03' },
  { id: 'privacidad', label: 'PRIVACIDAD',     num: '04' },
  { id: 'apariencia', label: 'APARIENCIA',     num: '05' },
];

const THEMES = [
  { id: 'dark',     label: 'OSCURO',     bg: '#0A0A0A', accent: '#FFE600' },
  { id: 'darker',   label: 'NEGRO PURO', bg: '#000000', accent: '#FFE600' },
  { id: 'midnight', label: 'MEDIANOCHE', bg: '#0A0A1A', accent: '#6366F1' },
];

interface UserSettings {
  id: number; username: string; email: string;
  avatar_color: string; bio: string; location: string;
  website: string; is_public: boolean; created_at: string;
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-10 h-5 relative transition-colors shrink-0 ${on ? 'bg-[#FFE600]' : 'bg-[#1f1f1f]'}`}
    >
      <div className={`absolute top-0.5 w-4 h-4 bg-black transition-all ${on ? 'left-[calc(100%-18px)]' : 'left-0.5'}`} />
    </button>
  );
}

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-3 border text-[11px] font-mono tracking-wide ${
      ok ? 'border-[#FFE600]/30 bg-[#FFE600]/5 text-[#FFE600]'
         : 'border-red-500/30 bg-red-500/5 text-red-400'
    }`}>
      {ok ? <Check size={12} /> : <AlertCircle size={12} />}
      {msg}
    </div>
  );
}

export function SettingsContent({ initialUser }: { initialUser: UserSettings | null }) {
  const { user: authUser } = useAuth();
  const [activeSection, setActiveSection] = useState('cuenta');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  /* ── Cuenta ── */
  const [curPwd, setCurPwd]   = useState('');
  const [newPwd, setNewPwd]   = useState('');
  const [confPwd, setConfPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  /* ── Perfil público ── */
  const originalUsername = initialUser?.username || '';
  const [username, setUsername]       = useState(originalUsername);
  const [bio, setBio]                 = useState(initialUser?.bio || '');
  const [location, setLocation]       = useState(initialUser?.location || '');
  const [website, setWebsite]         = useState(initialUser?.website || '');
  const [avatarColor, setAvatarColor] = useState(initialUser?.avatar_color || '#FFE600');

  /* ── Notificaciones (all states at component level — NO hooks in .map) ── */
  const [notifHelpful,     setNotifHelpful]     = useState(true);
  const [notifFollowers,   setNotifFollowers]   = useState(true);
  const [notifComments,    setNotifComments]    = useState(true);
  const [notifWatchlist,   setNotifWatchlist]   = useState(false);
  const [notifNewsletter,  setNotifNewsletter]  = useState(false);
  const [notifMarketing,   setNotifMarketing]   = useState(false);

  /* ── Privacidad (all states at component level) ── */
  const [isPublic,         setIsPublic]         = useState(initialUser?.is_public ?? true);
  const [showWatchlist,    setShowWatchlist]    = useState(true);
  const [showHistory,      setShowHistory]      = useState(false);
  const [showStats,        setShowStats]        = useState(true);
  const [indexSearch,      setIndexSearch]      = useState(false);

  /* ── Apariencia ── */
  const [activeTheme, setActiveTheme] = useState('dark');

  // Restore saved theme on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pel_theme');
      if (saved) setActiveTheme(saved);
    } catch {}
  }, []);

  /* ── Helpers ── */
  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const apiCall = async (body: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) showToast(data.error || 'Error', false);
      else         showToast(data.message || 'Guardado', true);
    } catch { showToast('Error de conexión', false); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (newPwd !== confPwd) { showToast('Las contraseñas no coinciden', false); return; }
    await apiCall({ action: 'change_password', currentPassword: curPwd, newPassword: newPwd });
    setCurPwd(''); setNewPwd(''); setConfPwd('');
  };

  const handleUpdateProfile = async () => {
    // Only send username if it actually changed — avoids re-triggering validation
    const payload: Record<string, unknown> = {
      action: 'update_profile',
      bio,
      avatar_color: avatarColor,
      location,
      website,
    };
    if (username !== originalUsername) payload.username = username;
    await apiCall(payload);
  };

  const handleUpdatePrivacy = async (val: boolean) => {
    setIsPublic(val);
    await apiCall({ action: 'update_privacy', is_public: val });
  };

  const joined = initialUser?.created_at
    ? new Date(initialUser.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })
    : '—';

  /* ══════════════ SECTIONS ══════════════ */

  const SectionHeader = ({ num, label, danger }: { num: string; label: string; danger?: boolean }) => (
    <div className="flex items-center gap-3 mb-5">
      <span className="text-[9px] font-mono text-[#333] tracking-[0.2em]">{num} ——</span>
      <span className={`text-[11px] font-black tracking-[0.15em] ${danger ? 'text-red-500/60' : 'text-[#525252]'}`}
        style={{ fontFamily: 'Space Grotesk' }}>
        {label}
      </span>
    </div>
  );

  /* ── 01 CUENTA ── */
  const renderCuenta = () => (
    <div className="space-y-8">
      <div>
        <SectionHeader num="01" label="DATOS DE LA CUENTA" />
        <div className="border border-[#1f1f1f] divide-y divide-[#1f1f1f]">
          {[
            { label: 'EMAIL',         value: authUser?.email || initialUser?.email || '—', note: 'Contacta soporte para cambiar el email' },
            { label: 'USUARIO',       value: authUser?.username || initialUser?.username || '—', note: 'Editable en Perfil Público' },
            { label: 'MIEMBRO DESDE', value: joined, note: null },
            { label: 'PLAN',          value: 'GRATUITO', note: null },
          ].map(row => (
            <div key={row.label} className="px-4 py-3">
              <p className="text-[9px] font-mono text-[#333] tracking-widest mb-0.5">{row.label}</p>
              <p className="text-[12px] font-semibold text-white">{row.value}</p>
              {row.note && <p className="text-[9px] font-mono text-[#333] mt-0.5">{row.note}</p>}
            </div>
          ))}
        </div>
      </div>

      <div>
        <SectionHeader num="02" label="CAMBIAR CONTRASEÑA" />
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-[9px] font-mono text-[#333] tracking-[0.2em] mb-1.5">CONTRASEÑA ACTUAL</label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} value={curPwd}
                onChange={e => setCurPwd(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#141414] border border-[#1f1f1f] focus:border-[#FFE600] px-3 py-2.5 text-[12px] font-mono text-white placeholder:text-[#333] focus:outline-none transition-colors pr-10" />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#333] hover:text-[#525252]">
                {showPwd ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>
          {[
            { label: 'NUEVA CONTRASEÑA', val: newPwd,   set: setNewPwd   },
            { label: 'CONFIRMAR',        val: confPwd,  set: setConfPwd  },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-[9px] font-mono text-[#333] tracking-[0.2em] mb-1.5">{f.label}</label>
              <input type="password" value={f.val} onChange={e => f.set(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#141414] border border-[#1f1f1f] focus:border-[#FFE600] px-3 py-2.5 text-[12px] font-mono text-white placeholder:text-[#333] focus:outline-none transition-colors" />
            </div>
          ))}
          <button onClick={handleChangePassword}
            disabled={saving || !curPwd || !newPwd || !confPwd}
            className="px-6 py-2.5 text-[11px] font-black tracking-widest text-black bg-[#FFE600] hover:opacity-90 transition-opacity disabled:opacity-30"
            style={{ fontFamily: 'Space Grotesk' }}>
            {saving ? '···' : 'ACTUALIZAR CONTRASEÑA'}
          </button>
        </div>
      </div>

      <div>
        <SectionHeader num="03" label="ZONA DE PELIGRO" danger />
        <div className="border border-red-500/20 p-4">
          <p className="text-[11px] font-semibold text-white mb-1">Eliminar cuenta</p>
          <p className="text-[10px] font-mono text-[#525252] mb-3">
            Acción irreversible. Todos tus datos, reseñas y listas serán eliminados.
          </p>
          <button
            onClick={() => alert('Para eliminar tu cuenta contacta con soporte.')}
            className="px-4 py-2 text-[10px] font-black tracking-widest text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors"
            style={{ fontFamily: 'Space Grotesk' }}>
            SOLICITAR ELIMINACIÓN
          </button>
        </div>
      </div>
    </div>
  );

  /* ── 02 PERFIL PÚBLICO ── */
  const renderPerfil = () => (
    <div className="space-y-8">
      <div>
        <SectionHeader num="01" label="AVATAR" />
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 flex items-center justify-center font-black text-xl text-black shrink-0"
            style={{ background: avatarColor }}>
            {(username || authUser?.username || '?')[0].toUpperCase()}
          </div>
          <div>
            <p className="text-[11px] font-semibold text-white">{username || authUser?.username}</p>
            <p className="text-[9px] font-mono text-[#525252] tracking-wide">Vista previa</p>
          </div>
        </div>
        <p className="text-[9px] font-mono text-[#333] tracking-[0.2em] mb-3">COLOR</p>
        <div className="flex flex-wrap gap-2">
          {AVATAR_COLORS.map(c => (
            <button key={c} onClick={() => setAvatarColor(c)}
              className={`w-8 h-8 transition-transform hover:scale-110 ${avatarColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0A0A0A]' : ''}`}
              style={{ background: c }} />
          ))}
          <div className="relative w-8 h-8">
            <input type="color" value={avatarColor} onChange={e => setAvatarColor(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
            <div className="w-8 h-8 border border-dashed border-[#333] flex items-center justify-center text-[#333] text-xs hover:border-[#525252]">+</div>
          </div>
        </div>
      </div>

      <div>
        <SectionHeader num="02" label="INFORMACIÓN PÚBLICA" />
        <div className="space-y-4 max-w-md">
          {/* Username */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[9px] font-mono text-[#333] tracking-[0.2em]">NOMBRE DE USUARIO</label>
              <span className="text-[9px] font-mono text-[#333]">Solo letras, números y _</span>
            </div>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder={originalUsername}
              className="w-full bg-[#141414] border border-[#1f1f1f] focus:border-[#FFE600] px-3 py-2.5 text-[12px] font-mono text-white placeholder:text-[#333] focus:outline-none transition-colors" />
          </div>

          {/* Bio */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[9px] font-mono text-[#333] tracking-[0.2em]">BIO</label>
              <span className="text-[9px] font-mono text-[#333]">{bio.length}/200</span>
            </div>
            <textarea value={bio} onChange={e => { if (e.target.value.length <= 200) setBio(e.target.value); }}
              rows={3} placeholder="Escribe algo sobre ti..."
              className="w-full bg-[#141414] border border-[#1f1f1f] focus:border-[#FFE600] px-3 py-2.5 text-[12px] font-mono text-white placeholder:text-[#333] focus:outline-none transition-colors resize-none" />
          </div>

          {/* Location */}
          <div>
            <label className="block text-[9px] font-mono text-[#333] tracking-[0.2em] mb-1.5">CIUDAD / PAÍS</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)}
              placeholder="Madrid, España"
              className="w-full bg-[#141414] border border-[#1f1f1f] focus:border-[#FFE600] px-3 py-2.5 text-[12px] font-mono text-white placeholder:text-[#333] focus:outline-none transition-colors" />
          </div>

          {/* Website */}
          <div>
            <label className="block text-[9px] font-mono text-[#333] tracking-[0.2em] mb-1.5">SITIO WEB</label>
            <input type="text" value={website} onChange={e => setWebsite(e.target.value)}
              placeholder="https://tu-sitio.com"
              className="w-full bg-[#141414] border border-[#1f1f1f] focus:border-[#FFE600] px-3 py-2.5 text-[12px] font-mono text-white placeholder:text-[#333] focus:outline-none transition-colors" />
          </div>

          <button onClick={handleUpdateProfile} disabled={saving}
            className="px-6 py-2.5 text-[11px] font-black tracking-widest text-black bg-[#FFE600] hover:opacity-90 transition-opacity disabled:opacity-30"
            style={{ fontFamily: 'Space Grotesk' }}>
            {saving ? '···' : 'GUARDAR CAMBIOS'}
          </button>
        </div>
      </div>
    </div>
  );

  /* ── 03 NOTIFICACIONES ── */
  const NOTIF_ROWS = [
    { label: 'RESEÑAS ÚTILES',      sub: 'Cuando alguien vota tu reseña como útil', on: notifHelpful,    set: setNotifHelpful    },
    { label: 'NUEVOS SEGUIDORES',   sub: 'Cuando alguien empieza a seguirte',       on: notifFollowers,  set: setNotifFollowers  },
    { label: 'COMENTARIOS',         sub: 'En tus reseñas y listas',                 on: notifComments,   set: setNotifComments   },
    { label: 'NOVEDADES DE LISTAS', sub: 'Cuando alguien añade algo a tu lista',    on: notifWatchlist,  set: setNotifWatchlist  },
    { label: 'NEWSLETTER',          sub: 'Curación editorial semanal',              on: notifNewsletter, set: setNotifNewsletter },
    { label: 'EMAIL MARKETING',     sub: 'Promociones y novedades',                 on: notifMarketing,  set: setNotifMarketing  },
  ];

  const renderNotificaciones = () => (
    <div className="space-y-3 max-w-lg">
      <SectionHeader num="01" label="PREFERENCIAS DE NOTIFICACIÓN" />
      {NOTIF_ROWS.map(row => (
        <div key={row.label}
          className="flex items-center justify-between px-4 py-3 border border-[#1f1f1f] hover:border-[#2a2a2a] transition-colors">
          <div className="flex-1 min-w-0 mr-4">
            <p className="text-[11px] font-semibold text-white">{row.label}</p>
            <p className="text-[9px] font-mono text-[#525252] mt-0.5">{row.sub}</p>
          </div>
          <Toggle on={row.on} onToggle={() => row.set(v => !v)} />
        </div>
      ))}
      <p className="text-[9px] font-mono text-[#333] tracking-wide pt-1">
        Las notificaciones en plataforma se gestionan desde el icono en la barra superior.
      </p>
    </div>
  );

  /* ── 04 PRIVACIDAD ── */
  const PRIVACY_ROWS = [
    { label: 'MOSTRAR WATCHLIST',    sub: 'Otros pueden ver tu lista',              on: showWatchlist, set: setShowWatchlist },
    { label: 'MOSTRAR HISTORIAL',    sub: 'Otros pueden ver qué has visto',         on: showHistory,   set: setShowHistory   },
    { label: 'MOSTRAR ESTADÍSTICAS', sub: 'Karma, XP y logros visibles al público', on: showStats,     set: setShowStats     },
    { label: 'INDEXAR BUSCADORES',   sub: 'Aparecer en Google y otros motores',     on: indexSearch,   set: setIndexSearch   },
  ];

  const renderPrivacidad = () => (
    <div className="space-y-3 max-w-lg">
      <SectionHeader num="01" label="VISIBILIDAD DEL PERFIL" />

      {/* Main public/private toggle */}
      <div className="border border-[#1f1f1f] p-4 mb-2">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-[12px] font-semibold text-white">Perfil público</p>
            <p className="text-[9px] font-mono text-[#525252] mt-0.5">
              {isPublic ? 'Cualquiera puede ver tu perfil y reseñas' : 'Solo tus seguidores pueden verte'}
            </p>
          </div>
          <Toggle on={isPublic} onToggle={() => handleUpdatePrivacy(!isPublic)} />
        </div>
        <p className="text-[9px] font-mono text-[#333]">
          Apareces en El Olimpo cuando tu perfil es público.
        </p>
      </div>

      {PRIVACY_ROWS.map(row => (
        <div key={row.label}
          className="flex items-center justify-between px-4 py-3 border border-[#1f1f1f] hover:border-[#2a2a2a] transition-colors">
          <div className="flex-1 min-w-0 mr-4">
            <p className="text-[11px] font-semibold text-white">{row.label}</p>
            <p className="text-[9px] font-mono text-[#525252] mt-0.5">{row.sub}</p>
          </div>
          <Toggle on={row.on} onToggle={() => row.set(v => !v)} />
        </div>
      ))}
    </div>
  );

  const applyTheme = (id: string) => {
    setActiveTheme(id);
    try { localStorage.setItem('pel_theme', id); } catch {}
    if (id === 'dark') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', id);
  };

  /* ── 05 APARIENCIA ── */
  const renderApariencia = () => (
    <div className="space-y-8 max-w-lg">
      <div>
        <SectionHeader num="01" label="TEMA" />
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map(t => {
            const isActive = activeTheme === t.id;
            return (
              <button key={t.id} onClick={() => applyTheme(t.id)}
                className={`p-3 border transition-colors ${isActive ? 'border-[#FFE600]' : 'border-[#1f1f1f] hover:border-[#333]'}`}
                style={{ background: t.bg }}>
                <div className="w-full h-8 mb-2 relative overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${t.bg} 0%, ${t.accent}20 100%)` }}>
                  <div className="absolute top-2 left-2 w-6 h-1" style={{ background: t.accent }} />
                  <div className="absolute bottom-2 left-2 w-10 h-px" style={{ background: `${t.accent}40` }} />
                </div>
                <p className="text-[9px] font-black font-mono tracking-widest text-left"
                  style={{ color: isActive ? t.accent : '#525252' }}>
                  {t.label}
                </p>
                {isActive && <p className="text-[8px] font-mono text-[#333] mt-0.5">ACTUAL</p>}
              </button>
            );
          })}
        </div>
        <p className="text-[9px] font-mono text-[#333] mt-3">
          Más temas disponibles próximamente.
        </p>
      </div>

      <div>
        <SectionHeader num="02" label="TIPOGRAFÍA" />
        <div className="border border-[#1f1f1f] divide-y divide-[#1f1f1f]">
          <div className="px-4 py-3">
            <p className="text-sm font-black text-white" style={{ fontFamily: 'Space Grotesk' }}>Space Grotesk</p>
            <p className="text-[9px] font-mono text-[#333] tracking-widest mt-0.5">TITULARES Y ETIQUETAS</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm font-mono text-white">JetBrains Mono</p>
            <p className="text-[9px] font-mono text-[#333] tracking-widest mt-0.5">DATOS Y MÉTRICAS</p>
          </div>
        </div>
        <p className="text-[9px] font-mono text-[#333] mt-2">Sistema de tipografía fijo · no personalizable</p>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'cuenta':     return renderCuenta();
      case 'perfil':     return renderPerfil();
      case 'noticias':   return renderNotificaciones();
      case 'privacidad': return renderPrivacidad();
      case 'apariencia': return renderApariencia();
      default:           return null;
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 py-4 text-[9px] font-mono text-[#333] tracking-[0.2em]">
          <Link href="/perfil" className="hover:text-[#FFE600] transition-colors">← MI PERFIL</Link>
          <span>·</span>
          <span>SETTINGS / V2.4</span>
        </div>

        {/* Header */}
        <div className="mb-8 border-b border-[#1f1f1f] pb-6">
          <h1 className="text-5xl sm:text-6xl font-black text-white leading-[0.9] tracking-tight"
            style={{ fontFamily: 'Space Grotesk' }}>
            Ajustes<span className="text-[#FFE600]">.</span>
          </h1>
        </div>

        {/* Toast */}
        {toast && <div className="mb-6"><Toast msg={toast.msg} ok={toast.ok} /></div>}

        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Sidebar ── */}
          <aside className="lg:w-56 shrink-0">
            {/* Mobile horizontal tabs */}
            <div className="lg:hidden flex overflow-x-auto scrollbar-none border border-[#1f1f1f] mb-6">
              {SECTIONS.map(s => (
                <button key={s.id} onClick={() => setActiveSection(s.id)}
                  className={`px-3 py-2.5 text-[10px] font-black tracking-widest whitespace-nowrap border-b-2 -mb-px shrink-0 transition-colors ${
                    activeSection === s.id ? 'text-[#FFE600] border-[#FFE600]' : 'text-[#333] border-transparent hover:text-[#525252]'
                  }`}
                  style={{ fontFamily: 'Space Grotesk' }}>
                  {s.num}
                </button>
              ))}
            </div>

            {/* Desktop vertical nav */}
            <nav className="hidden lg:block border border-[#1f1f1f] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1f1f1f]">
                <p className="text-[9px] font-mono text-[#333] tracking-[0.2em]">NAVEGACIÓN</p>
              </div>
              {SECTIONS.map(s => (
                <button key={s.id} onClick={() => setActiveSection(s.id)}
                  className={`flex items-center justify-between w-full px-4 py-3 border-b border-[#1f1f1f] last:border-b-0 transition-colors group ${
                    activeSection === s.id
                      ? 'bg-[#FFE600]/8 text-[#FFE600]'
                      : 'text-[#525252] hover:text-white hover:bg-white/[0.02]'
                  }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-mono text-[#333]">{s.num}</span>
                    <span className="text-[10px] font-black tracking-widest" style={{ fontFamily: 'Space Grotesk' }}>
                      {s.label}
                    </span>
                  </div>
                  <ChevronRight size={10} className={activeSection === s.id ? 'text-[#FFE600]' : 'text-[#1f1f1f] group-hover:text-[#333]'} />
                </button>
              ))}
            </nav>
            <p className="hidden lg:block text-[8px] font-mono text-[#1f1f1f] mt-3 tracking-widest">
              PELICULEANDO V2.4
            </p>
          </aside>

          {/* ── Content ── */}
          <main className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#1f1f1f]">
              <span className="text-[9px] font-mono text-[#333] tracking-[0.2em]">
                {SECTIONS.find(s => s.id === activeSection)?.num}
              </span>
              <h2 className="text-lg font-black text-white tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
                {SECTIONS.find(s => s.id === activeSection)?.label}
              </h2>
            </div>
            {renderSection()}
          </main>
        </div>
      </div>
    </div>
  );
}
