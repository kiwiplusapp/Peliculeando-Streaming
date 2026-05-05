'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface AdBannerProps {
  slot?: string;
  format?: 'auto' | 'horizontal' | 'rectangle';
  className?: string;
  label?: string;
}

declare global {
  interface Window { adsbygoogle: unknown[]; }
}

export function AdBanner({
  slot = '1234567890',
  format = 'auto',
  className = '',
  label = 'PUBLICIDAD',
}: AdBannerProps) {
  const adRef    = useRef<HTMLModElement>(null);
  const pushed   = useRef(false);
  const [dismissed,  setDismissed]  = useState(false);
  const [subscribed, setSubscribed] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/subscription')
      .then(r => r.json())
      .then(d => setSubscribed(Boolean(d.active)))
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

  // Hide while loading, when subscribed, or when dismissed
  if (subscribed === null || subscribed === true || dismissed) return null;

  return (
    <div className={`relative border border-[#1f1f1f] bg-[#0A0A0A] overflow-hidden ${className}`}>
      {/* Label row */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#1f1f1f]">
        <span className="text-[8px] font-black font-mono text-[#2a2a2a] tracking-[0.25em]">
          {label}
        </span>
        <div className="flex items-center gap-3">
          <a
            href="#"
            onClick={e => { e.preventDefault(); document.dispatchEvent(new CustomEvent('open-subscription')); }}
            className="text-[8px] font-black font-mono tracking-[0.2em] text-[#FFE600]/60 hover:text-[#FFE600] transition-colors"
            style={{ fontFamily: 'Space Grotesk' }}>
            SIN ANUNCIOS →
          </a>
          <button
            onClick={() => setDismissed(true)}
            className="text-[#2a2a2a] hover:text-[#525252] transition-colors"
            aria-label="Cerrar">
            <X size={10} />
          </button>
        </div>
      </div>

      {/* AdSense unit */}
      <ins
        ref={adRef}
        className="adsbygoogle block"
        style={{ display: 'block', minHeight: '90px' }}
        data-ad-client="ca-pub-6030100198055823"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
