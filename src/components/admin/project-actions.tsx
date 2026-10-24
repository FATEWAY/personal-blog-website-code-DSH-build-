"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { useAdminSession } from "@/components/admin/admin-session";
import { useToast } from "@/components/ui/toast";
import { Pencil, Trash } from "@/components/ui/icons";
import { adminHref } from "@/lib/route-path";

export function ProjectActions({ id, title }: { id: string; title: string }) {
  const { csrfToken, adminPath } = useAdminSession();
  const router = useRouter();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    if (deleting) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/projects/${id}`, {
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

      toast.success("项目已删除");
      setConfirmOpen(false);
      router.refresh();
    } catch {
      toast.error("网络请求失败，项目没有删除");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-none items-center gap-1">
      <Link
        href={adminHref(adminPath, `/projects/${id}`)}
        className="icon-btn size-8"
        title="编辑项目"
        aria-label={`编辑 ${title}`}
      >
        <Pencil size={15} />
      </Link>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="icon-btn size-8 text-muted hover:text-danger"
        title="删除项目"
        aria-label={`删除 ${title}`}
      >
        <Trash size={15} />
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title="删除这个项目？"
        description={`「${title}」将从项目展示区移除，此操作无法撤销。`}
        confirmLabel="永久删除"
        loading={deleting}
        onConfirm={remove}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}
