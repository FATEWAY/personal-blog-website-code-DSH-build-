import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleContent } from "@/components/site/article-content";
import { StatusBadge } from "@/components/admin/status-badge";
import { ArrowLeft } from "@/components/ui/icons";
import { config } from "@/lib/config";
import { formatDateTime } from "@/lib/date";
import { getAdminPost } from "@/lib/db/posts";
import { renderMarkdown } from "@/lib/markdown/render";
import { adminHref } from "@/lib/route-path";

type PageProps = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "文章预览",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminPreviewPage({ params }: PageProps) {
  const { id } = await params;
  const post = getAdminPost(id);
  if (!post) notFound();

  const rendered = await renderMarkdown(post.content);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-[0.72rem] text-warning">
        <span>管理员预览 · 此内容可能尚未发布，不会出现在公开页面中</span>
        <Link
          href={adminHref(config.adminPath, `/posts/${post.id}`)}
          className="inline-flex items-center gap-1.5 rounded-md bg-card/60 px-2 py-1 text-ink-soft transition-colors hover:text-ink"
        >
          <ArrowLeft size={12} />
          返回编辑
        </Link>
      </div>

      <header className="mt-8">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={post.status} />
          {post.category ? <span className="chip">{post.category.name}</span> : null}
          <span className="text-[0.7rem] text-muted">{post.readingMinutes} 分钟阅读</span>
        </div>
        <h1 className="mt-4 text-[2rem] font-semibold leading-[1.2] tracking-[-0.03em] text-ink sm:text-[2.4rem]">
          {post.title}
        </h1>
        {post.summary ? <p className="mt-4 text-[0.98rem] leading-relaxed text-muted">{post.summary}</p> : null}
        <p className="mt-4 font-mono text-[0.66rem] text-muted">
          /blog/{post.slug} · 更新于 {formatDateTime(post.updatedAt)}
        </p>
      </header>

      {post.coverImage ? (
        <div className="mt-6 overflow-hidden rounded-[18px] border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.coverImage} alt="" className="max-h-[420px] w-full object-cover" />
        </div>
      ) : null}

      <div className="mt-8 rounded-[18px] border border-line bg-card p-5 sm:p-8">
        {post.content.trim() ? (
          <ArticleContent html={rendered.html} />
        ) : (
          <p className="py-10 text-center text-sm text-muted">正文为空，编辑器里还没有内容。</p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <span key={tag.id} className="chip">
            #{tag.name}
          </span>
        ))}
      </div>
    </div>
  );
}
