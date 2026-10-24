import type { NextRequest } from "next/server";
import { config } from "@/lib/config";
import { formatDateDot } from "@/lib/date";
import { listLatestPublished } from "@/lib/db/posts";
import { getSiteConfig } from "@/lib/site-data";
import type { PostSummary, SiteSettings } from "@/lib/types";

export const dynamic = "force-dynamic";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildFeedXml(settings: SiteSettings, posts: PostSummary[], feedUrl: string): string {
  const lastBuildDate = posts[0]?.publishedAt
    ? new Date(posts[0].publishedAt).toUTCString()
    : new Date().toUTCString();

  const items = posts
    .map((post) => {
      const url = `${config.siteUrl}/blog/${post.slug}`;
      return [
        "    <item>",
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
        `      <pubDate>${new Date(post.publishedAt ?? post.createdAt).toUTCString()}</pubDate>`,
        post.category ? `      <category>${escapeXml(post.category.name)}</category>` : "",
        `      <description>${escapeXml(post.summary)}</description>`,
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(settings.siteName)} — ${escapeXml(settings.tagline)}</title>
    <link>${escapeXml(config.siteUrl)}</link>
    <description>${escapeXml(settings.description)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}

function renderBrowserView(
  settings: SiteSettings,
  posts: PostSummary[],
  feedXml: string,
  feedUrl: string,
): string {
  const items = posts
    .map((post) => {
      const href = `/blog/${post.slug}`;
      return `<article class="card">
        <div class="meta">
          ${post.category ? `<span class="chip">${escapeXml(post.category.name)}</span>` : ""}
          <span>${formatDateDot(post.publishedAt)}</span>
          <span>${post.readingMinutes} 分钟阅读</span>
        </div>
        <h3><a href="${href}">${escapeXml(post.title)}</a></h3>
        <p>${escapeXml(post.summary)}</p>
        <a class="read" href="${href}">阅读文章 <span aria-hidden="true">→</span></a>
      </article>`;
    })
    .join("\n");

  const updated = posts[0]?.publishedAt ? formatDateDot(posts[0].publishedAt) : "—";

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>RSS 订阅源 · ${escapeXml(settings.siteName)}</title>
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<script>
try {
  var stored = localStorage.getItem("fw-theme");
  var dark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
} catch (error) {}
</script>
<style>
  :root {
    --bg: #f7f6f2;
    --card: #ffffff;
    --ink: #191816;
    --soft: #4c4842;
    --muted: #79746b;
    --line: #e7e3db;
    --line-strong: #d7d1c6;
    --accent: #d75f30;
    --accent-soft: rgba(215, 95, 48, 0.1);
    --code: #1a1917;
    --code-line: #2b2823;
  }
  .dark {
    --bg: #0e0e0f;
    --card: #171719;
    --ink: #f1eee8;
    --soft: #c5c0b7;
    --muted: #928d84;
    --line: #262628;
    --line-strong: #3a3a3e;
    --accent: #ef7a4b;
    --accent-soft: rgba(239, 122, 75, 0.14);
    --code: #121214;
    --code-line: #2a2a2e;
  }
  * { box-sizing: border-box; }
  html { color-scheme: light; }
  html.dark { color-scheme: dark; }
  body {
    margin: 0;
    min-height: 100vh;
    background: var(--bg);
    color: var(--ink);
    font-family: "Inter Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    -webkit-font-smoothing: antialiased;
    line-height: 1.6;
  }
  body::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(42rem 24rem at 82% 0%, var(--accent-soft), transparent 70%),
      radial-gradient(32rem 20rem at 8% 4%, rgba(111, 143, 184, 0.08), transparent 72%);
  }
  a { color: inherit; text-decoration: none; }
  .container { position: relative; max-width: 62rem; margin: 0 auto; padding: 0 1.25rem; }
  header {
    position: sticky;
    top: 0;
    z-index: 10;
    border-bottom: 1px solid var(--line);
    background: color-mix(in srgb, var(--bg) 82%, transparent);
    backdrop-filter: blur(18px) saturate(150%);
  }
  .nav { display: flex; align-items: center; gap: 1.4rem; height: 4.25rem; }
  .brand { display: inline-flex; align-items: center; gap: 0.6rem; font-weight: 600; letter-spacing: -0.01em; }
  .mark {
    display: grid;
    place-items: center;
    width: 2rem;
    height: 2rem;
    border-radius: 10px;
    background: var(--ink);
    color: var(--bg);
    font-size: 0.8rem;
  }
  .nav .links { display: flex; gap: 1.25rem; color: var(--muted); font-size: 0.82rem; }
  .nav .links a:hover { color: var(--ink); }
  .nav .end { margin-left: auto; color: var(--muted); font-size: 0.72rem; }
  main { position: relative; padding: 3.5rem 0 4rem; }
  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--muted);
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }
  .dot { width: 5px; height: 5px; border-radius: 999px; background: var(--accent); box-shadow: 0 0 0 4px var(--accent-soft); }
  h1 { margin: 1rem 0 0; font-size: clamp(2.1rem, 5vw, 3.2rem); line-height: 1.08; letter-spacing: -0.035em; font-weight: 600; }
  .lead { max-width: 42rem; margin: 1rem 0 0; color: var(--soft); font-size: 0.98rem; }
  .feed-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.6rem 1.4rem;
    margin-top: 1.5rem;
    color: var(--muted);
    font-size: 0.76rem;
  }
  .feed-meta code { font-family: "JetBrains Mono Variable", ui-monospace, Consolas, monospace; font-size: 0.72rem; color: var(--soft); }
  .panel {
    margin-top: 2rem;
    border: 1px solid var(--line);
    border-radius: 20px;
    background: var(--card);
    padding: 1.25rem;
    box-shadow: 0 16px 40px -24px rgba(28, 23, 15, 0.25);
  }
  .panel-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.75rem; }
  .panel-head h2 { margin: 0; font-size: 0.95rem; letter-spacing: -0.01em; }
  .panel-head a { color: var(--accent); font-size: 0.76rem; }
  .panel-head a:hover { text-decoration: underline; }
  .grid { display: grid; gap: 0.9rem; margin-top: 1rem; }
  @media (min-width: 720px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  .card {
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 1.1rem 1.15rem;
    background: var(--card);
    transition: border-color 160ms ease, transform 160ms ease;
  }
  .card:hover { border-color: var(--line-strong); transform: translateY(-1px); }
  .meta { display: flex; flex-wrap: wrap; align-items: center; gap: 0.45rem 0.7rem; color: var(--muted); font-size: 0.68rem; }
  .chip { display: inline-flex; align-items: center; border: 1px solid var(--line); border-radius: 999px; padding: 0.15rem 0.55rem; color: var(--soft); font-size: 0.64rem; }
  .card h3 { margin: 0.7rem 0 0; font-size: 1.02rem; line-height: 1.4; letter-spacing: -0.015em; font-weight: 600; }
  .card h3 a:hover { color: var(--accent); }
  .card p { margin: 0.5rem 0 0; color: var(--muted); font-size: 0.82rem; line-height: 1.7; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .read { display: inline-flex; margin-top: 0.8rem; color: var(--accent); font-size: 0.74rem; }
  .read:hover { text-decoration: underline; }
  .empty { padding: 2rem; text-align: center; color: var(--muted); font-size: 0.85rem; }
  details.raw { margin-top: 1.5rem; border: 1px solid var(--line); border-radius: 16px; background: var(--card); padding: 0.9rem 1.1rem; }
  details.raw summary { cursor: pointer; color: var(--muted); font-size: 0.76rem; }
  details.raw summary:hover { color: var(--ink); }
  details.raw pre {
    margin: 1rem 0 0;
    padding: 1rem;
    overflow: auto;
    border: 1px solid var(--code-line);
    border-radius: 12px;
    background: var(--code);
    color: #e9e4da;
    font-family: "JetBrains Mono Variable", ui-monospace, Consolas, monospace;
    font-size: 0.72rem;
    line-height: 1.7;
    white-space: pre;
  }
  footer { position: relative; border-top: 1px solid var(--line); padding: 1.5rem 0 2.5rem; color: var(--muted); font-size: 0.7rem; }
  footer .container { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0.7rem; }
  footer a { color: var(--soft); }
  footer a:hover { color: var(--ink); }
  @media (max-width: 600px) {
    .nav .links { display: none; }
    .nav .end { font-size: 0.66rem; }
    .panel { padding: 1rem; }
  }
</style>
</head>
<body>
<header>
  <div class="container nav">
    <a class="brand" href="/"><span class="mark">${escapeXml(settings.brand.mark.trim() || settings.siteName.slice(0, 1).toUpperCase() || "F")}</span>${escapeXml(settings.siteName)}</a>
    <nav class="links" aria-label="站点导航">
      <a href="/">首页</a>
      <a href="/blog">博客</a>
      <a href="/subscribe">订阅说明</a>
    </nav>
    <span class="end">RSS 2.0 · ${posts.length} 篇文章</span>
  </div>
</header>
<main class="container">
  <span class="eyebrow"><span class="dot"></span> RSS Feed</span>
  <h1>RSS 订阅源</h1>
  <p class="lead">${escapeXml(settings.description)}</p>
  <div class="feed-meta">
    <span>最近更新：${updated}</span>
    <span>共 ${posts.length} 篇文章</span>
    <span>订阅地址：<code>${escapeXml(feedUrl)}</code></span>
  </div>

  <section class="panel" aria-labelledby="feed-items">
    <div class="panel-head">
      <h2 id="feed-items">最新更新</h2>
      <a href="/subscribe">如何订阅 →</a>
    </div>
    <div class="grid">
      ${items || `<div class="empty">还没有已发布的文章。</div>`}
    </div>
  </section>

  <details class="raw">
    <summary>查看原始 XML（供阅读器读取）</summary>
    <pre>${escapeXml(feedXml)}</pre>
  </details>
</main>
<footer>
  <div class="container">
    <span>${escapeXml(settings.siteName)} · RSS 2.0</span>
    <span><a href="/">返回首页</a> · <a href="/subscribe">订阅说明</a></span>
  </div>
</footer>
</body>
</html>`;
}

export async function GET(request: NextRequest): Promise<Response> {
  const accept = request.headers.get("accept") ?? "";
  const wantsHtml = accept.includes("text/html") && !accept.includes("application/rss+xml");

  const settings = getSiteConfig();
  const posts = listLatestPublished(20);
  const feedUrl = `${config.siteUrl}/rss.xml`;
  const feedXml = buildFeedXml(settings, posts, feedUrl);

  if (wantsHtml) {
    return new Response(renderBrowserView(settings, posts, feedXml, feedUrl), {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  return new Response(feedXml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, stale-while-revalidate=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
