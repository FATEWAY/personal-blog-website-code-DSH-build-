import type { Metadata } from "next";
import { GalleryForm } from "@/components/admin/gallery-form";
import { config } from "@/lib/config";

export const metadata: Metadata = {
  title: "添加照片",
};

export default function NewGalleryPage() {
  return (
    <GalleryForm
      mode="create"
      maxMb={Math.round(config.maxUploadBytes / (1024 * 1024))}
      initial={{
        id: null,
        imageUrl: "",
        category: "未分类",
        caption: "",
        note: "",
        sortOrder: 0,
        visible: true,
      }}
    />
  );
}
