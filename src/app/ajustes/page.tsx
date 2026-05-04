import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { SettingsContent } from '@/components/layout/SettingsContent';

export const metadata = { title: 'Ajustes — Peliculeando' };

export default async function AjustesPage() {
  const session = await getSession();
  if (!session) redirect('/');

  const userId = Number(session.sub);

  const [user] = await query<{
    id: number; username: string; email: string;
    avatar_color: string; bio: string; location: string;
    website: string; is_public: boolean; created_at: string;
  }>(
    `SELECT id, username, email, avatar_color,
            COALESCE(bio, '') AS bio,
            COALESCE(location, '') AS location,
            COALESCE(website, '') AS website,
            COALESCE(is_public, true) AS is_public,
            created_at
     FROM users WHERE id = $1`,
    [userId]
  ).catch(() => []);

  return <SettingsContent initialUser={user || null} />;
}
