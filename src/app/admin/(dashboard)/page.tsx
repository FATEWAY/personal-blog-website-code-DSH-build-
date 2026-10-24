import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  ArrowRight,
  ArrowUpRight,
  Chart,
  FileText,
  Folder,
  ImageIcon,
  Pencil,
  Plus,
  Settings,
  Shield,
} from "@/components/ui/icons";
import { requireAdminPage } from "@/lib/auth/current";
import { config } from "@/lib/config";
import { formatDateDot, formatDateTime } from "@/lib/date";
import { getDashboardStats } from "@/lib/db/posts";
import { getSiteConfig } from "@/lib/site-data";
import { adminHref } from "@/lib/route-path";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "仪表盘",
};

export default async function DashboardPage() {
  const auth = await requireAdminPage();
  const settings = getSiteConfig();
  const stats = getDashboardStats();
  const now = Date.now();

  const cards = [
    {
      label: "文章总数",
      value: stats.totalPosts,
      note: "全部文章",
      icon: <FileText size={17} />,
    },
    {
      label: "已发布",
      value: stats.publishedPosts,
      note: "公开可见",
      icon: <Chart size={17} />,
    },
    {
      label: "草稿",
      value: stats.draftPosts,
      note: "未公开",
      icon: <Pencil size={17} />,
    },
    {
      label: "项目",
      value: stats.totalProjects,
      note: "项目展示区",
      icon: <Folder size={17} />,
    },
  ];

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted">
            Overview
          </p>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-[-0.025em] text-ink">
            仪表盘
          </h1>
          <p className="mt-2 text-sm text-muted">
            欢迎回来，{settings.profile.name}。这是 {settings.siteName} 当前的状态。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={adminHref(config.adminPath, "/posts/new")} className="btn btn-primary btn-sm">
            <Plus size={15} />
            新建文章
          </Link>
          <Link href="/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
            查看站点
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="stat-card">
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-[0.72rem] text-muted">{card.label}</p>
                <p className="mt-2 text-[1.8rem] font-semibold leading-none tracking-[-0.03em] text-ink">
                  {card.value}
                </p>
              </div>
              <span className="flex size-9 items-center justify-center rounded-xl border border-line bg-card text-ink-soft">
                {card.icon}
              </span>
            </div>
            <p className="relative z-10 mt-3 text-[0.66rem] text-muted">{card.note}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <section className="card-surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h2 className="text-[0.95rem] font-semibold text-ink">最近编辑</h2>
              <p className="mt-0.5 text-[0.7rem] text-muted">按最后修改时间排序</p>
            </div>
            <Link
              href={adminHref(config.adminPath, "/posts")}
              className="inline-flex items-center gap-1 text-[0.75rem] text-muted transition-colors hover:text-ink"
            >
              全部文章
              <ArrowRight size={13} />
            </Link>
          </div>

          {stats.recentUpdated.length > 0 ? (
            <ul className="divide-y divide-line">
              {stats.recentUpdated.map((post) => (
                <li key={post.id}>
                  <Link
                    href={adminHref(config.adminPath, `/posts/${post.id}`)}
                    className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-bg-subtle/60"
                  >
                    <span className="flex size-8 flex-none items-center justify-center rounded-lg border border-line bg-bg-subtle text-muted">
                      <FileText size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[0.86rem] font-medium text-ink">
                          {post.title}
                        </span>
                        <StatusBadge
                          status={post.status}
                          scheduled={
                            post.status === "published" &&
                            Boolean(post.publishedAt && new Date(post.publishedAt).getTime() > now)
                          }
                        />
                      </span>
                      <span className="mt-1 flex items-center gap-2 text-[0.68rem] text-muted">
                        <span className="font-mono">/blog/{post.slug}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatDateTime(post.updatedAt)}</span>
                      </span>
                    </span>
                    <ArrowRight
                      size={14}
                      className="flex-none text-muted opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-muted">还没有文章。创建第一篇，把想法写下来。</p>
              <Link
                href={adminHref(config.adminPath, "/posts/new")}
                className="btn btn-primary btn-sm mt-4"
              >
                <Plus size={14} />
                新建文章
              </Link>
            </div>
          )}
        </section>

        <div className="space-y-5">
          <section className="card-surface p-5">
            <h2 className="text-[0.95rem] font-semibold text-ink">快捷操作</h2>
            <div className="mt-3 grid gap-1.5">
              {[
                { href: "/posts/new", label: "写新文章", icon: <Plus size={15} /> },
                { href: "/posts", label: "管理文章", icon: <FileText size={15} /> },
                { href: "/projects", label: "管理项目", icon: <Folder size={15} /> },
                { href: "/gallery", label: "管理照片墙", icon: <ImageIcon size={15} /> },
                { href: "/settings", label: "站点设置", icon: <Settings size={15} /> },
                { href: "/account", label: "账户安全", icon: <Shield size={15} /> },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={adminHref(config.adminPath, action.href)}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.82rem] text-ink-soft transition-colors hover:bg-bg-subtle hover:text-ink"
                >
                  <span className="text-muted">{action.icon}</span>
                  {action.label}
                </Link>
              ))}
            </div>
          </section>

          <section className="card-surface p-5">
            <h2 className="text-[0.95rem] font-semibold text-ink">系统状态</h2>
            <dl className="mt-3 space-y-2.5 text-[0.75rem]">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">数据库</dt>
                <dd className="inline-flex items-center gap-1.5 text-ink-soft">
                  <span className="status-dot bg-success" aria-hidden="true" />
                  SQLite · WAL
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">媒体存储</dt>
                <dd className="text-ink-soft">本地目录 /media</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">运行环境</dt>
                <dd className="text-ink-soft">{config.isProduction ? "production" : "development"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Cookie Secure</dt>
                <dd className="text-ink-soft">{config.secureCookies ? "启用" : "本地 HTTP 下关闭"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">上次登录</dt>
                <dd className="text-ink-soft">
                  {auth.admin.lastLoginAt ? formatDateTime(auth.admin.lastLoginAt) : "首次登录"}
                </dd>
              </div>
            </dl>
            {!config.isProduction ? (
              <p className="mt-3 rounded-lg bg-warning-soft px-3 py-2 text-[0.68rem] leading-relaxed text-warning">
                当前为本地开发模式，会话 Cookie 未启用 Secure；部署到 HTTPS 后会自动启用。
              </p>
            ) : null}
          </section>
        </div>
      </div>

      <section className="card-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[0.95rem] font-semibold text-ink">最近发布</h2>
          <Link
            href="/blog"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[0.75rem] text-muted transition-colors hover:text-ink"
          >
            打开博客
            <ArrowUpRight size={13} />
          </Link>
        </div>
        {stats.recentPublished.length > 0 ? (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {stats.recentPublished.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-line px-3.5 py-3 transition-colors hover:border-line-strong hover:bg-bg-subtle/50"
                >
                  <span className="font-mono text-[0.66rem] text-muted">
                    {formatDateDot(post.publishedAt)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[0.82rem] text-ink-soft">
                    {post.title}
                  </span>
                  <ArrowUpRight size={13} className="flex-none text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">还没有已发布的文章。</p>
        )}
      </section>
    </div>
  );
}
