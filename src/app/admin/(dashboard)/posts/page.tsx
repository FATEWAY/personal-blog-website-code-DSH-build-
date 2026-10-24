import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { PostActions } from "@/components/admin/post-actions";
import { EmptyState } from "@/components/site/empty-state";
import { Pagination } from "@/components/site/pagination";
import { FileText, Plus, Search } from "@/components/ui/icons";
import { config } from "@/lib/config";
import { formatDateTime } from "@/lib/date";
import { getDashboardStats, listAdminPosts } from "@/lib/db/posts";
import { adminHref } from "@/lib/route-path";
import type { PostStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "文章管理",
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function buildQuery(values: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value) search.set(key, value);
  }
  return search.toString();
}

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query = first(params.q).trim();
  const statusRaw = first(params.status);
  const status: PostStatus | "all" =
    statusRaw === "published" || statusRaw === "draft" ? statusRaw : "all";
  const requestedPage = Number.parseInt(first(params.page), 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const result = listAdminPosts({ query, status, page, pageSize: 20 });
  const stats = getDashboardStats();
  const now = Date.now();

  const tabs: Array<{ key: PostStatus | "all"; label: string; count: number }> = [
    { key: "all", label: "全部", count: stats.totalPosts },
    { key: "published", label: "已发布", count: stats.publishedPosts },
    { key: "draft", label: "草稿", count: stats.draftPosts },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Content"
        title="文章管理"
        description="创建、编辑、发布与下架文章。所有修改都会立即同步到前台。"
        actions={
          <Link
            href={adminHref(config.adminPath, "/posts/new")}
            className="btn btn-primary btn-sm"
          >
            <Plus size={15} />
            新建文章
          </Link>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {tabs.map((tab) => {
            const active = status === tab.key;
            const href = `${adminHref(config.adminPath, "/posts")}${
              buildQuery({
                q: query || undefined,
                status: tab.key === "all" ? undefined : tab.key,
              })
                ? `?${buildQuery({
                    q: query || undefined,
                    status: tab.key === "all" ? undefined : tab.key,
                  })}`
                : ""
            }`;
            return (
              <Link
                key={tab.key}
                href={href}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.78rem] transition-colors",
                  active
                    ? "bg-ink text-bg"
                    : "text-muted hover:bg-bg-subtle hover:text-ink",
                )}
              >
                {tab.label}
                <span className={cn("font-mono text-[0.62rem]", active ? "opacity-70" : "opacity-60")}>
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </div>

        <form
          key={`${query}-${status}`}
          action={adminHref(config.adminPath, "/posts")}
          method="get"
          role="search"
          className="flex items-center gap-2"
        >
          {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
          <div className="relative w-full sm:w-64">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="搜索标题或 slug"
              aria-label="搜索文章"
              className="input py-1.5 pl-8 text-[0.8rem]"
            />
          </div>
          <button type="submit" className="btn btn-secondary btn-sm">
            搜索
          </button>
        </form>
      </div>

      {result.posts.length > 0 ? (
        <div className="card-surface overflow-hidden">
          <div className="hidden border-b border-line bg-bg-subtle/50 px-5 py-2.5 text-[0.64rem] font-medium uppercase tracking-[0.12em] text-muted sm:grid sm:grid-cols-[minmax(0,1fr)_6rem_9.5rem_auto] sm:gap-4">
            <span>文章</span>
            <span>状态</span>
            <span>更新时间</span>
            <span className="text-right">操作</span>
          </div>
          <ul className="divide-y divide-line">
            {result.posts.map((post) => (
              <li
                key={post.id}
                className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-bg-subtle/30 sm:grid sm:grid-cols-[minmax(0,1fr)_6rem_9.5rem_auto] sm:items-center sm:gap-4 sm:px-5"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={adminHref(config.adminPath, `/posts/${post.id}`)}
                      className="truncate text-[0.88rem] font-medium text-ink transition-colors hover:text-accent-strong"
                    >
                      {post.title}
                    </Link>
                    <StatusBadge
                      status={post.status}
                      scheduled={
                        post.status === "published" &&
                        Boolean(post.publishedAt && new Date(post.publishedAt).getTime() > now)
                      }
                    />

                  </div>                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.66rem] text-muted">
                    <span className="font-mono">/blog/{post.slug}</span>
                    {post.category ? <span>{post.category.name}</span> : <span>未分类</span>}
                    <span>{post.readingMinutes} 分钟</span>
                  </div>
                </div>

                <div className="hidden sm:block">
                  <StatusBadge status={post.status} />
                </div>

                <div className="flex items-center justify-between gap-2 text-[0.7rem] text-muted sm:block">
                  <span className="sm:hidden">更新于</span>
                  <span>{formatDateTime(post.updatedAt)}</span>
                </div>

                <div className="flex justify-end">
                  <PostActions id={post.id} title={post.title} status={post.status} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <EmptyState
          icon={<FileText size={20} />}
          title={query || status !== "all" ? "没有匹配的文章" : "还没有文章"}
          description={
            query || status !== "all"
              ? "调整搜索关键词或切换状态筛选后再试。"
              : "创建第一篇文章，发布后会立刻出现在首页与博客列表。"
          }
          action={{
            href: adminHref(config.adminPath, "/posts/new"),
            label: "新建文章",
          }}
        />
      )}

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        basePath={adminHref(config.adminPath, "/posts")}
        params={{ q: query || undefined, status: status === "all" ? undefined : status }}
      />
    </div>
  );
}
