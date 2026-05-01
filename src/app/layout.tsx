import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Toaster } from '@/components/ui/Toaster';
import { SubscriptionModal } from '@/components/ui/SubscriptionModal';
import { AuthProvider } from '@/components/layout/AuthProvider';
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6030100198055823"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
        <AuthProvider initialSession={session}>
          <Navbar />
          <main>{children}</main>
          <Toaster />
          <SubscriptionModal />
        </AuthProvider>
      </body>
    </html>
  );
}
