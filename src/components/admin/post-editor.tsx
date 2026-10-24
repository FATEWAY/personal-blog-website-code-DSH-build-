"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArticleContent } from "@/components/site/article-content";
import { ImageUploader } from "@/components/admin/image-uploader";
import { StatusBadge } from "@/components/admin/status-badge";
import { useAdminSession } from "@/components/admin/admin-session";
import { useToast } from "@/components/ui/toast";
import {
  ArrowLeft,
  Check,
  Eye,
  ImageIcon,
  Loader,
  Save,
  Send,
} from "@/components/ui/icons";
import { fromDateTimeLocalValue, formatDateTime, toDateTimeLocalValue } from "@/lib/date";
import { adminHref } from "@/lib/route-path";
import type { PostStatus } from "@/lib/types";
import { calculateReadingMinutes, cn, fallbackSlug, slugify } from "@/lib/utils";

export type PostEditorInitial = {
  id: string | null;
  title: string;
  slug: string;
  summary: string;
  content: string;
  coverImage: string | null;
  category: string;
  tags: string[];
  status: PostStatus;
  publishedAt: string | null;
  updatedAt: string | null;
};

type SavedPostResponse = {
  id: string;
  slug: string;
  status: PostStatus;
  publishedAt: string | null;
  updatedAt: string;
  tags: { name: string }[];
};

type FormState = {
  title: string;
  slug: string;
  summary: string;
  content: string;
  coverImage: string | null;
  category: string;
  tagsText: string;
  publishedAtLocal: string;
};

