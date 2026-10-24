/* eslint-disable @next/next/no-img-element */
import type { GalleryItem } from "@/lib/types";

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
      {items.map((item) => (
        <figure
          key={item.id}
          className="break-inside-avoid overflow-hidden rounded-[16px] border border-line bg-card shadow-[var(--shadow-sm)] transition-colors hover:border-line-strong"
        >
          <a
            href={item.imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-bg-subtle"
            aria-label={`查看大图：${item.caption || "照片"}`}
          >
            <img
              src={item.imageUrl}
              alt={item.caption || "照片墙图片"}
              loading="lazy"
              className="w-full object-contain"
            />
          </a>
          <figcaption className="border-t border-line px-4 py-3">
            <p className="text-[0.85rem] font-medium text-ink">{item.caption}</p>
            {item.note ? (
              <p className="mt-1 text-[0.72rem] leading-relaxed text-muted">{item.note}</p>
            ) : null}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
