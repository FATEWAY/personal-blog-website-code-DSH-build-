"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { useAdminSession } from "@/components/admin/admin-session";
import { useToast } from "@/components/ui/toast";
import { Eye, Loader, Pencil, Trash } from "@/components/ui/icons";
import { adminHref } from "@/lib/route-path";
import type { PostStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PostActions({
  id,
  title,
  status,
}: {
  id: string;
  title: string;
  status: PostStatus;
}) {
  const { csrfToken, adminPath } = useAdminSession();
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function toggleStatus() {
    if (busy) return;
    setBusy(true);
    const nextStatus: PostStatus = status === "published" ? "draft" : "published";
    try {
      const response = await fetch(`/api/admin/posts/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = (await response.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null;

      if (!response.ok) {
        toast.error(data?.error?.message ?? "状态更新失败");
        return;
      }

      toast.success(nextStatus === "published" ? "文章已发布" : "文章已下架");
      router.refresh();
    } catch {
      toast.error("网络请求失败，状态没有更新");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (deleting) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/posts/${id}`, {
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

      toast.success("文章已删除");
      setConfirmOpen(false);
      router.refresh();
    } catch {
      toast.error("网络请求失败，文章没有删除");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-none items-center gap-1">
      <Link
        href={adminHref(adminPath, `/posts/${id}`)}
        className="icon-btn size-8"
        title="编辑文章"
        aria-label={`编辑 ${title}`}
      >
        <Pencil size={15} />
      </Link>
      <a
        href={`${adminHref(adminPath, `/posts/${id}/preview`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="icon-btn size-8"
        title="预览文章"
        aria-label={`预览 ${title}`}
      >
        <Eye size={15} />
      </a>
      <button
        type="button"
        onClick={toggleStatus}
        disabled={busy}
        className={cn(
          "rounded-md border px-2 py-1 text-[0.68rem] transition-colors disabled:opacity-50",
          status === "published"
            ? "border-line text-muted hover:border-line-strong hover:text-ink"
            : "border-accent/30 bg-accent-soft text-accent-strong hover:bg-accent hover:text-white",
        )}
        title={status === "published" ? "下架文章" : "发布文章"}
      >
        {busy ? <Loader size={12} /> : status === "published" ? "下架" : "发布"}
      </button>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="icon-btn size-8 text-muted hover:text-danger"
        title="删除文章"
        aria-label={`删除 ${title}`}
      >
        <Trash size={15} />
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title="删除这篇文章？"
        description={`《${title}》及其标签关联将被永久删除，前台链接会立即失效。此操作无法撤销。`}
        confirmLabel="永久删除"
        loading={deleting}
        onConfirm={remove}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}
