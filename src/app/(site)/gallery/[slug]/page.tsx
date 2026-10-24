import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GalleryGrid } from "@/components/site/gallery-grid";
import { ArrowLeft } from "@/components/ui/icons";
import { getGalleryAlbumBySlug } from "@/lib/db/gallery";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const album = getGalleryAlbumBySlug(slug);

  return {
    title: album ? `${album.name} · 照片墙` : "相册不存在",
    description: album
      ? `${album.name}相册，共 ${album.count} 张照片。`
      : "这个相册不存在或尚未公开。",
    alternates: album ? { canonical: `/gallery/${album.slug}` } : undefined,
    robots: album ? undefined : { index: false, follow: false },
  };
}

export default async function GalleryAlbumPage({ params }: PageProps) {
  const { slug } = await params;
  const album = getGalleryAlbumBySlug(slug);
  if (!album) notFound();

  return (
    <div className="container-page pb-4 pt-10 sm:pt-14">
      <Link
        href="/gallery"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={14} />
        照片墙
      </Link>

      <header className="mt-8 max-w-3xl">
        <p className="eyebrow">
          <span className="eyebrow-dot" aria-hidden="true" />
          Album · {album.count} 张照片
        </p>
        <h1 className="mt-4 text-[2.3rem] font-semibold leading-[1.12] tracking-[-0.03em] text-ink sm:text-[2.8rem]">
          {album.name}
        </h1>
        <p className="mt-4 text-[0.95rem] leading-relaxed text-muted">
          这里收录了这个相册下的全部照片，点击图片可以查看原图。
        </p>
      </header>

      <div className="mt-10">
        <GalleryGrid items={album.items} />
      </div>

      <div className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 text-sm">
        <Link href="/gallery" className="inline-flex items-center gap-1.5 text-ink-soft transition-colors hover:text-ink">
          <ArrowLeft size={14} />
          返回全部相册
        </Link>
        <Link href="/about" className="text-muted transition-colors hover:text-ink">
          关于我
        </Link>
      </div>
    </div>
  );
}
