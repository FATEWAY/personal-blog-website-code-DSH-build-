import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { GalleryActions } from "@/components/admin/gallery-actions";
import { EmptyState } from "@/components/site/empty-state";
import { ImageIcon, Plus } from "@/components/ui/icons";
import { config } from "@/lib/config";
import { listAllGallery } from "@/lib/db/gallery";
import { adminHref } from "@/lib/route-path";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "照片墙",
};

export default function AdminGalleryPage() {
  const items = listAllGallery();
  const visibleCount = items.filter((item) => item.visible).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Gallery"
        title="照片墙"
        description={`共 ${items.length} 张照片，其中 ${visibleCount} 张在关于页展示。适合放奖状、证书与纪念照片。`}
        actions={
          <Link href={adminHref(config.adminPath, "/gallery/new")} className="btn btn-primary btn-sm">
            <Plus size={15} />
            添加照片
          </Link>
        }
      />

      {items.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col overflow-hidden rounded-[16px] border border-line bg-card transition-colors hover:border-line-strong"
            >
              <div className="relative aspect-[4/3] border-b border-line bg-bg-subtle">
                <Image
                  src={item.imageUrl}
                  alt={item.caption}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-contain p-2"
                />
                <span
                  className={
                    item.visible
                      ? "absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-success/30 bg-success-soft px-2 py-0.5 text-[0.62rem] text-success"
                      : "absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-line-strong bg-card/90 px-2 py-0.5 text-[0.62rem] text-muted"
                  }
                >
                  <span
                    className={`size-1 rounded-full ${item.visible ? "bg-success" : "bg-muted"}`}
                    aria-hidden="true"
                  />
                  {item.visible ? "展示中" : "已隐藏"}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <span className="text-[0.62rem] uppercase tracking-[0.14em] text-muted">
                  {item.category || "未分类"}
                </span>
                <h2 className="mt-1 truncate text-[0.92rem] font-semibold text-ink">
                  {item.caption || "未命名照片"}
                </h2>
                <p className="mt-1.5 line-clamp-2 text-[0.75rem] leading-relaxed text-muted">
                  {item.note || "暂无说明"}
                </p>

                <div className="mt-auto flex items-center justify-between border-t border-line pt-3">
                  <span className="font-mono text-[0.62rem] text-muted">#{item.sortOrder}</span>
                  <GalleryActions id={item.id} caption={item.caption} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={<ImageIcon size={20} />}
          title="照片墙还是空的"
          description="上传奖状、证书或照片，并填写标题；它会自动出现在关于页底部。"
          action={{ href: adminHref(config.adminPath, "/gallery/new"), label: "添加第一张照片" }}
        />
      )}
    </div>
  );
}
