import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { imgUrl } from '@/lib/tmdb';
import { query } from '@/lib/db';
import { Film } from 'lucide-react';

export const revalidate = 60;

async function getCollection(id: string) {
  try {
    const [collection] = await query<Record<string, unknown>>(
      `SELECT c.*, u.username, u.avatar_color,
              (SELECT COUNT(*) FROM collection_items WHERE collection_id = c.id) AS item_count,
              (SELECT COUNT(*) FROM collection_follows WHERE collection_id = c.id) AS follower_count
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
  } catch { return null; }
}

export default async function CollectionDetailPage({ params }: { params: { id: string } }) {
  const data = await getCollection(params.id);
  if (!data?.collection) notFound();

  const { collection, items } = data;
  const col = collection as Record<string, unknown>;
  const itemList = items as Array<{
    tmdb_id: number; media_type: string; title: string;
    poster_path: string | null; note: string | null;
  }>;

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 py-4 text-[9px] font-mono text-[#333] tracking-[0.2em]">
          <Link href="/colecciones" className="hover:text-[#FFE600] transition-colors">← COLECCIONES</Link>
          <span>·</span>
          <span>@{col.username as string}</span>
        </div>

        {/* Header */}
        <div className="border border-[#1f1f1f] p-6 mb-8">
          <div className="flex items-start gap-5">
            {/* Cover thumbnail */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 bg-[#141414] border border-[#1f1f1f] overflow-hidden flex items-center justify-center"
              style={!col.cover_poster ? { background: 'repeating-linear-gradient(45deg, #0A0A0A, #0A0A0A 4px, #141414 4px, #141414 8px)' } : {}}>
              {col.cover_poster ? (
                <Image
                  src={imgUrl(col.cover_poster as string, 'w200')!}
                  alt={col.title as string}
                  width={96} height={96}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-2xl font-black font-mono text-[#1f1f1f]">
                  {String(col.id).padStart(2, '0')}
                </span>
              )}
            </div>

            {/* Meta */}
            <div className="flex-1 min-w-0">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                {!col.is_public && (
                  <span className="px-2 py-0.5 text-[8px] font-black font-mono tracking-widest border border-[#2a2a2a] text-[#525252]">
                    PRIVADA
                  </span>
                )}
                <span className="px-2 py-0.5 text-[8px] font-mono tracking-widest border border-[#1f1f1f] text-[#333]">
                  {col.item_count as string} TÍTULOS
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight"
                style={{ fontFamily: 'Space Grotesk' }}>
                {(col.title as string).toUpperCase()}
                <span className="text-[#FFE600]">.</span>
              </h1>

              {col.description ? (
                <p className="text-sm text-[#525252] mt-2 leading-relaxed max-w-xl">
                  {String(col.description)}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-4 mt-3 text-[9px] font-mono text-[#333] tracking-widest">
                <Link href={`/perfil`} className="hover:text-[#FFE600] transition-colors">
                  @{col.username as string}
                </Link>
                <span>{col.follower_count as string} SEGUIDORES</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section header */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[9px] font-mono text-[#333] tracking-[0.2em]">CONTENIDO</span>
          <div className="flex-1 h-px bg-[#1f1f1f]" />
          <span className="text-[9px] font-mono text-[#333] tracking-[0.2em]">
            {itemList.length} TÍTULOS
          </span>
        </div>

        {/* Items grid */}
        {itemList.length === 0 ? (
          <div className="border border-[#1f1f1f] px-6 py-16 text-center">
            <p className="text-[11px] font-mono text-[#333] tracking-widest">COLECCIÓN VACÍA</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {itemList.map((item, idx) => {
              const poster = imgUrl(item.poster_path, 'w342');
              return (
                <Link
                  key={`${item.tmdb_id}-${item.media_type}`}
                  href={`/${item.media_type}/${item.tmdb_id}`}
                  className="group">
                  <div className="relative aspect-[2/3] bg-[#141414] border border-[#1f1f1f] group-hover:border-[#FFE600]/30 overflow-hidden transition-colors">
                    {poster ? (
                      <Image src={poster} alt={item.title} fill sizes="160px"
                        className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[#333]">
                        <Film size={20} />
                      </div>
                    )}
                    {/* Order number overlay */}
                    <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[8px] font-black font-mono text-[#FFE600]">
                        #{String(idx + 1).padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1.5 text-[10px] font-semibold text-[#A3A3A3] line-clamp-2 leading-tight group-hover:text-white transition-colors">
                    {item.title}
                  </p>
                  {item.note && (
                    <p className="text-[9px] font-mono text-[#333] mt-0.5 line-clamp-1 italic">{item.note}</p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
