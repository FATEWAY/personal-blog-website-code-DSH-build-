"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdminSession } from "@/components/admin/admin-session";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ImageUploader } from "@/components/admin/image-uploader";
import { useToast } from "@/components/ui/toast";
import { ArrowLeft, Loader, Save, Trash } from "@/components/ui/icons";
import { adminHref } from "@/lib/route-path";

export type GalleryFormInitial = {
  id: string | null;
  imageUrl: string;
  category: string;
  caption: string;
  note: string;
  sortOrder: number;
  visible: boolean;
};

export function GalleryForm({
  mode,
  initial,
  maxMb,
}: {
  mode: "create" | "edit";
  initial: GalleryFormInitial;
  maxMb: number;
}) {
  const { csrfToken, adminPath } = useAdminSession();
  const router = useRouter();
  const toast = useToast();

  const [form, setForm] = useState({
    imageUrl: initial.imageUrl,
    category: initial.category || "未分类",
    caption: initial.caption,
    note: initial.note,
    sortOrder: String(initial.sortOrder),
    visible: initial.visible,
  });
  const itemId = initial.id;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setErrors((current) => {
      if (!current[key as string]) return current;
      const next = { ...current };
      delete next[key as string];
      return next;
    });
  }

  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  async function save() {
    if (saving) return;
    setSaving(true);
    setErrors({});

    try {
      const response = await fetch(
        itemId ? `/api/admin/gallery/${itemId}` : "/api/admin/gallery",
        {
          method: itemId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfToken,
          },
          body: JSON.stringify({
            imageUrl: form.imageUrl,
            category: form.category,
            caption: form.caption,
            note: form.note,
            sortOrder: Number(form.sortOrder || 0),
            visible: form.visible,
          }),
        },
      );

      if (response.status === 401) {
        toast.error("登录状态已失效，请重新登录");
        router.replace(adminHref(adminPath, "/login"));
        return;
      }

      const data = (await response.json().catch(() => null)) as
        | {
            item?: { id: string };
            error?: { message?: string; fields?: Record<string, string>; details?: Record<string, unknown> };
          }
        | null;

      if (!response.ok || !data?.item) {
        const fields =
          data?.error?.fields ??
          (data?.error?.details && typeof data.error.details === "object"
            ? (data.error.details as Record<string, string>)
            : undefined);
        if (fields) {
          const next: Record<string, string> = {};
          for (const [key, value] of Object.entries(fields)) {
            if (typeof value === "string") next[key] = value;
          }
          setErrors(next);
        }
        toast.error(data?.error?.message ?? "保存失败，请检查表单");
        return;
      }

      setDirty(false);
      toast.success(mode === "create" ? "照片已添加" : "照片已保存");

      if (!itemId) {
        router.replace(adminHref(adminPath, `/gallery/${data.item.id}`));
        router.refresh();
      }
    } catch {
      toast.error("网络请求失败，照片没有保存");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!itemId || deleting) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/gallery/${itemId}`, {
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
      router.replace(adminHref(adminPath, "/gallery"));
      router.refresh();
    } catch {
      toast.error("网络请求失败，照片没有删除");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Link
            href={adminHref(adminPath, "/gallery")}
            className="icon-btn size-8"
            aria-label="返回照片墙"
          >
            <ArrowLeft size={17} />
          </Link>
          <div>
            <p className="text-[0.6rem] uppercase tracking-[0.16em] text-muted">
              {mode === "create" ? "New photo" : "Edit photo"}
            </p>
            <h1 className="text-[1.1rem] font-semibold text-ink">
              {mode === "create" ? "添加照片" : form.caption || "编辑照片"}
            </h1>
          </div>
          {dirty ? (
            <span className="chip border-warning/30 bg-warning-soft text-warning">未保存</span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {itemId ? (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="btn btn-ghost btn-sm text-muted hover:text-danger"
            >
              <Trash size={14} />
              删除
            </button>
          ) : null}
          <button type="button" onClick={save} className="btn btn-primary btn-sm" disabled={saving}>
            {saving ? <Loader size={14} /> : <Save size={14} />}
            {mode === "create" ? "添加照片" : "保存修改"}
          </button>
        </div>
      </div>

      {Object.keys(errors).length > 0 ? (
        <div
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-[0.78rem] text-danger"
        >
          {Object.entries(errors).map(([key, message]) => (
            <p key={key}>
              {key}：{message}
            </p>
          ))}
        </div>
      ) : null}

      <div className="card-surface space-y-5 p-5">
        <ImageUploader
          value={form.imageUrl || null}
          onChange={(value) => update("imageUrl", value ?? "")}
          label="照片"
          maxMb={maxMb}
          aspect="aspect-[4/3]"
          fit="contain"
        />
        {errors.imageUrl ? <p className="field-error">{errors.imageUrl}</p> : null}

        <div>
          <label htmlFor="gallery-category" className="field-label">
            相册分类
          </label>
          <input
            id="gallery-category"
            value={form.category}
            onChange={(event) => update("category", event.target.value)}
            className="input"
            maxLength={40}
            placeholder="例如：奖状 / 证书 / 活动"
            aria-invalid={Boolean(errors.category)}
          />
          {errors.category ? <p className="field-error">{errors.category}</p> : null}
          <p className="mt-1.5 text-[0.64rem] text-muted">
            相同分类的照片会归入同一个相册，并生成对应的分类页。
          </p>
        </div>

        <div>
          <label htmlFor="gallery-caption" className="field-label">
            标题
          </label>
          <input
            id="gallery-caption"
            value={form.caption}
            onChange={(event) => update("caption", event.target.value)}
            className="input"
            maxLength={100}
            placeholder="例如：2025 年度优秀毕业生"
            aria-invalid={Boolean(errors.caption)}
          />
          {errors.caption ? <p className="field-error">{errors.caption}</p> : null}
        </div>

        <div>
          <label htmlFor="gallery-note" className="field-label">
            说明（可选）
          </label>
          <textarea
            id="gallery-note"
            value={form.note}
            onChange={(event) => update("note", event.target.value)}
            className="textarea"
            rows={3}
            maxLength={300}
            placeholder="奖状名称、颁发机构或一段简短的说明"
          />
          {errors.note ? <p className="field-error">{errors.note}</p> : null}
          <p className="mt-1 text-right text-[0.62rem] text-muted">{form.note.length}/300</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="gallery-sort" className="field-label">
              排序
            </label>
            <input
              id="gallery-sort"
              type="number"
              min={-999}
              max={999}
              value={form.sortOrder}
              onChange={(event) => update("sortOrder", event.target.value)}
              className="input"
            />
            {errors.sortOrder ? <p className="field-error">{errors.sortOrder}</p> : null}
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-bg-subtle/40 p-3 sm:mt-7">
            <input
              type="checkbox"
              checked={form.visible}
              onChange={(event) => update("visible", event.target.checked)}
              className="mt-0.5 size-4 rounded border-line-strong accent-[var(--accent)]"
            />
            <span>
              <span className="block text-[0.8rem] font-medium text-ink">在关于页展示</span>
              <span className="mt-0.5 block text-[0.66rem] text-muted">关闭后仅在后台可见。</span>
            </span>
          </label>
        </div>

        <p className="text-[0.68rem] leading-relaxed text-muted">
          照片会先上传到媒体目录，再以原比例显示在关于页的照片墙中。建议使用清晰的横向或纵向图片。
        </p>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="删除这张照片？"
        description={`「${form.caption || "未命名照片"}」将从照片墙移除，此操作无法撤销。`}
        confirmLabel="永久删除"
        loading={deleting}
        onConfirm={remove}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}
