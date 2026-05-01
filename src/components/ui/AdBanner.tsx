'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Zap } from 'lucide-react';

interface AdBannerProps {
  slot?: string;
  format?: 'auto' | 'horizontal' | 'rectangle';
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export function AdBanner({ slot = '1234567890', format = 'auto', className = '' }: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const [dismissed, setDismissed] = useState(false);
  const [subscribed, setSubscribed] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/subscription')
      .then(r => r.json())
      .then(d => setSubscribed(d.active))
      .catch(() => setSubscribed(false));
  }, []);

  useEffect(() => {
    if (subscribed === false && !pushed.current && adRef.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushed.current = true;
      } catch {}
    }
  }, [subscribed]);

  if (subscribed === null || subscribed === true || dismissed) return null;

  return (
    <div className={`relative bg-[#111111] border border-[#262626] rounded-xl overflow-hidden ${className}`}>
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 z-10 w-5 h-5 flex items-center justify-center bg-black/60 rounded-full text-[#525252] hover:text-white transition-colors"
        aria-label="Cerrar anuncio"
      >
        <X size={11} />
      </button>

      <div className="px-3 pt-1.5 pb-0.5">
        <span className="text-[10px] text-[#525252] uppercase tracking-wider font-medium">Publicidad</span>
      </div>

      <ins
        ref={adRef}
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-6030100198055823"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />

      <div className="flex items-center justify-center gap-2 py-2 border-t border-[#1A1A1A]">
        <Zap size={11} className="text-amber-400" />
        <a
          href="#premium"
          className="text-[11px] text-amber-400 hover:text-amber-300 font-medium transition-colors"
          onClick={e => {
            e.preventDefault();
            document.dispatchEvent(new CustomEvent('open-subscription'));
          }}
        >
          Eliminar anuncios — Hazte Premium
        </a>
      </div>
    </div>
  );
}
