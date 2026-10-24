import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/site/empty-state";
import { Pagination } from "@/components/site/pagination";
import { ArrowRight, FileText, Search, Tag as TagIcon } from "@/components/ui/icons";
import { formatDateDot } from "@/lib/date";
import { listCategoriesWithCounts, listPublishedPosts, listTagsWithCounts } from "@/lib/db/posts";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

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

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const query = first(params.q).trim();
  return {
    title: query ? `搜索：${query}` : "博客",
    description: "关于工程实践、系统设计与开发工具的技术笔记。",
    alternates: { canonical: "/blog" },
    robots: query ? { index: false, follow: true } : undefined,
  };
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const query = first(params.q).trim();
  const category = first(params.category).trim();
  const tag = first(params.tag).trim();
  const requestedPage = Number.parseInt(first(params.page), 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const result = listPublishedPosts({
    page,
    pageSize: 9,
    query,
    category: category || undefined,
    tag: tag || undefined,
  });
  const categories = listCategoriesWithCounts();
  const tags = listTagsWithCounts().slice(0, 12);
  const totalPublished = listPublishedPosts({ pageSize: 1 }).total;
  const activeCategory = categories.find((item) => item.slug === category);
  const activeTag = tags.find((item) => item.slug === tag);
  const hasFilters = Boolean(query || category || tag);

  return (
    <div className="container-page pb-4 pt-14 sm:pt-20">
      <header className="max-w-2xl">
        <p className="eyebrow">
          <span className="eyebrow-dot" aria-hidden="true" />
          Writing
        </p>
        <h1 className="mt-4 text-[2.5rem] font-semibold leading-[1.1] tracking-[-0.035em] text-ink sm:text-[3rem]">
          博客
        </h1>
        <p className="mt-4 text-[0.98rem] leading-relaxed text-ink-soft">
          关于软件工程、系统设计与开发工具的记录。共 {totalPublished} 篇已发布文章。
        </p>
      </header>

      <form
        key={query}
        action="/blog"
        method="get"
        role="search"
        className="mt-8 flex max-w-2xl flex-col gap-2 sm:flex-row"
      >
        {category ? <input type="hidden" name="category" value={category} /> : null}
        {tag ? <input type="hidden" name="tag" value={tag} /> : null}
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="搜索标题、摘要或正文…"
            aria-label="搜索文章"
            className="input pl-9"
          />
        </div>
        <button type="submit" className="btn btn-primary">
          搜索
        </button>
        {hasFilters ? (
          <Link href="/blog" className="btn btn-ghost">
            清除
          </Link>
        ) : null}
      </form>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Link
          href={`/blog${query ? `?${buildQuery({ q: query })}` : ""}`}
          className={cn("chip transition-colors", !category && "chip-accent")}
        >
          全部
        </Link>
        {categories.map((item) => (
          <Link
            key={item.id}
            href={`/blog?${buildQuery({ q: query || undefined, category: item.slug })}`}
            className={cn(
              "chip transition-colors hover:border-line-strong hover:text-ink",
              category === item.slug && "chip-accent",
            )}
          >
            {item.name}
            <span className="font-mono text-[0.62rem] opacity-70">{item.count}</span>
          </Link>
        ))}
      </div>

      {tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[0.72rem] text-muted">
          <TagIcon size={13} />
          <span className="mr-0.5">标签</span>
          {tags.map((item) => (
            <Link
              key={item.id}
              href={`/blog?${buildQuery({ q: query || undefined, tag: item.slug })}`}
              className={cn(
                "rounded px-1 py-0.5 transition-colors hover:text-ink",
                tag === item.slug && "bg-accent-soft text-accent-strong",
              )}
            >
              #{item.name}
            </Link>
          ))}
        </div>
      ) : null}

      {hasFilters ? (
        <div className="mt-8 flex flex-wrap items-center gap-2 text-[0.8rem] text-muted">
          <span>
            找到 <span className="font-medium text-ink">{result.total}</span> 篇文章
            {query ? `，关键词 “${query}”` : ""}
          </span>
          {activeCategory ? <span className="chip">分类：{activeCategory.name}</span> : null}
          {activeTag ? <span className="chip">标签：#{activeTag.name}</span> : null}
          <Link href="/blog" className="text-accent-strong hover:underline">
            清除全部
          </Link>
        </div>
      ) : null}

      {result.posts.length > 0 ? (
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {result.posts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/blog/${post.slug}`}
                className="group grid gap-3 py-7 transition-colors md:grid-cols-[9rem_1fr_auto] md:items-start md:gap-8 md:py-8"
              >
                <div className="flex items-center gap-3 text-[0.7rem] text-muted md:flex-col md:items-start md:gap-2">
                  <time dateTime={post.publishedAt ?? undefined} className="font-mono">
                    {formatDateDot(post.publishedAt)}
                  </time>
                  {post.category ? (
                    <>
                      <span className="hidden size-1 rounded-full bg-line-strong md:block" aria-hidden="true" />
                      <span className="text-ink-soft">{post.category.name}</span>
                    </>
                  ) : null}
                </div>

                <div className="min-w-0">
                  <h2 className="text-[1.1rem] font-semibold leading-snug tracking-[-0.01em] text-ink transition-colors group-hover:text-accent-strong sm:text-[1.2rem]">
                    {post.title}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-[0.87rem] leading-relaxed text-muted">
                    {post.summary}
                  </p>
                  <div className="mt-3.5 flex flex-wrap items-center gap-2">
                    {post.tags.slice(0, 3).map((tagItem) => (
                      <span key={tagItem.id} className="chip text-[0.66rem]">
                        {tagItem.name}
                      </span>
                    ))}
                    <span className="ml-1 text-[0.68rem] text-muted">{post.readingMinutes} 分钟阅读</span>
                  </div>
                </div>

                <div className="hidden items-center gap-2 self-center text-muted md:flex">
                  <span className="font-mono text-[0.66rem]">READ</span>
                  <ArrowRight
                    size={16}
                    className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-ink"
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-8">
          <EmptyState
            icon={<FileText size={20} />}
            title={hasFilters ? "没有找到相关文章" : "还没有发布文章"}
            description={
              hasFilters
                ? "试试更短的关键词、切换分类，或者清除全部筛选条件。"
                : "第一篇文章发布后会出现在这里。"
            }
            action={
              hasFilters
                ? { href: "/blog", label: "清除筛选条件" }
                : { href: "/about", label: "了解这个站点" }
            }
          />
        </div>
      )}

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        params={{ q: query || undefined, category: category || undefined, tag: tag || undefined }}
      />
    </div>
  );
}
