'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { ChevronRight, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';

/* ── Colour palette options ── */
const AVATAR_COLORS = [
  '#FFE600', '#FF6B35', '#FF3B5C', '#E040FB',
  '#7C4DFF', '#2979FF', '#00B0FF', '#00E5FF',
  '#00E676', '#FFEA00', '#FF6D00', '#FF1744',
];

const SECTIONS = [
  { id: 'cuenta',    label: 'CUENTA',        num: '01' },
  { id: 'perfil',    label: 'PERFIL PÚBLICO', num: '02' },
  { id: 'noticias',  label: 'NOTIFICACIONES', num: '03' },
  { id: 'privacidad',label: 'PRIVACIDAD',     num: '04' },
  { id: 'apariencia',label: 'APARIENCIA',     num: '05' },
];

interface UserSettings {
  id: number; username: string; email: string;
  avatar_color: string; bio: string; location: string;
  website: string; is_public: boolean; created_at: string;
}

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-3 border text-[11px] font-mono tracking-wide ${
      ok
        ? 'border-[#FFE600]/30 bg-[#FFE600]/8 text-[#FFE600]'
        : 'border-red-500/30 bg-red-500/8 text-red-400'
    }`}>
      {ok ? <Check size={12} /> : <AlertCircle size={12} />}
      {msg}
    </div>
  );
}

export function SettingsContent({ initialUser }: { initialUser: UserSettings | null }) {
  const { user: authUser } = useAuth();
  const [activeSection, setActiveSection] = useState('cuenta');
  const [settings, setSettings] = useState<UserSettings | null>(initialUser);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  /* Cuenta fields */
  const [email, setEmail]     = useState(initialUser?.email || '');
  const [curPwd, setCurPwd]   = useState('');
  const [newPwd, setNewPwd]   = useState('');
  const [confPwd, setConfPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  /* Perfil público fields */
  const [username, setUsername]       = useState(initialUser?.username || '');
  const [bio, setBio]                 = useState(initialUser?.bio || '');
  const [location, setLocation]       = useState(initialUser?.location || '');
  const [website, setWebsite]         = useState(initialUser?.website || '');
  const [avatarColor, setAvatarColor] = useState(initialUser?.avatar_color || '#FFE600');

  /* Privacy */
  const [isPublic, setIsPublic] = useState(initialUser?.is_public ?? true);

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
    await apiCall({ action: 'update_profile', username, bio, avatar_color: avatarColor, location, website });
  };

  const handleUpdatePrivacy = async (val: boolean) => {
    setIsPublic(val);
    await apiCall({ action: 'update_privacy', is_public: val });
  };

  const joined = initialUser?.created_at
    ? new Date(initialUser.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })
    : '—';

  /* ── SECTION RENDERERS ── */
  const renderCuenta = () => (
    <div className="space-y-8">
      {/* Account info */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[9px] font-mono text-[#333] tracking-[0.2em]">01 ——</span>
          <span className="text-[11px] font-black text-[#525252] tracking-[0.15em]" style={{ fontFamily: 'Space Grotesk' }}>
            DATOS DE LA CUENTA
          </span>
        </div>
        <div className="border border-[#1f1f1f] divide-y divide-[#1f1f1f]">
          {[
            { label: 'EMAIL', value: authUser?.email || email, note: 'Para cambiar el email contacta soporte' },
            { label: 'USUARIO', value: authUser?.username || username, note: 'Editable en Perfil Público' },
            { label: 'MIEMBRO DESDE', value: joined, note: null },
            { label: 'PLAN', value: 'GRATUITO', note: null },
          ].map(row => (
            <div key={row.label} className="flex items-start justify-between px-4 py-3">
              <div>
                <p className="text-[9px] font-mono text-[#333] tracking-widest mb-0.5">{row.label}</p>
                <p className="text-[12px] font-semibold text-white">{row.value}</p>
                {row.note && <p className="text-[9px] font-mono text-[#333] mt-0.5">{row.note}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Change password */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[9px] font-mono text-[#333] tracking-[0.2em]">02 ——</span>
          <span className="text-[11px] font-black text-[#525252] tracking-[0.15em]" style={{ fontFamily: 'Space Grotesk' }}>
            CAMBIAR CONTRASEÑA
          </span>
        </div>
        <div className="space-y-4 max-w-md">
          {[
            { label: 'CONTRASEÑA ACTUAL', val: curPwd, set: setCurPwd },
            { label: 'NUEVA CONTRASEÑA',  val: newPwd, set: setNewPwd },
            { label: 'CONFIRMAR',         val: confPwd, set: setConfPwd },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-[9px] font-mono text-[#333] tracking-[0.2em] mb-1.5">{f.label}</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={f.val}
                  onChange={e => f.set(e.target.value)}
                  className="w-full bg-[#141414] border border-[#1f1f1f] focus:border-[#FFE600] px-3 py-2.5 text-[12px] font-mono text-white placeholder:text-[#333] focus:outline-none transition-colors pr-10"
                  placeholder="••••••••"
                />
                {f.label === 'CONTRASEÑA ACTUAL' && (
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#333] hover:text-[#525252]">
                    {showPwd ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                )}
              </div>
            </div>
          ))}
          <button onClick={handleChangePassword} disabled={saving || !curPwd || !newPwd || !confPwd}
            className="px-6 py-2.5 text-[11px] font-black tracking-widest text-black bg-[#FFE600] hover:opacity-90 transition-opacity disabled:opacity-30"
            style={{ fontFamily: 'Space Grotesk' }}>
            {saving ? '···' : 'ACTUALIZAR CONTRASEÑA'}
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[9px] font-mono text-[#333] tracking-[0.2em]">03 ——</span>
          <span className="text-[11px] font-black text-red-500/60 tracking-[0.15em]" style={{ fontFamily: 'Space Grotesk' }}>
            ZONA DE PELIGRO
          </span>
        </div>
        <div className="border border-red-500/20 p-4">
          <p className="text-[11px] font-semibold text-white mb-1">Eliminar cuenta</p>
          <p className="text-[10px] font-mono text-[#525252] mb-3">
            Esta acción es irreversible. Se eliminarán todas tus reseñas, listas y datos.
          </p>
          <button className="px-4 py-2 text-[10px] font-black tracking-widest text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors"
            onClick={() => alert('Contacta con soporte para eliminar tu cuenta.')}
            style={{ fontFamily: 'Space Grotesk' }}>
            SOLICITAR ELIMINACIÓN
          </button>
        </div>
      </div>
    </div>
  );

  const renderPerfil = () => (
    <div className="space-y-8">
      {/* Avatar color */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[9px] font-mono text-[#333] tracking-[0.2em]">01 ——</span>
          <span className="text-[11px] font-black text-[#525252] tracking-[0.15em]" style={{ fontFamily: 'Space Grotesk' }}>
            AVATAR
          </span>
        </div>
        {/* Preview */}
        <div className="flex items-center gap-4 mb-5">
          <div
            className="w-16 h-16 flex items-center justify-center font-black text-xl text-black"
            style={{ background: avatarColor }}>
            {(username || authUser?.username || '?')[0].toUpperCase()}
          </div>
          <div>
            <p className="text-[11px] font-semibold text-white">{username || authUser?.username}</p>
            <p className="text-[9px] font-mono text-[#525252] tracking-wide">Vista previa del avatar</p>
          </div>
        </div>
        {/* Color grid */}
        <p className="text-[9px] font-mono text-[#333] tracking-[0.2em] mb-2">COLOR DE AVATAR</p>
        <div className="flex flex-wrap gap-2">
          {AVATAR_COLORS.map(c => (
            <button key={c} onClick={() => setAvatarColor(c)}
              className={`w-8 h-8 transition-transform hover:scale-110 ${avatarColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0A0A0A]' : ''}`}
              style={{ background: c }} />
          ))}
          {/* Custom color */}
          <div className="relative w-8 h-8">
            <input type="color" value={avatarColor} onChange={e => setAvatarColor(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
            <div className="w-8 h-8 border border-dashed border-[#333] flex items-center justify-center text-[#333] text-xs hover:border-[#525252] transition-colors">
              +
            </div>
          </div>
        </div>
      </div>

      {/* Fields */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[9px] font-mono text-[#333] tracking-[0.2em]">02 ——</span>
          <span className="text-[11px] font-black text-[#525252] tracking-[0.15em]" style={{ fontFamily: 'Space Grotesk' }}>
            INFORMACIÓN PÚBLICA
          </span>
        </div>
        <div className="space-y-4 max-w-md">
          {[
            { label: 'NOMBRE DE USUARIO', val: username, set: setUsername, hint: 'Solo letras, números y _', placeholder: 'tu_usuario' },
            { label: 'BIO', val: bio, set: setBio, hint: `${bio.length}/200`, placeholder: 'Escribe algo sobre ti...' },
            { label: 'CIUDAD / PAÍS', val: location, set: setLocation, hint: '', placeholder: 'Madrid, España' },
            { label: 'SITIO WEB', val: website, set: setWebsite, hint: '', placeholder: 'https://tu-sitio.com' },
          ].map(f => (
            <div key={f.label}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[9px] font-mono text-[#333] tracking-[0.2em]">{f.label}</label>
                {f.hint && <span className="text-[9px] font-mono text-[#333]">{f.hint}</span>}
              </div>
              {f.label === 'BIO' ? (
                <textarea
                  value={f.val}
                  onChange={e => { if (e.target.value.length <= 200) f.set(e.target.value); }}
                  rows={3}
                  placeholder={f.placeholder}
                  className="w-full bg-[#141414] border border-[#1f1f1f] focus:border-[#FFE600] px-3 py-2.5 text-[12px] font-mono text-white placeholder:text-[#333] focus:outline-none transition-colors resize-none"
                />
              ) : (
                <input
                  type="text"
                  value={f.val}
                  onChange={e => f.set(e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full bg-[#141414] border border-[#1f1f1f] focus:border-[#FFE600] px-3 py-2.5 text-[12px] font-mono text-white placeholder:text-[#333] focus:outline-none transition-colors"
                />
              )}
            </div>
          ))}

          <button onClick={handleUpdateProfile} disabled={saving}
            className="px-6 py-2.5 text-[11px] font-black tracking-widest text-black bg-[#FFE600] hover:opacity-90 transition-opacity disabled:opacity-30"
            style={{ fontFamily: 'Space Grotesk' }}>
            {saving ? '···' : 'GUARDAR CAMBIOS'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderNotificaciones = () => (
    <div className="space-y-4 max-w-lg">
      <div className="flex items-center gap-3 mb-5">
        <span className="text-[9px] font-mono text-[#333] tracking-[0.2em]">01 ——</span>
        <span className="text-[11px] font-black text-[#525252] tracking-[0.15em]" style={{ fontFamily: 'Space Grotesk' }}>
          PREFERENCIAS DE NOTIFICACIÓN
        </span>
      </div>
      {[
        { label: 'RESEÑAS ÚTILES',     sub: 'Cuando alguien vota tu reseña como útil', def: true  },
        { label: 'NUEVOS SEGUIDORES',  sub: 'Cuando alguien empieza a seguirte',       def: true  },
        { label: 'COMENTARIOS',        sub: 'En tus reseñas y listas',                 def: true  },
        { label: 'NOVEDADES DE LISTAS',sub: 'Cuando alguien añade algo a tu lista',    def: false },
        { label: 'NEWSLETTER',         sub: 'Curación editorial semanal',              def: false },
        { label: 'EMAIL MARKETING',    sub: 'Promociones y novedades de la plataforma',def: false },
      ].map(n => {
        const [on, setOn] = useState(n.def);
        return (
          <div key={n.label} className="flex items-center justify-between px-4 py-3 border border-[#1f1f1f] hover:border-[#2a2a2a] transition-colors">
            <div>
              <p className="text-[11px] font-semibold text-white">{n.label}</p>
              <p className="text-[9px] font-mono text-[#525252] mt-0.5">{n.sub}</p>
            </div>
            <button onClick={() => setOn(v => !v)}
              className={`w-10 h-5 relative transition-colors ${on ? 'bg-[#FFE600]' : 'bg-[#1f1f1f]'}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-black transition-all ${on ? 'left-[calc(100%-18px)]' : 'left-0.5'}`} />
            </button>
          </div>
        );
      })}
      <p className="text-[9px] font-mono text-[#333] tracking-wide pt-2">
        Las notificaciones en la plataforma se controlan desde el icono en la barra superior.
      </p>
    </div>
  );

  const renderPrivacidad = () => (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-3 mb-5">
        <span className="text-[9px] font-mono text-[#333] tracking-[0.2em]">01 ——</span>
        <span className="text-[11px] font-black text-[#525252] tracking-[0.15em]" style={{ fontFamily: 'Space Grotesk' }}>
          VISIBILIDAD DEL PERFIL
        </span>
      </div>

      {/* Public/Private toggle */}
      <div className="border border-[#1f1f1f] p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[12px] font-semibold text-white mb-0.5">Perfil público</p>
            <p className="text-[9px] font-mono text-[#525252]">
              {isPublic ? 'Cualquiera puede ver tu perfil y reseñas' : 'Solo tus seguidores pueden verte'}
            </p>
          </div>
          <button onClick={() => handleUpdatePrivacy(!isPublic)}
            className={`w-10 h-5 relative transition-colors ${isPublic ? 'bg-[#FFE600]' : 'bg-[#1f1f1f]'}`}>
            <div className={`absolute top-0.5 w-4 h-4 bg-black transition-all ${isPublic ? 'left-[calc(100%-18px)]' : 'left-0.5'}`} />
          </button>
        </div>
        <p className="text-[9px] font-mono text-[#333]">
          Apareces en El Olimpo y en resultados de búsqueda cuando tu perfil es público.
        </p>
      </div>

      {[
        { label: 'MOSTRAR WATCHLIST',       sub: 'Otros pueden ver tu lista de quiero ver', def: true  },
        { label: 'MOSTRAR HISTORIAL',       sub: 'Otros pueden ver qué has visto',          def: false },
        { label: 'MOSTRAR ESTADÍSTICAS',    sub: 'Karma, XP y logros visibles al público',  def: true  },
        { label: 'INDEXAR EN BUSCADORES',   sub: 'Apareces en Google y otros motores',      def: false },
      ].map(n => {
        const [on, setOn] = useState(n.def);
        return (
          <div key={n.label} className="flex items-center justify-between px-4 py-3 border border-[#1f1f1f]">
            <div>
              <p className="text-[11px] font-semibold text-white">{n.label}</p>
              <p className="text-[9px] font-mono text-[#525252] mt-0.5">{n.sub}</p>
            </div>
            <button onClick={() => setOn(v => !v)}
              className={`w-10 h-5 relative transition-colors ${on ? 'bg-[#FFE600]' : 'bg-[#1f1f1f]'}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-black transition-all ${on ? 'left-[calc(100%-18px)]' : 'left-0.5'}`} />
            </button>
          </div>
        );
      })}
    </div>
  );

  const renderApariencia = () => (
    <div className="space-y-8 max-w-lg">
      <div className="flex items-center gap-3 mb-5">
        <span className="text-[9px] font-mono text-[#333] tracking-[0.2em]">01 ——</span>
        <span className="text-[11px] font-black text-[#525252] tracking-[0.15em]" style={{ fontFamily: 'Space Grotesk' }}>
          TEMA
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { id: 'dark',     label: 'OSCURO',    bg: '#0A0A0A', accent: '#FFE600', active: true },
          { id: 'darker',   label: 'NEGRO PURO', bg: '#000000', accent: '#FFE600', active: false },
          { id: 'midnight', label: 'MEDIANOCHE', bg: '#0A0A1A', accent: '#6366F1', active: false },
        ].map(t => (
          <button key={t.id}
            className={`p-3 border transition-colors ${t.active ? 'border-[#FFE600]' : 'border-[#1f1f1f] hover:border-[#333]'}`}
            style={{ background: t.bg }}>
            <div className="w-full h-8 mb-2" style={{ background: `linear-gradient(135deg, ${t.bg} 0%, ${t.accent}20 100%)` }}>
              <div className="w-6 h-1 mt-2 ml-2" style={{ background: t.accent }} />
            </div>
            <p className="text-[9px] font-black font-mono tracking-widest" style={{ color: t.active ? t.accent : '#525252' }}>
              {t.label}
            </p>
            {t.active && <p className="text-[8px] font-mono text-[#333] mt-0.5">ACTUAL</p>}
          </button>
        ))}
      </div>
      <p className="text-[9px] font-mono text-[#333]">
        Más temas disponibles próximamente. El tema actual es el único disponible en esta versión.
      </p>

      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[9px] font-mono text-[#333] tracking-[0.2em]">02 ——</span>
          <span className="text-[11px] font-black text-[#525252] tracking-[0.15em]" style={{ fontFamily: 'Space Grotesk' }}>
            TIPOGRAFÍA
          </span>
        </div>
        <div className="border border-[#1f1f1f] p-4 space-y-2">
          <p className="text-sm text-white" style={{ fontFamily: 'Space Grotesk' }}>Space Grotesk — Titulares</p>
          <p className="text-xs font-mono text-[#525252]">JetBrains Mono — Datos y métricas</p>
          <p className="text-[9px] font-mono text-[#333] mt-2">Sistema de tipografía fijo · no personalizable</p>
        </div>
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
          <h1
            className="text-5xl sm:text-6xl font-black text-white leading-[0.9] tracking-tight"
            style={{ fontFamily: 'Space Grotesk' }}>
            Ajustes<span className="text-[#FFE600]">.</span>
          </h1>
        </div>

        {/* Toast */}
        {toast && (
          <div className="mb-6">
            <Toast msg={toast.msg} ok={toast.ok} />
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Left sidebar nav ── */}
          <aside className="lg:w-56 shrink-0">
            {/* Mobile: horizontal scroll tabs */}
            <div className="lg:hidden flex overflow-x-auto scrollbar-none gap-0 border border-[#1f1f1f] mb-6">
              {SECTIONS.map(s => (
                <button key={s.id} onClick={() => setActiveSection(s.id)}
                  className={`px-3 py-2.5 text-[10px] font-black tracking-widest whitespace-nowrap border-b-2 -mb-px shrink-0 transition-colors ${
                    activeSection === s.id
                      ? 'text-[#FFE600] border-[#FFE600]'
                      : 'text-[#333] border-transparent hover:text-[#525252]'
                  }`}
                  style={{ fontFamily: 'Space Grotesk' }}>
                  {s.num} {s.label}
                </button>
              ))}
            </div>

            {/* Desktop: vertical nav */}
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
                    <span className="text-[9px] font-mono text-[#333] tracking-[0.15em]">{s.num}</span>
                    <span className="text-[10px] font-black tracking-widest" style={{ fontFamily: 'Space Grotesk' }}>
                      {s.label}
                    </span>
                  </div>
                  <ChevronRight size={10} className={`transition-colors ${
                    activeSection === s.id ? 'text-[#FFE600]' : 'text-[#1f1f1f] group-hover:text-[#333]'
                  }`} />
                </button>
              ))}
            </nav>

            {/* Version info */}
            <p className="hidden lg:block text-[8px] font-mono text-[#1f1f1f] mt-3 tracking-widest">
              PELICULEANDO V2.4 · BUILD {new Date().getFullYear()}
            </p>
          </aside>

          {/* ── Content panel ── */}
          <main className="flex-1 min-w-0">
            {/* Section label */}
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
