import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/site/empty-state";
import { GalleryAlbumCard } from "@/components/site/gallery-album-card";
import { ArrowRight, ImageIcon } from "@/components/ui/icons";
import { groupGalleryItems, listVisibleGallery } from "@/lib/db/gallery";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "照片墙",
  description: "按分类整理的奖状、证书与值得留存的瞬间。",
  alternates: { canonical: "/gallery" },
};

export default function GalleryPage() {
  const albums = groupGalleryItems(listVisibleGallery());
  const totalPhotos = albums.reduce((sum, album) => sum + album.count, 0);

  return (
    <div className="container-page pb-4 pt-14 sm:pt-20">
      <header className="max-w-2xl">
        <p className="eyebrow">
          <span className="eyebrow-dot" aria-hidden="true" />
          Gallery
        </p>
        <h1 className="mt-4 text-[2.5rem] font-semibold leading-[1.1] tracking-[-0.035em] text-ink sm:text-[3rem]">
          照片墙
        </h1>
        <p className="mt-4 text-[0.98rem] leading-relaxed text-ink-soft">
          奖状、证书，以及一些值得留存的瞬间。照片按相册分类整理，点击相册查看全部内容。
        </p>
        <p className="mt-3 text-[0.78rem] text-muted">
          {albums.length} 个相册 · 共 {totalPhotos} 张照片
        </p>
      </header>

      {albums.length > 0 ? (
        <div
          className={cn(
            "mt-12 grid gap-x-7 gap-y-12",
            albums.length === 1 ? "mx-auto max-w-xl" : "sm:grid-cols-2",
            albums.length >= 3 && "lg:grid-cols-3",
          )}
        >
          {albums.map((album) => (
            <GalleryAlbumCard key={album.slug} album={album} />
          ))}
        </div>
      ) : (
        <div className="mt-10">
          <EmptyState
            icon={<ImageIcon size={20} />}
            title="照片墙正在整理中"
            description="添加并公开照片后，它们会按相册分类展示在这里。"
            action={{ href: "/about", label: "返回关于页" }}
          />
        </div>
      )}

      <div className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 text-sm">
        <Link href="/about" className="inline-flex items-center gap-1.5 text-ink-soft transition-colors hover:text-ink">
          返回关于页
        </Link>
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-ink">
          浏览博客
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
