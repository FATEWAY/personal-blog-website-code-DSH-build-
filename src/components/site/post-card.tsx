import Image from "next/image";
import Link from "next/link";
import type { PostSummary } from "@/lib/types";
import { formatDateDot } from "@/lib/date";
import { cn } from "@/lib/utils";
import { ArrowRight, Clock } from "@/components/ui/icons";
import { CoverArt } from "./cover-art";

function Meta({ post, className }: { post: PostSummary; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.7rem] text-muted", className)}>
      {post.category ? <span className="text-ink-soft">{post.category.name}</span> : <span>文章</span>}
      <span className="size-[3px] rounded-full bg-line-strong" aria-hidden="true" />
      <time dateTime={post.publishedAt ?? undefined}>{formatDateDot(post.publishedAt)}</time>
      <span className="size-[3px] rounded-full bg-line-strong" aria-hidden="true" />
      <span className="inline-flex items-center gap-1">
        <Clock size={11} />
        {post.readingMinutes} 分钟
      </span>
    </div>
  );
}

export function PostCard({
  post,
  variant = "default",
}: {
  post: PostSummary;
  variant?: "default" | "featured" | "compact";
}) {
  if (variant === "compact") {
    return (
      <article className="group relative flex flex-1 flex-col justify-between rounded-[16px] border border-line bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[var(--shadow-md)]">
        <div>
          <Meta post={post} />
          <h3 className="mt-3 text-[1.02rem] font-semibold leading-snug tracking-[-0.01em] text-ink">
            <Link href={`/blog/${post.slug}`} className="transition-colors group-hover:text-accent-strong">
              <span className="absolute inset-0 z-10 rounded-[16px]" aria-hidden="true" />
              {post.title}
            </Link>
          </h3>
          <p className="mt-2 line-clamp-2 text-[0.84rem] leading-relaxed text-muted">{post.summary}</p>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {post.tags.slice(0, 2).map((tag) => (
              <span key={tag.id} className="chip text-[0.66rem]">
                {tag.name}
              </span>
            ))}
          </div>
          <ArrowRight
            size={15}
            className="text-muted transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-ink"
          />
        </div>
      </article>
    );
  }

  const featured = variant === "featured";

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[18px] border border-line bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[var(--shadow-md)]">
      <Link
        href={`/blog/${post.slug}`}
        className="relative block aspect-[16/9] overflow-hidden border-b border-line focus-visible:outline-none"
        tabIndex={-1}
        aria-hidden="true"
      >
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt=""
            fill
            sizes={featured ? "(max-width: 1024px) 100vw, 58vw" : "(max-width: 768px) 100vw, 33vw"}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <CoverArt title={post.title} category={post.category?.name} />
        )}
      </Link>

      <div className={cn("flex flex-1 flex-col p-5", featured && "md:p-6")}>
        <Meta post={post} />
        <h3
          className={cn(
            "mt-3 font-semibold tracking-[-0.015em] text-ink",
            featured ? "text-[1.35rem] leading-snug md:text-[1.5rem]" : "text-[1.1rem] leading-snug",
          )}
        >
          <Link href={`/blog/${post.slug}`} className="transition-colors hover:text-accent-strong">
            <span className="absolute inset-0 z-10" aria-hidden="true" />
            {post.title}
          </Link>
        </h3>
        <p
          className={cn(
            "mt-2.5 text-sm leading-relaxed text-muted",
            featured ? "line-clamp-3" : "line-clamp-2",
          )}
        >
          {post.summary}
        </p>
        <div className="mt-auto flex items-center justify-between pt-5">
          <div className="flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((tag) => (
              <span key={tag.id} className="chip text-[0.67rem]">
                {tag.name}
              </span>
            ))}
          </div>
          <ArrowRight
            size={16}
            className="shrink-0 text-muted transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-ink"
          />
        </div>
      </div>
    </article>
  );
}
