import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Toaster } from '@/components/ui/Toaster';
import { SubscriptionModal } from '@/components/ui/SubscriptionModal';
import { AuthProvider } from '@/components/layout/AuthProvider';
import { WatchProgressProvider } from '@/components/media/WatchProgressContext';
import { XPNotificationProvider } from '@/components/gamification/XPNotification';
import { getSession } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Peliculeando',
  description: 'Tu comunidad de cine y series en español',
  icons: { icon: '/favicon.ico' },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <html lang="es">
      <head>
        {/* Restore theme before first paint — avoids flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('pel_theme');
            if (t && t !== 'dark') document.documentElement.setAttribute('data-theme', t);
          } catch(e) {}
        `}} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6030100198055823"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
        <AuthProvider initialSession={session}>
          <WatchProgressProvider>
            <XPNotificationProvider>
              <Navbar />
              <main>{children}</main>
              <Toaster />
              <SubscriptionModal />
            </XPNotificationProvider>
          </WatchProgressProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
