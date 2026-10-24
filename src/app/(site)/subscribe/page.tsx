import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Rss } from "@/components/ui/icons";
import { CopyFeedButton } from "@/components/site/copy-feed-button";
import { PostCard } from "@/components/site/post-card";
import { SectionHeading } from "@/components/site/section-heading";
import { config } from "@/lib/config";
import { listLatestPublished } from "@/lib/db/posts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "订阅",
  description: "通过 RSS 阅读器订阅 fateway.cn 的最新文章，无需注册账号。",
  alternates: { canonical: "/subscribe" },
};

const STEPS = [
  { title: "选择一个阅读器", body: "Feedly、Inoreader、NetNewsWire、Reeder 或 Thunderbird 都可以。" },
  { title: "粘贴订阅地址", body: "把下面的 RSS 地址添加到阅读器的新建订阅中。" },
  { title: "等待更新", body: "新文章发布后会自动出现在阅读器里，不需要再访问站点。" },
];

export default function SubscribePage() {
  const feedUrl = `${config.siteUrl}/rss.xml`;
  const latestPosts = listLatestPublished(3);

  return (
    <div className="container-page pb-4 pt-14 sm:pt-20">
      <header className="max-w-2xl">
        <p className="eyebrow">
          <span className="eyebrow-dot" aria-hidden="true" />
          Subscribe
        </p>
        <h1 className="mt-4 text-[2.5rem] font-semibold leading-[1.1] tracking-[-0.035em] text-ink sm:text-[3rem]">
          订阅更新
        </h1>
        <p className="mt-4 text-[0.98rem] leading-relaxed text-ink-soft">
          RSS 是一种不依赖算法和账号的订阅方式。把你的阅读器指向本站的 RSS
          地址，新文章就会自动出现。
        </p>
      </header>

      <div className="mt-10 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[20px] border border-line bg-card p-6 sm:p-8">
          <span className="flex size-11 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Rss size={20} />
          </span>
          <h2 className="mt-5 text-[1.1rem] font-semibold text-ink">RSS 订阅地址</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            这是一个 XML 文件，包含最近文章的标题、链接、摘要和发布时间。它供阅读器读取，不需要在浏览器里阅读。
          </p>

          <div className="mt-5 overflow-hidden rounded-xl border border-line bg-bg-subtle px-4 py-3">
            <p className="break-all font-mono text-[0.78rem] leading-relaxed text-ink-soft">
              {feedUrl}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <CopyFeedButton url={feedUrl} />
          </div>

          <p className="mt-4 text-[0.7rem] leading-relaxed text-muted">
            在浏览器中打开会显示带主题样式的预览页；RSS 阅读器会读取原始 XML。订阅不需要账号，也不会留下邮箱。
          </p>
        </section>

        <section className="rounded-[20px] border border-line bg-bg-subtle/50 p-6 sm:p-8">
          <h2 className="text-[1.05rem] font-semibold text-ink">怎么使用</h2>
          <ol className="mt-5 space-y-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex size-6 flex-none items-center justify-center rounded-full border border-line bg-card font-mono text-[0.65rem] text-muted">
                  {index + 1}
                </span>
                <div>
                  <p className="text-[0.85rem] font-medium text-ink">{step.title}</p>
                  <p className="mt-1 text-[0.78rem] leading-relaxed text-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {latestPosts.length > 0 ? (
        <section className="mt-12">
          <SectionHeading
            eyebrow="Feed preview"
            title="RSS 里会出现的更新"
            description="下面是从 RSS 中读取到的最新文章；阅读器里会以同样或更适合阅读的方式呈现。"
            action={{ href: "/blog", label: "浏览全部文章" }}
          />
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {latestPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-5 rounded-[20px] border border-line bg-card p-6 sm:p-8" aria-labelledby="rss-faq">
        <h2 id="rss-faq" className="text-[1.05rem] font-semibold text-ink">
          关于 RSS
        </h2>
        <div className="mt-4 space-y-2">
          <details className="rounded-xl border border-line bg-bg-subtle/40 p-4">
            <summary className="cursor-pointer text-[0.85rem] font-medium text-ink">
              为什么点开显示一堆“源码”？
            </summary>
            <p className="mt-2 text-[0.8rem] leading-relaxed text-muted">
              因为 RSS 是给软件读取的 XML 格式，不是排版好的网页。浏览器的默认行为就是把 XML
              原样展示出来，这并不代表链接坏了。
            </p>
          </details>
          <details className="rounded-xl border border-line bg-bg-subtle/40 p-4">
            <summary className="cursor-pointer text-[0.85rem] font-medium text-ink">
              订阅需要注册账号或留下邮箱吗？
            </summary>
            <p className="mt-2 text-[0.8rem] leading-relaxed text-muted">
              不需要。本站不收集订阅者信息，RSS 阅读器只是定期请求这个公开的 XML 文件。
            </p>
          </details>
          <details className="rounded-xl border border-line bg-bg-subtle/40 p-4">
            <summary className="cursor-pointer text-[0.85rem] font-medium text-ink">
              多久更新一次？
            </summary>
            <p className="mt-2 text-[0.8rem] leading-relaxed text-muted">
              发布新文章时会立即更新 RSS。阅读器会按自己的节奏刷新，通常是几十分钟到几小时。
            </p>
          </details>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/blog" className="btn btn-secondary btn-sm">
            <ArrowLeft size={14} />
            返回博客
          </Link>
          <Link href="/" className="btn btn-ghost btn-sm">
            回到首页
          </Link>
        </div>
      </section>
    </div>
  );
}
