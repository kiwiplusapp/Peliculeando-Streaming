import type { ReactNode } from 'react';

export const metadata = {
  title: 'Admin — Peliculeando',
  robots: 'noindex, nofollow',
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: 'monospace' }}>
        {children}
      </body>
    </html>
  );
}