export function PostEditor({
  mode,
  initial,
  maxMb,
}: {
  mode: "create" | "edit";
  initial: PostEditorInitial;
  maxMb: number;
}) {
  const { csrfToken, adminPath } = useAdminSession();
  const router = useRouter();
  const toast = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentImageInput = useRef<HTMLInputElement>(null);
  const slugTouched = useRef(mode === "edit");
  const saveRef = useRef<(mode: "draft" | "publish") => void>(() => {});

  const [form, setForm] = useState<FormState>({
    title: initial.title,
    slug: initial.slug,
    summary: initial.summary,
    content: initial.content,
    coverImage: initial.coverImage,
    category: initial.category,
    tagsText: initial.tags.join(", "),
    publishedAtLocal: toDateTimeLocalValue(initial.publishedAt),
  });
  const [postId, setPostId] = useState(initial.id);
  const [status, setStatus] = useState<PostStatus>(initial.status);
  const [updatedAt, setUpdatedAt] = useState(initial.updatedAt);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState<"draft" | "publish" | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setErrors((current) => {
      if (!current[key as string]) return current;
      const next = { ...current };
      delete next[key as string];
      return next;
    });
  }

  function onTitleChange(value: string) {
    setForm((current) => ({
      ...current,
      title: value,
      slug: slugTouched.current ? current.slug : slugify(value),
    }));
    setDirty(true);
    setErrors((current) => {
      if (!current.title) return current;
      const next = { ...current };
      delete next.title;
      return next;
    });
  }

  function insertSnippet(prefix: string, suffix = "", placeholder = "") {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? form.content.length;
    const end = textarea.selectionEnd ?? start;
    const selected = form.content.slice(start, end) || placeholder;
    const next = `${form.content.slice(0, start)}${prefix}${selected}${suffix}${form.content.slice(end)}`;

    update("content", next);
    const caretStart = start + prefix.length;
    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(caretStart, caretStart + selected.length);
    });
  }

  const scheduledDate = form.publishedAtLocal
    ? fromDateTimeLocalValue(form.publishedAtLocal)
    : null;
  const scheduled = status === "published" && scheduledDate
    ? new Date(scheduledDate).getTime() > Date.now()
    : false;

  async function save(nextMode: "draft" | "publish") {
    if (saving) return;

    let slug = form.slug.trim().toLowerCase();
    if (!slug) {
      slug = fallbackSlug("post");
      setForm((current) => ({ ...current, slug }));
    }

    const nextStatus: PostStatus = nextMode === "publish" ? "published" : "draft";
    let publishedAt = form.publishedAtLocal
      ? fromDateTimeLocalValue(form.publishedAtLocal)
      : null;
    if (nextMode === "publish" && !publishedAt) {
      publishedAt = new Date().toISOString();
      setForm((current) => ({
        ...current,
        publishedAtLocal: toDateTimeLocalValue(publishedAt),
      }));
    }

    const tags = form.tagsText
      .split(/[,，]/)
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 8);

    setSaving(nextMode);
    setErrors({});

    try {
      const payload = {
        title: form.title,
        slug,
        summary: form.summary,
        content: form.content,
        coverImage: form.coverImage,
        category: form.category,
        tags,
        status: nextStatus,
        publishedAt,
        expectedUpdatedAt: updatedAt,
      };

      const response = await fetch(postId ? `/api/admin/posts/${postId}` : "/api/admin/posts", {
        method: postId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        toast.error("登录状态已失效，请重新登录");
        router.replace(adminHref(adminPath, "/login"));
        return;
      }

      const data = (await response.json().catch(() => null)) as
        | {
            post?: SavedPostResponse;
            error?: {
              message?: string;
              code?: string;
              fields?: Record<string, string>;
              details?: Record<string, unknown>;
            };
          }
        | null;

      if (!response.ok || !data?.post) {
        const fields =
          data?.error?.fields ??
          (data?.error?.details && typeof data.error.details === "object"
            ? (data.error.details as Record<string, string>)
            : undefined);

        if (fields) {
          const nextErrors: Record<string, string> = {};
          for (const [key, value] of Object.entries(fields)) {
            if (typeof value === "string") nextErrors[key] = value;
          }
          setErrors(nextErrors);
        }

        toast.error(data?.error?.message ?? "保存失败，请稍后重试");
        return;
      }

      const saved = data.post;
      setPostId(saved.id);
      setStatus(saved.status);
      setUpdatedAt(saved.updatedAt);
      setForm((current) => ({
        ...current,
        slug: saved.slug,
        publishedAtLocal: toDateTimeLocalValue(saved.publishedAt),
        tagsText: saved.tags.map((tag) => tag.name).join(", "),
      }));
      setDirty(false);
      toast.success(nextMode === "publish" ? "文章已发布" : "草稿已保存");

      if (!postId) {
        router.replace(adminHref(adminPath, `/posts/${saved.id}`));
        router.refresh();
      }
    } catch {
      toast.error("网络请求失败，修改没有保存");
    } finally {
      setSaving(null);
    }
  }

  saveRef.current = save;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveRef.current("draft");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  useEffect(() => {
    if (!form.content.trim()) {
      setPreviewHtml("");
      setPreviewLoading(false);
      setPreviewError("");
      return;
    }

    const controller = new AbortController();
    setPreviewLoading(true);
    setPreviewError("");

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/admin/preview", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfToken,
          },
          body: JSON.stringify({ content: form.content }),
          signal: controller.signal,
        });

        if (response.status === 401) {
          setPreviewError("登录状态已失效，请刷新页面重新登录");
          return;
        }
        if (!response.ok) throw new Error("preview failed");

        const data = (await response.json()) as { html?: string };
        setPreviewHtml(typeof data.html === "string" ? data.html : "");
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setPreviewError("预览渲染失败，请稍后重试");
        }
      } finally {
        if (!controller.signal.aborted) setPreviewLoading(false);
      }
    }, 550);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [form.content, csrfToken]);

  async function uploadContentImage(file: File | undefined) {
    if (!file) return;
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "x-csrf-token": csrfToken },
        body,
      });
      const data = (await response.json().catch(() => null)) as
        | { url?: string; error?: { message?: string } }
        | null;

      if (!response.ok || !data?.url) {
        toast.error(data?.error?.message ?? "图片上传失败");
        return;
      }

      insertSnippet(`\n![图片描述](${data.url})\n`);
      toast.success("图片已插入正文");
    } catch {
      toast.error("网络请求失败，图片没有上传");
    } finally {
      if (contentImageInput.current) contentImageInput.current.value = "";
    }
  }

  const previewHref = postId ? adminHref(adminPath, `/posts/${postId}/preview`) : null;
  const showUnsaved = dirty || (!postId && form.content.length > 0);

  return (
    <div className="pb-16">
      <div className="sticky top-14 z-20 -mx-4 mb-6 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Link
              href={adminHref(adminPath, "/posts")}
              className="icon-btn size-8 flex-none"
              aria-label="返回文章列表"
            >
              <ArrowLeft size={17} />
            </Link>
            <div className="min-w-0">
              <p className="text-[0.6rem] uppercase tracking-[0.16em] text-muted">
                {mode === "create" ? "New post" : "Edit post"}
              </p>
              <p className="truncate text-[0.82rem] font-medium text-ink">
                {form.title.trim() || "无标题文章"}
              </p>
            </div>
            {showUnsaved ? (
              <span className="chip border-warning/30 bg-warning-soft text-warning">未保存</span>
            ) : (
              <span className="chip text-muted">
                <Check size={11} />
                已保存
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {previewHref ? (
              <a
                href={previewHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm"
              >
                <Eye size={14} />
                预览
              </a>
            ) : null}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => save("draft")}
              disabled={saving !== null}
            >
              {saving === "draft" ? <Loader size={14} /> : <Save size={14} />}
              {status === "published" ? "转为草稿" : "保存草稿"}
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => save("publish")}
              disabled={saving !== null}
            >
              {saving === "publish" ? <Loader size={14} /> : <Send size={14} />}
              {status === "published" ? "保存并更新" : "发布文章"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18.5rem]">
        <div className="min-w-0 space-y-4">
          <div className="overflow-hidden rounded-[18px] border border-line bg-card shadow-[var(--shadow-sm)]">
            <div className="border-b border-line p-4 sm:p-5">
              <label htmlFor="post-title" className="sr-only">
                文章标题
              </label>
              <input
                id="post-title"
                value={form.title}
                onChange={(event) => onTitleChange(event.target.value)}
                placeholder="文章标题"
                maxLength={160}
                aria-invalid={Boolean(errors.title)}
                className="w-full bg-transparent text-[1.45rem] font-semibold leading-tight tracking-[-0.02em] text-ink outline-none placeholder:text-muted/50 sm:text-[1.6rem]"
              />
              {errors.title ? <p className="field-error">{errors.title}</p> : null}

              <label htmlFor="post-summary" className="mt-4 block text-[0.66rem] uppercase tracking-[0.14em] text-muted">
                摘要
              </label>
              <textarea
                id="post-summary"
                value={form.summary}
                onChange={(event) => update("summary", event.target.value)}
                placeholder="一句话说明这篇文章讲什么（可选，留空时自动截取正文）"
                rows={2}
                maxLength={300}
                className="mt-1.5 w-full resize-none bg-transparent text-[0.85rem] leading-relaxed text-ink-soft outline-none placeholder:text-muted/60"
              />
              <div className="mt-1 flex items-center justify-between">
                {errors.summary ? (
                  <p className="field-error mt-0">{errors.summary}</p>
                ) : (
                  <span />
                )}
                <span className="text-[0.62rem] text-muted">{form.summary.length}/300</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-line px-3 py-2">
              <div className="flex items-center gap-1 rounded-lg bg-bg-subtle p-0.5">
                <button
                  type="button"
                  onClick={() => setTab("edit")}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[0.72rem] transition-colors",
                    tab === "edit" ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink",
                  )}
                >
                  编辑
                </button>
                <button
                  type="button"
                  onClick={() => setTab("preview")}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2.5 py-1 text-[0.72rem] transition-colors",
                    tab === "preview" ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink",
                  )}
                >
                  预览
                  {previewLoading ? <Loader size={10} /> : null}
                </button>
              </div>
              <span className="pr-1 text-[0.64rem] text-muted">
                {form.content.length} 字符 · 约 {calculateReadingMinutes(form.content)} 分钟
              </span>
            </div>

            {tab === "edit" ? (
              <div>
                <div className="flex flex-wrap items-center gap-0.5 border-b border-line px-2.5 py-1.5">
                  {[
                    { label: "B", title: "粗体", action: () => insertSnippet("**", "**", "粗体") },
                    { label: "I", title: "斜体", action: () => insertSnippet("*", "*", "斜体") },
                    {
                      label: "H2",
                      title: "二级标题",
                      action: () => insertSnippet("\n## ", "\n", "小标题"),
                    },
                    {
                      label: "链接",
                      title: "插入链接",
                      action: () => insertSnippet("[", "](https://example.com)", "链接文字"),
                    },
                    {
                      label: "</>",
                      title: "行内代码",
                      action: () => insertSnippet("`", "`", "code"),
                    },
                    {
                      label: "```",
                      title: "代码块",
                      action: () => insertSnippet("```\n", "\n```", "code"),
                    },
                    { label: "❝", title: "引用", action: () => insertSnippet("\n> ", "\n") },
                    { label: "•", title: "无序列表", action: () => insertSnippet("\n- ", "\n") },
                    { label: "1.", title: "有序列表", action: () => insertSnippet("\n1. ", "\n") },
                  ].map((tool) => (
                    <button
                      key={tool.label}
                      type="button"
                      onClick={tool.action}
                      title={tool.title}
                      aria-label={tool.title}
                      className="rounded-md px-2 py-1 font-mono text-[0.72rem] text-muted transition-colors hover:bg-bg-subtle hover:text-ink"
                    >
                      {tool.label}
                    </button>
                  ))}
                  <span className="mx-1 h-4 w-px bg-line" aria-hidden="true" />
                  <button
                    type="button"
                    onClick={() => contentImageInput.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[0.72rem] text-muted transition-colors hover:bg-bg-subtle hover:text-ink"
                  >
                    <ImageIcon size={13} />
                    图片
                  </button>
                  <span className="ml-auto hidden pr-1 text-[0.62rem] text-muted sm:block">
                    Markdown · Ctrl/⌘ S 保存草稿
                  </span>
                </div>

                <label htmlFor="post-content" className="sr-only">
                  文章正文（Markdown）
                </label>
                <textarea
                  id="post-content"
                  ref={textareaRef}
                  value={form.content}
                  onChange={(event) => update("content", event.target.value)}
                  placeholder={"用 Markdown 写正文…\n\n## 从这里开始\n\n支持标题、列表、表格、引用和代码块。"}
                  spellCheck={false}
                  className="min-h-[54vh] w-full resize-y bg-transparent p-4 font-mono text-[0.82rem] leading-[1.75] text-ink outline-none placeholder:text-muted/50 sm:p-5"
                />
                {errors.content ? <p className="field-error px-4 pb-3">{errors.content}</p> : null}
                <input
                  ref={contentImageInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  tabIndex={-1}
                  onChange={(event) => uploadContentImage(event.target.files?.[0])}
                />
              </div>
            ) : (
              <div className="min-h-[54vh] p-5 sm:p-7">
                {previewError ? (
                  <p className="py-10 text-center text-sm text-danger" role="alert">
                    {previewError}
                  </p>
                ) : previewLoading && !previewHtml ? (
                  <div className="animate-pulse space-y-3" aria-label="正在生成预览">
                    <div className="h-5 w-2/3 rounded bg-bg-subtle" />
                    <div className="h-3 w-full rounded bg-bg-subtle" />
                    <div className="h-3 w-11/12 rounded bg-bg-subtle" />
                    <div className="h-3 w-4/5 rounded bg-bg-subtle" />
                  </div>
                ) : previewHtml ? (
                  <ArticleContent html={previewHtml} />
                ) : (
                  <div className="flex min-h-[40vh] flex-col items-center justify-center text-center text-muted">
                    <span className="flex size-10 items-center justify-center rounded-full bg-bg-subtle">
                      <Eye size={17} />
                    </span>
                    <p className="mt-3 text-sm">开始输入正文后，这里会显示实时预览。</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card-surface p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[0.85rem] font-semibold text-ink">发布设置</h2>
              <StatusBadge status={status} scheduled={scheduled} />
            </div>

            <div className="mt-4">
              <label htmlFor="post-slug" className="field-label text-[0.72rem]">
                路径（slug）
              </label>
              <div className="flex items-center overflow-hidden rounded-[10px] border border-line-strong bg-card focus-within:border-accent focus-within:ring-2 focus-within:ring-accent-soft">
                <span className="border-r border-line bg-bg-subtle px-2.5 py-2 font-mono text-[0.68rem] text-muted">
                  /blog/
                </span>
                <input
                  id="post-slug"
                  value={form.slug}
                  onChange={(event) => {
                    slugTouched.current = true;
                    update("slug", event.target.value.toLowerCase());
                  }}
                  placeholder="post-slug"
                  maxLength={80}
                  spellCheck={false}
                  aria-invalid={Boolean(errors.slug)}
                  className="min-w-0 flex-1 bg-transparent px-2 py-2 font-mono text-[0.72rem] text-ink outline-none placeholder:text-muted/60"
                />
              </div>
              {errors.slug ? <p className="field-error">{errors.slug}</p> : null}
              <p className="mt-1.5 text-[0.64rem] leading-relaxed text-muted">
                中文标题不会自动生成可读路径，请填写英文 slug；修改后旧链接会失效。
              </p>
            </div>

            <div className="mt-4">
              <label htmlFor="post-category" className="field-label text-[0.72rem]">
                分类
              </label>
              <input
                id="post-category"
                value={form.category}
                onChange={(event) => update("category", event.target.value)}
                placeholder="例如：工程实践"
                maxLength={40}
                className="input py-1.5 text-[0.8rem]"
              />
              {errors.category ? <p className="field-error">{errors.category}</p> : null}
              <p className="mt-1.5 text-[0.64rem] text-muted">输入新名称会自动创建分类。</p>
            </div>

            <div className="mt-4">
              <label htmlFor="post-tags" className="field-label text-[0.72rem]">
                标签
              </label>
              <input
                id="post-tags"
                value={form.tagsText}
                onChange={(event) => update("tagsText", event.target.value)}
                placeholder="SQLite, 性能, 实践"
                maxLength={200}
                className="input py-1.5 text-[0.8rem]"
              />
              {errors.tags ? <p className="field-error">{errors.tags}</p> : null}
              <p className="mt-1.5 text-[0.64rem] text-muted">使用逗号分隔，最多 8 个。</p>
            </div>

            <div className="mt-4">
              <label htmlFor="post-published-at" className="field-label text-[0.72rem]">
                发布时间
              </label>
              <input
                id="post-published-at"
                type="datetime-local"
                value={form.publishedAtLocal}
                onChange={(event) => update("publishedAtLocal", event.target.value)}
                className="input py-1.5 text-[0.78rem]"
              />
              {errors.publishedAt ? <p className="field-error">{errors.publishedAt}</p> : null}
              <p className="mt-1.5 text-[0.64rem] leading-relaxed text-muted">
                按北京时间显示。留空时在发布时使用当前时间；未来时间会定时公开。
              </p>
            </div>

            <div className="mt-4">
              <ImageUploader
                value={form.coverImage}
                onChange={(value) => update("coverImage", value)}
                label="封面图片"
                maxMb={maxMb}
              />
              {errors.coverImage ? <p className="field-error">{errors.coverImage}</p> : null}
            </div>

            {updatedAt ? (
              <p className="mt-4 border-t border-line pt-3 font-mono text-[0.62rem] text-muted">
                最近保存：{formatDateTime(updatedAt)}
              </p>
            ) : null}
          </div>

          <div className="rounded-[14px] border border-line bg-bg-subtle/50 p-3.5 text-[0.66rem] leading-relaxed text-muted">
            <p className="font-medium text-ink-soft">写作提示</p>
            <ul className="mt-2 space-y-1.5">
              <li>· 保存草稿不会公开文章，可稍后继续编辑。</li>
              <li>· 发布后会立即出现在博客列表、RSS 与站点地图。</li>
              <li>· 图片会自动压缩为 WebP 并保存在媒体目录。</li>
              <li>· 在另一个窗口修改同一篇文章时，保存会提示冲突。</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
