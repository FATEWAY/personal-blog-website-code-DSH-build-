import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleContent } from "@/components/site/article-content";
import { ReadingProgress } from "@/components/site/reading-progress";
import { TableOfContents } from "@/components/site/table-of-contents";
import { ArrowLeft, ArrowRight, ChevronRight, Clock, Rss } from "@/components/ui/icons";
import { config } from "@/lib/config";
import { formatDate, formatDateDot } from "@/lib/date";
import { getAdjacentPosts, getPublishedPostBySlug } from "@/lib/db/posts";
import { renderMarkdown } from "@/lib/markdown/render";
import { getSiteConfig } from "@/lib/site-data";
import { getInitials } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPublishedPostBySlug(slug);

  if (!post) {
    return {
      title: "文章不存在",
      robots: { index: false, follow: false },
    };
  }

  const image = post.coverImage ?? "/og.png";

  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      url: `/blog/${post.slug}`,
      title: post.title,
      description: post.summary,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      tags: post.tags.map((tag) => tag.name),
      images: [{ url: image, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary,
      images: [image],
    },
    robots: { index: true, follow: true },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPublishedPostBySlug(slug);
  if (!post) notFound();

  const settings = getSiteConfig();
  const { html, headings } = await renderMarkdown(post.content);
  const adjacent = getAdjacentPosts(post);
  const hasUpdate = Boolean(
    post.publishedAt && post.updatedAt.slice(0, 10) !== post.publishedAt.slice(0, 10),
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { "@type": "Person", name: settings.profile.name },
    publisher: { "@type": "Organization", name: settings.siteName },
    mainEntityOfPage: `${config.siteUrl}/blog/${post.slug}`,
    image: post.coverImage
      ? new URL(post.coverImage, config.siteUrl).toString()
      : `${config.siteUrl}/og.png`,
    keywords: post.tags.map((tag) => tag.name).join(","),
    inLanguage: "zh-CN",
  };

  return (
    <>
      <ReadingProgress />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <div className="container-page pb-4 pt-8 sm:pt-10">
        <nav aria-label="面包屑" className="flex items-center gap-2 text-xs text-muted">
          <Link href="/blog" className="transition-colors hover:text-ink">
            博客
          </Link>
          <ChevronRight size={12} />
          {post.category ? (
            <Link
              href={`/blog?category=${post.category.slug}`}
              className="transition-colors hover:text-ink"
            >
              {post.category.name}
            </Link>
          ) : (
            <span>文章</span>
          )}
        </nav>

        <article className="mx-auto mt-7 max-w-5xl">
          <header className="mx-auto max-w-3xl">
            <h1 className="text-balance text-[2rem] font-semibold leading-[1.16] tracking-[-0.03em] text-ink sm:text-[2.55rem]">
              {post.title}
            </h1>
            {post.summary ? (
              <p className="mt-5 text-[1rem] leading-relaxed text-muted sm:text-[1.05rem]">
                {post.summary}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-5 text-[0.75rem] text-muted">
              <span className="flex items-center gap-2 text-ink-soft">
                {settings.avatarUrl ? (
                  <Image
                    src={settings.avatarUrl}
                    alt=""
                    width={24}
                    height={24}
                    className="size-6 rounded-full border border-line object-cover"
                  />
                ) : (
                  <span className="avatar-monogram size-6 text-[0.6rem]" aria-hidden="true">
                    {getInitials(settings.profile.name)}
                  </span>
                )}
                {settings.profile.name}
              </span>
              <span className="size-[3px] rounded-full bg-line-strong" aria-hidden="true" />
              <time dateTime={post.publishedAt ?? undefined}>{formatDate(post.publishedAt)}</time>
              <span className="size-[3px] rounded-full bg-line-strong" aria-hidden="true" />
              <span className="inline-flex items-center gap-1">
                <Clock size={12} />
                {post.readingMinutes} 分钟阅读
              </span>
              {hasUpdate ? (
                <>
                  <span
                    className="hidden size-[3px] rounded-full bg-line-strong sm:block"
                    aria-hidden="true"
                  />
                  <span className="w-full sm:w-auto">更新于 {formatDateDot(post.updatedAt)}</span>
                </>
              ) : null}
            </div>
          </header>

          {post.coverImage ? (
            <div className="relative mt-8 aspect-[16/8] overflow-hidden rounded-[20px] border border-line bg-bg-subtle">
              <Image
                src={post.coverImage}
                alt={`${post.title} 封面`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 960px"
                className="object-cover"
              />
            </div>
          ) : null}

          <div className="mx-auto mt-12 grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,1fr)_13rem] lg:gap-14">
            <div className="mx-auto min-w-0 w-full max-w-[46rem]">
              <details className="mb-8 rounded-xl border border-line bg-card p-4 lg:hidden">
                <summary className="cursor-pointer text-sm font-medium text-ink">文章目录</summary>
                <TableOfContents headings={headings} className="mt-4" />
              </details>

              <ArticleContent html={html} />

              {post.tags.length > 0 ? (
                <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-line pt-6">
                  <span className="mr-1 text-[0.68rem] uppercase tracking-[0.14em] text-muted">
                    标签
                  </span>
                  {post.tags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/blog?tag=${tag.slug}`}
                      className="chip transition-colors hover:border-line-strong hover:text-ink"
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              ) : null}

              <nav className="mt-10 grid gap-3 border-t border-line pt-8 sm:grid-cols-2" aria-label="相邻文章">
                {adjacent.previous ? (
                  <Link
                    href={`/blog/${adjacent.previous.slug}`}
                    className="group rounded-[14px] border border-line bg-card p-4 transition-colors hover:border-line-strong"
                  >
                    <span className="flex items-center gap-1.5 text-[0.68rem] text-muted">
                      <ArrowLeft size={12} />
                      上一篇
                    </span>
                    <span className="mt-2 line-clamp-2 block text-[0.88rem] font-medium text-ink transition-colors group-hover:text-accent-strong">
                      {adjacent.previous.title}
                    </span>
                  </Link>
                ) : (
                  <div className="hidden sm:block" />
                )}

                {adjacent.next ? (
                  <Link
                    href={`/blog/${adjacent.next.slug}`}
                    className="group rounded-[14px] border border-line bg-card p-4 text-right transition-colors hover:border-line-strong"
                  >
                    <span className="flex items-center justify-end gap-1.5 text-[0.68rem] text-muted">
                      下一篇
                      <ArrowRight size={12} />
                    </span>
                    <span className="mt-2 line-clamp-2 block text-[0.88rem] font-medium text-ink transition-colors group-hover:text-accent-strong">
                      {adjacent.next.title}
                    </span>
                  </Link>
                ) : null}
              </nav>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-1.5 text-ink-soft transition-colors hover:text-ink"
                >
                  <ArrowLeft size={14} />
                  返回文章列表
                </Link>
                <Link
                  href="/subscribe"
                  className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-ink"
                >
                  <Rss size={14} />
                  RSS 订阅
                </Link>
              </div>
            </div>

            <aside className="hidden lg:block">
              <div className="sticky top-[calc(var(--header-height)+2rem)]">
                <TableOfContents headings={headings} />
                <div className="mt-6 border-t border-line pt-4 text-[0.7rem] leading-relaxed text-muted">
                  <p>
                    发布于 {formatDateDot(post.publishedAt)}
                    {hasUpdate ? `，更新于 ${formatDateDot(post.updatedAt)}` : ""}
                  </p>
                  <p className="mt-1.5">约 {post.readingMinutes} 分钟阅读</p>
                </div>
              </div>
            </aside>
          </div>
        </article>
      </div>
    </>
  );
}
