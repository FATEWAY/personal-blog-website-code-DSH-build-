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
import { cn } from "@/lib/utils";

export type ProjectFormInitial = {
  id: string | null;
  title: string;
  description: string;
  category: string;
  tech: string[];
  coverImage: string | null;
  demoUrl: string | null;
  repoUrl: string | null;
  sortOrder: number;
  visible: boolean;
};

export function ProjectForm({
  mode,
  initial,
  maxMb,
}: {
  mode: "create" | "edit";
  initial: ProjectFormInitial;
  maxMb: number;
}) {
  const { csrfToken, adminPath } = useAdminSession();
  const router = useRouter();
  const toast = useToast();

  const [form, setForm] = useState({
    title: initial.title,
    description: initial.description,
    category: initial.category,
    techText: initial.tech.join(", "),
    coverImage: initial.coverImage,
    demoUrl: initial.demoUrl ?? "",
    repoUrl: initial.repoUrl ?? "",
    sortOrder: String(initial.sortOrder),
    visible: initial.visible,
  });
  const [projectId] = useState(initial.id);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dirty, setDirty] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setDirty(true);
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

    const tech = form.techText
      .split(/[,，]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 10);

    try {
      const response = await fetch(
        projectId ? `/api/admin/projects/${projectId}` : "/api/admin/projects",
        {
          method: projectId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfToken,
          },
          body: JSON.stringify({
            title: form.title,
            description: form.description,
            category: form.category,
            tech,
            coverImage: form.coverImage,
            demoUrl: form.demoUrl,
            repoUrl: form.repoUrl,
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
            project?: { id: string };
            error?: { message?: string; fields?: Record<string, string>; details?: Record<string, unknown> };
          }
        | null;

      if (!response.ok || !data?.project) {
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
        toast.error(data?.error?.message ?? "保存失败，请稍后重试");
        return;
      }

      setDirty(false);
      toast.success(mode === "create" ? "项目已创建" : "项目已保存");

      if (!projectId) {
        router.replace(adminHref(adminPath, `/projects/${data.project.id}`));
        router.refresh();
      }
    } catch {
      toast.error("网络请求失败，修改没有保存");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!projectId || deleting) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: "DELETE",
        headers: { "x-csrf-token": csrfToken },
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null;
        toast.error(data?.error?.message ?? "删除失败");
        return;
      }

      toast.success("项目已删除");
      router.replace(adminHref(adminPath, "/projects"));
      router.refresh();
    } catch {
      toast.error("网络请求失败，项目没有删除");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Link
            href={adminHref(adminPath, "/projects")}
            className="icon-btn size-8"
            aria-label="返回项目列表"
          >
            <ArrowLeft size={17} />
          </Link>
          <div>
            <p className="text-[0.6rem] uppercase tracking-[0.16em] text-muted">
              {mode === "create" ? "New project" : "Edit project"}
            </p>
            <h1 className="text-[1.1rem] font-semibold text-ink">
              {mode === "create" ? "新建项目" : form.title || "编辑项目"}
            </h1>
          </div>
          {dirty ? (
            <span className="chip border-warning/30 bg-warning-soft text-warning">未保存</span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {projectId ? (
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
            {mode === "create" ? "创建项目" : "保存修改"}
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="card-surface space-y-4 p-5">
          <div>
            <label htmlFor="project-title" className="field-label">
              项目名称
            </label>
            <input
              id="project-title"
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              maxLength={80}
              className="input"
              placeholder="例如：fateway.cn 个人站"
              aria-invalid={Boolean(errors.title)}
            />
            {errors.title ? <p className="field-error">{errors.title}</p> : null}
          </div>

          <div>
            <label htmlFor="project-description" className="field-label">
              项目简介
            </label>
            <textarea
              id="project-description"
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              maxLength={500}
              rows={4}
              className="textarea"
              placeholder="一两句话说明项目解决了什么问题"
            />
            <div className="mt-1 flex justify-between">
              {errors.description ? (
                <p className="field-error mt-0">{errors.description}</p>
              ) : (
                <span />
              )}
              <span className="text-[0.62rem] text-muted">{form.description.length}/500</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="project-category" className="field-label">
                项目类别
              </label>
              <input
                id="project-category"
                value={form.category}
                onChange={(event) => update("category", event.target.value)}
                maxLength={40}
                className="input"
                placeholder="网站 / 工具 / 实验"
              />
              {errors.category ? <p className="field-error">{errors.category}</p> : null}
            </div>
            <div>
              <label htmlFor="project-sort" className="field-label">
                排序
              </label>
              <input
                id="project-sort"
                type="number"
                min={-999}
                max={999}
                value={form.sortOrder}
                onChange={(event) => update("sortOrder", event.target.value)}
                className="input"
              />
              {errors.sortOrder ? <p className="field-error">{errors.sortOrder}</p> : null}
            </div>
          </div>

          <div>
            <label htmlFor="project-tech" className="field-label">
              技术标签
            </label>
            <input
              id="project-tech"
              value={form.techText}
              onChange={(event) => update("techText", event.target.value)}
              maxLength={200}
              className="input"
              placeholder="Next.js, TypeScript, SQLite"
            />
            {errors.tech ? <p className="field-error">{errors.tech}</p> : null}
            <p className="mt-1.5 text-[0.64rem] text-muted">使用逗号分隔，最多 10 个。</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="project-demo" className="field-label">
                演示地址
              </label>
              <input
                id="project-demo"
                type="url"
                value={form.demoUrl}
                onChange={(event) => update("demoUrl", event.target.value)}
                className="input"
                placeholder="https://example.com"
              />
              {errors.demoUrl ? <p className="field-error">{errors.demoUrl}</p> : null}
            </div>
            <div>
              <label htmlFor="project-repo" className="field-label">
                代码仓库
              </label>
              <input
                id="project-repo"
                type="url"
                value={form.repoUrl}
                onChange={(event) => update("repoUrl", event.target.value)}
                className="input"
                placeholder="https://github.com/…"
              />
              {errors.repoUrl ? <p className="field-error">{errors.repoUrl}</p> : null}
            </div>
          </div>
          <p className="text-[0.66rem] leading-relaxed text-muted">
            留空的链接不会在前台显示，避免出现无效按钮。
          </p>
        </div>

        <div className="space-y-4">
          <div className="card-surface p-4">
            <ImageUploader
              value={form.coverImage}
              onChange={(value) => update("coverImage", value)}
              label="项目封面"
              maxMb={maxMb}
              aspect="aspect-[16/10]"
            />
            {errors.coverImage ? <p className="field-error">{errors.coverImage}</p> : null}
          </div>

          <div className="card-surface p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={form.visible}
                onChange={(event) => update("visible", event.target.checked)}
                className="mt-0.5 size-4 rounded border-line-strong accent-[var(--accent)]"
              />
              <span>
                <span className="block text-[0.82rem] font-medium text-ink">在项目页公开展示</span>
                <span className="mt-0.5 block text-[0.66rem] leading-relaxed text-muted">
                  取消勾选后，项目只在后台可见，不会出现在首页和项目页。
                </span>
              </span>
            </label>
          </div>

          <div className={cn("rounded-[14px] border border-line bg-bg-subtle/50 p-3.5 text-[0.66rem] leading-relaxed text-muted")}>
            链接只接受完整的 http(s) 地址；封面会压缩为 WebP 并保存在媒体目录。
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="删除这个项目？"
        description={`「${form.title || "未命名项目"}」将从项目展示区移除，此操作无法撤销。`}
        confirmLabel="永久删除"
        loading={deleting}
        onConfirm={remove}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}
