import Image from "next/image";
import Link from "next/link";
import type { GalleryAlbum } from "@/lib/db/gallery";
import { ArrowRight } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export function GalleryAlbumCard({ album }: { album: GalleryAlbum }) {
  const layers = album.items.slice(0, 3);
  const hasBackLayers = layers.length > 1;

  return (
    <Link href={`/gallery/${album.slug}`} className="group block">
      <div className="relative aspect-[4/3]">
        {layers[2] ? (
          <div className="absolute bottom-10 left-9 right-2 top-2 -rotate-6 rounded-[14px] border border-line bg-card p-1.5 shadow-sm transition-transform duration-300 group-hover:-rotate-8">
            <div className="relative h-full overflow-hidden rounded-[10px] bg-bg-subtle">
              <Image
                src={layers[2].imageUrl}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover opacity-90"
              />
            </div>
          </div>
        ) : null}

        {layers[1] ? (
          <div className="absolute bottom-8 left-2 right-9 top-5 z-10 rotate-4 rounded-[14px] border border-line bg-card p-1.5 shadow-sm transition-transform duration-300 group-hover:rotate-6">
            <div className="relative h-full overflow-hidden rounded-[10px] bg-bg-subtle">
              <Image
                src={layers[1].imageUrl}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
            </div>
          </div>
        ) : null}

        <div
          className={cn(
            "absolute z-20 rounded-[14px] border border-line bg-card p-2 shadow-[var(--shadow-md)] transition-transform duration-300 group-hover:-translate-y-1.5 group-hover:rotate-1",
            hasBackLayers ? "inset-x-4 bottom-4 top-9" : "inset-2",
          )}
        >
          <div className="relative h-full overflow-hidden rounded-[9px] bg-bg-subtle">
            <Image
              src={layers[0].imageUrl}
              alt={`${album.name} 相册封面`}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4 pt-10">
              <p className="text-[0.62rem] uppercase tracking-[0.18em] text-white/65">Album</p>
              <p className="mt-0.5 text-[0.8rem] text-white">{album.count} 张照片</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-[1.1rem] font-semibold tracking-[-0.01em] text-ink transition-colors group-hover:text-accent-strong">
            {album.name}
          </h2>
          <p className="mt-1 text-[0.75rem] text-muted">按分类整理的 {album.count} 张照片</p>
        </div>
        <span className="mt-1 inline-flex flex-none items-center gap-1 text-[0.72rem] text-muted transition-colors group-hover:text-ink">
          打开
          <ArrowRight size={13} />
        </span>
      </div>
    </Link>
  );
}
