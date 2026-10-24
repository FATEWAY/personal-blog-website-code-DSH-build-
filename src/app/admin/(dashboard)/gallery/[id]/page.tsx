import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GalleryForm } from "@/components/admin/gallery-form";
import { config } from "@/lib/config";
import { getGalleryItem } from "@/lib/db/gallery";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const item = getGalleryItem(id);
  return {
    title: item ? `编辑：${item.caption}` : "编辑照片",
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function EditGalleryPage({ params }: PageProps) {
  const { id } = await params;
  const item = getGalleryItem(id);
  if (!item) notFound();

  return (
    <GalleryForm
      mode="edit"
      maxMb={Math.round(config.maxUploadBytes / (1024 * 1024))}
      initial={{
        id: item.id,
        imageUrl: item.imageUrl,
        category: item.category,
        caption: item.caption,
        note: item.note,
        sortOrder: item.sortOrder,
        visible: item.visible,
      }}
    />
  );
}
