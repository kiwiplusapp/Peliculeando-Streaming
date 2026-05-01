import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { imgUrl } from '@/lib/tmdb';
import { query } from '@/lib/db';
import { BookMarked, Film } from 'lucide-react';

export const revalidate = 60;

async function getCollection(id: string) {
  try {
    const [collection] = await query<Record<string, unknown>>(
      `SELECT c.*, u.username, u.avatar_color,
              (SELECT COUNT(*) FROM collection_items WHERE collection_id = c.id) as item_count,
              (SELECT COUNT(*) FROM collection_follows WHERE collection_id = c.id) as follower_count
       FROM collections c JOIN users u ON c.user_id = u.id
       WHERE c.id = $1`,
      [id]
    );
    if (!collection) return null;

    const items = await query(
      'SELECT * FROM collection_items WHERE collection_id = $1 ORDER BY added_at',
      [id]
    );

    return { collection, items };
  } catch {
    return null;
  }
}

export default async function CollectionDetailPage({ params }: { params: { id: string } }) {
  const data = await getCollection(params.id);
  if (!data?.collection) notFound();

  const { collection, items } = data;
  const col = collection as Record<string, unknown>;

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-[1400px] mx-auto px-6">
        {/* Header */}
        <div className="flex items-start gap-6 mb-8">
          <div className="w-24 h-24 rounded-xl bg-[#181818] border border-[#262626] overflow-hidden shrink-0 flex items-center justify-center">
            {col.cover_poster ? (
              <Image src={`https://image.tmdb.org/t/p/w200${col.cover_poster}`} alt={col.title as string} width={96} height={96} className="object-cover w-full h-full" />
            ) : (
              <BookMarked size={32} className="text-[#333333]" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">{col.title as string}</h1>
            {col.description && (
              <p className="text-[#A3A3A3] mb-2">{col.description as string}</p>
            )}
            <p className="text-sm text-[#525252]">
              por <span className="text-amber-400">@{col.username as string}</span>
              {' · '}{col.item_count as string} títulos
            </p>
          </div>
        </div>

        {/* Items grid */}
        {(items as unknown[]).length === 0 ? (
          <div className="text-center py-16 text-[#525252]">
            <Film size={48} className="mx-auto mb-3 opacity-30" />
            <p>Esta colección está vacía</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {(items as Array<{ tmdb_id: number; media_type: string; title: string; poster_path: string | null; note: string | null }>).map((item) => {
              const poster = imgUrl(item.poster_path, 'w342');
              return (
                <Link
                  key={`${item.tmdb_id}-${item.media_type}`}
                  href={`/${item.media_type}/${item.tmdb_id}`}
                  className="group"
                >
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-[#181818] border border-[#262626] card-glow transition-all group-hover:-translate-y-1">
                    {poster ? (
                      <Image src={poster} alt={item.title} fill sizes="160px" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[#525252]">
                        <Film size={24} />
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-white line-clamp-2">{item.title}</p>
                  {item.note && <p className="text-xs text-[#525252] mt-0.5 line-clamp-1 italic">{item.note}</p>}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
