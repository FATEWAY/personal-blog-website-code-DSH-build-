"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { useAdminSession } from "@/components/admin/admin-session";
import { useToast } from "@/components/ui/toast";
import { Pencil, Trash } from "@/components/ui/icons";
import { adminHref } from "@/lib/route-path";

export function GalleryActions({ id, caption }: { id: string; caption: string }) {
  const { csrfToken, adminPath } = useAdminSession();
  const router = useRouter();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    if (deleting) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/gallery/${id}`, {
        method: "DELETE",
        headers: { "x-csrf-token": csrfToken },
      });
      const data = (await response.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null;

      if (!response.ok) {
        toast.error(data?.error?.message ?? "删除失败");
        return;
      }

      toast.success("照片已删除");
      setConfirmOpen(false);
      router.refresh();
    } catch {
      toast.error("网络请求失败，照片没有删除");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-none items-center gap-1">
      <Link
        href={adminHref(adminPath, `/gallery/${id}`)}
        className="icon-btn size-8"
        title="编辑照片"
        aria-label={`编辑 ${caption}`}
      >
        <Pencil size={15} />
      </Link>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="icon-btn size-8 text-muted hover:text-danger"
        title="删除照片"
        aria-label={`删除 ${caption}`}
      >
        <Trash size={15} />
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title="删除这张照片？"
        description={`「${caption || "未命名照片"}」将从照片墙移除，此操作无法撤销。`}
        confirmLabel="永久删除"
        loading={deleting}
        onConfirm={remove}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}
