'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Zap } from 'lucide-react';

declare global {
  interface Window { adsbygoogle: unknown[]; }
}

interface AdInterstitialProps {
  slot?: string;
  onClose?: () => void;
  countdownSeconds?: number;
}

export function AdInterstitial({
  slot = '5555555555',
  onClose,
  countdownSeconds = 5,
}: AdInterstitialProps) {
  const adRef    = useRef<HTMLModElement>(null);
  const pushed   = useRef(false);
  const [seconds, setSeconds]     = useState(countdownSeconds);
  const [canClose, setCanClose]   = useState(false);
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [visible, setVisible]     = useState(false);

  // Check subscription status
  useEffect(() => {
    // Check if already dismissed in this session
    try {
      const dismissed = sessionStorage.getItem('pel_ad_dismissed');
      if (dismissed) { onClose?.(); return; }
    } catch {}

    fetch('/api/subscription')
      .then(r => r.json())
      .then(d => {
        if (d.active) { onClose?.(); return; } // VIP users never see the popup
        setSubscribed(false);
        setVisible(true);
      })
      .catch(() => { onClose?.(); });
  }, [onClose]);

  // Push AdSense unit once visible
  useEffect(() => {
    if (visible && !pushed.current && adRef.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushed.current = true;
      } catch {}
    }
  }, [visible]);

  // Countdown timer
  useEffect(() => {
    if (!visible) return;
    if (seconds <= 0) { setCanClose(true); return; }
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, visible]);

  const handleClose = () => {
    try { sessionStorage.setItem('pel_ad_dismissed', '1'); } catch {}
    onClose?.();
  };

  const handleVIP = () => {
    handleClose();
    document.dispatchEvent(new CustomEvent('open-subscription'));
  };

  if (!visible || subscribed !== false) return null;

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={canClose ? handleClose : undefined}>
      <div
        className="relative w-full max-w-lg mx-4 border border-[#1f1f1f] bg-[#0A0A0A] overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f1f1f]">
          <span className="text-[9px] font-black font-mono text-[#2a2a2a] tracking-[0.25em]">PUBLICIDAD</span>
          <div className="flex items-center gap-3">
            {/* VIP button */}
            <button
              onClick={handleVIP}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black tracking-widest text-black bg-[#FFE600] hover:opacity-90 transition-opacity"
              style={{ fontFamily: 'Space Grotesk' }}>
              <Zap size={10} />
              HAZTE VIP
            </button>

            {/* Close / countdown */}
            {canClose ? (
              <button
                onClick={handleClose}
                className="w-7 h-7 flex items-center justify-center border border-[#333] text-[#525252] hover:text-white hover:border-[#525252] transition-colors"
                aria-label="Cerrar">
                <X size={13} />
              </button>
            ) : (
              <div className="w-7 h-7 flex items-center justify-center border border-[#1f1f1f]">
                <span className="text-[11px] font-black font-mono text-[#525252]">{seconds}</span>
              </div>
            )}
          </div>
        </div>

        {/* AdSense unit */}
        <ins
          ref={adRef}
          className="adsbygoogle block"
          style={{ display: 'block', minHeight: '250px' }}
          data-ad-client="ca-pub-6030100198055823"
          data-ad-slot={slot}
          data-ad-format="rectangle"
          data-full-width-responsive="true"
        />

        {/* Footer CTA */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#1f1f1f] bg-[#0A0A0A]">
          <p className="text-[9px] font-mono text-[#333] tracking-wide">
            Los anuncios mantienen Peliculeando gratuito
          </p>
          <button
            onClick={handleVIP}
            className="text-[9px] font-black font-mono text-[#FFE600]/60 hover:text-[#FFE600] tracking-widest transition-colors"
            style={{ fontFamily: 'Space Grotesk' }}>
            ELIMINAR ANUNCIOS →
          </button>
        </div>
      </div>
    </div>
  );
}
