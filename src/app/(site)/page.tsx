import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";
import { PostCard } from "@/components/site/post-card";
import { ProjectCard } from "@/components/site/project-card";
import { EmptyState } from "@/components/site/empty-state";
import { ArrowRight, ArrowUpRight, FileText, Mail } from "@/components/ui/icons";
import { config } from "@/lib/config";
import { formatDateDot } from "@/lib/date";
import { listLatestPublished, listPublishedPosts } from "@/lib/db/posts";
import { listVisibleProjects } from "@/lib/db/projects";
import { getSiteConfig } from "@/lib/site-data";
import { getInitials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const settings = getSiteConfig();
  const latest = listLatestPublished(3);
  const allProjects = listVisibleProjects();
  const projects = allProjects.slice(0, 3);
  const postTotal = listPublishedPosts({ pageSize: 1 }).total;
  const [lead, ...rest] = latest;
  const socials = settings.socials.filter((social) => social.url);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: settings.siteName,
    url: config.siteUrl,
    description: settings.description,
    inLanguage: "zh-CN",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line/70">
        <div className="hero-glow pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="hero-grid absolute inset-x-0 top-0 h-[440px]" aria-hidden="true" />

        <div className="container-page relative pb-16 pt-14 sm:pt-20 lg:pb-24 lg:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.12fr_0.88fr] lg:gap-16">
            <div className="rise">
              <p className="eyebrow">
                <span className="eyebrow-dot" aria-hidden="true" />
                {settings.hero.eyebrow}
              </p>

              <h1 className="display-title mt-6 text-ink">{settings.hero.title}</h1>

              <p className="mt-6 max-w-xl text-[1.02rem] leading-[1.85] text-ink-soft sm:text-[1.08rem]">
                {settings.hero.subtitle}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/blog" className="btn btn-primary">
                  阅读博客
                  <ArrowRight size={16} />
                </Link>
                <Link href="/about" className="btn btn-secondary">
                  了解更多
                </Link>
              </div>

              <dl className="mt-11 flex flex-wrap items-start gap-x-9 gap-y-5">
                <div>
                  <dt className="text-[0.68rem] uppercase tracking-[0.14em] text-muted">已发布文章</dt>
                  <dd className="mt-1.5 text-[1.35rem] font-medium tracking-[-0.02em] text-ink">
                    {postTotal}
                    <span className="ml-1 text-[0.7rem] font-normal text-muted">篇</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.68rem] uppercase tracking-[0.14em] text-muted">公开项目</dt>
                  <dd className="mt-1.5 text-[1.35rem] font-medium tracking-[-0.02em] text-ink">
                    {allProjects.length}
                    <span className="ml-1 text-[0.7rem] font-normal text-muted">个</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.68rem] uppercase tracking-[0.14em] text-muted">最近更新</dt>
                  <dd className="mt-1.5 font-mono text-[0.85rem] text-ink">
                    {lead ? formatDateDot(lead.publishedAt) : "—"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rise relative mx-auto w-full max-w-[25rem]" style={{ animationDelay: "130ms" }}>
              <div
                className="absolute -inset-6 -z-10 rounded-[32px] bg-accent-soft blur-2xl"
                aria-hidden="true"
              />
              <div className="card-surface overflow-hidden shadow-[var(--shadow-lg)]">
                <div className="flex items-center gap-1.5 border-b border-line bg-bg-subtle/70 px-4 py-3">
                  <span className="size-2 rounded-full bg-[#f26b5e]" aria-hidden="true" />
                  <span className="size-2 rounded-full bg-[#e8b44a]" aria-hidden="true" />
                  <span className="size-2 rounded-full bg-[#5fb67c]" aria-hidden="true" />
                  <span className="ml-2 font-mono text-[0.63rem] text-muted">profile — {settings.siteName}</span>
                </div>

                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {settings.avatarUrl ? (
                      <Image
                        src={settings.avatarUrl}
                        alt={`${settings.profile.name} 的头像`}
                        width={56}
                        height={56}
                        className="size-14 rounded-full border border-line object-cover"
                      />
                    ) : (
                      <div className="avatar-monogram size-14 text-lg" aria-hidden="true">
                        {getInitials(settings.profile.name)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[1.05rem] font-semibold tracking-[-0.01em] text-ink">
                        {settings.profile.name}
                      </p>
                      <p className="mt-1 text-[0.8rem] text-muted">{settings.profile.role}</p>
                      {settings.profile.location ? (
                        <p className="mt-1 text-[0.7rem] text-muted">{settings.profile.location}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {settings.profile.focus.slice(0, 4).map((item) => (
                      <span key={item} className="chip text-[0.68rem]">
                        {item}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 rounded-xl border border-line bg-bg-subtle/80 p-4 font-mono text-[0.7rem] leading-relaxed">
                    <p className="text-muted">
                      <span className="text-accent">$</span> whoami
                    </p>
                    <p className="mt-1 text-ink-soft">
                      {settings.profile.name}
                      {settings.profile.role ? ` · ${settings.profile.role}` : ""}
                    </p>
                    <p className="mt-3 text-muted">
                      <span className="text-accent">$</span> cat focus.txt
                    </p>
                    <p className="mt-1 text-ink-soft">
                      {settings.profile.focus.join(" · ") || "—"}
                    </p>
                    <p className="mt-3 flex items-center gap-1.5 text-muted">
                      <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
                      online
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="container-page mt-24 md:mt-32">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <Reveal>
            <p className="eyebrow">
              <span className="eyebrow-dot" aria-hidden="true" />
              关于
            </p>
            <h2 className="section-title mt-3.5 text-ink">关于我</h2>
            <p className="mt-4 text-sm text-muted">{settings.profile.role}</p>
            <div className="mt-7 h-px w-14 bg-accent" aria-hidden="true" />
            <Link
              href="/about"
              className="group mt-8 inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink"
            >
              更多介绍
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Reveal>

          <Reveal delay={80}>
            <div className="space-y-4 text-[0.98rem] leading-[1.9] text-ink-soft">
              {settings.profile.bio.map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))}
            </div>

            <ul className="mt-9 grid grid-cols-1 gap-x-6 gap-y-3 border-t border-line pt-6 sm:grid-cols-2">
              {settings.profile.focus.map((item, index) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-ink-soft">
                  <span className="font-mono text-[0.65rem] text-muted">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            {settings.profile.principles.length > 0 ? (
              <div className="mt-9 grid gap-3 sm:grid-cols-3">
                {settings.profile.principles.slice(0, 3).map((principle) => (
                  <div key={principle.title} className="rounded-[14px] border border-line bg-card p-4">
                    <p className="text-[0.85rem] font-medium text-ink">{principle.title}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted">{principle.body}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </Reveal>
        </div>
      </section>

      {/* Skills */}
      <section className="mt-24 border-y border-line bg-bg-subtle/60 py-20 md:mt-32 md:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="技术方向"
            title="正在使用的工具与方法"
            description="不展示无法验证的熟练度百分比，只记录实际在用的技术栈与关注方向。"
          />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {settings.skills.map((group, index) => (
              <Reveal key={group.category} delay={index * 60}>
                <div className="h-full rounded-[16px] border border-line bg-card p-5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[0.65rem] text-muted">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="size-1.5 rounded-full bg-accent/60" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-[0.95rem] font-semibold text-ink">{group.category}</h3>
                  <ul className="mt-3 space-y-2">
                    {group.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-[0.83rem] text-muted">
                        <span className="mt-[0.55rem] size-1 flex-none rounded-full bg-line-strong" aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Projects */}
      <section className="container-page mt-24 md:mt-32">
        <SectionHeading
          eyebrow="项目"
          title="精选项目"
          description="一些正在维护或曾经投入过时间的工程实践。"
          action={{ href: "/projects", label: "查看全部项目" }}
        />

        {projects.length > 0 ? (
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => (
              <Reveal key={project.id} delay={index * 70}>
                <ProjectCard project={project} />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="mt-10">
            <EmptyState
              title="还没有公开项目"
              description="项目可以在后台添加，只有标记为可见的项目才会出现在这里。"
            />
          </div>
        )}
      </section>

      {/* Latest posts */}
      <section className="container-page mt-24 md:mt-32">
        <SectionHeading
          eyebrow="写作"
          title="最新文章"
          description="关于工程实践、系统设计与开发工具的记录。"
          action={{ href: "/blog", label: "浏览全部文章" }}
        />

        {lead ? (
          <div className={`mt-10 grid gap-5 ${rest.length > 0 ? "lg:grid-cols-12" : ""}`}>
            <Reveal className={rest.length > 0 ? "lg:col-span-7" : ""}>
              <PostCard post={lead} variant="featured" />
            </Reveal>
            {rest.length > 0 ? (
              <div className="flex flex-col gap-5 lg:col-span-5">
                {rest.map((post, index) => (
                  <Reveal key={post.id} delay={(index + 1) * 80} className="flex flex-1">
                    <PostCard post={post} variant="compact" />
                  </Reveal>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-10">
            <EmptyState
              icon={<FileText size={20} />}
              title="还没有发布文章"
              description="第一篇文章发布后会自动出现在这里，并同步到 RSS 与站点地图。"
              action={{ href: "/about", label: "先了解这个站点" }}
            />
          </div>
        )}
      </section>

      {/* Contact */}
      <section className="container-page mt-24 md:mt-32">
        <Reveal>
          <div className="relative overflow-hidden rounded-[24px] border border-line bg-card px-6 py-12 sm:px-10 md:px-14 md:py-16">
            <div className="hero-glow pointer-events-none absolute inset-0 opacity-80" aria-hidden="true" />
            <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="eyebrow">
                  <span className="eyebrow-dot" aria-hidden="true" />
                  联系
                </p>
                <h2 className="section-title mt-3.5 max-w-lg text-ink">有想法，欢迎交流。</h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
                  {settings.contactEmail
                    ? "无论是技术讨论、合作想法，还是对文章的疑问，都可以直接发邮件。"
                    : "站长尚未公开联系方式。你可以先阅读文章，或稍后再次访问这个页面。"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {settings.contactEmail ? (
                  <a href={`mailto:${settings.contactEmail}`} className="btn btn-primary">
                    <Mail size={15} />
                    写一封邮件
                  </a>
                ) : (
                  <Link href="/blog" className="btn btn-secondary">
                    阅读文章
                    <ArrowRight size={15} />
                  </Link>
                )}
                {socials.map((social) => (
                  <a
                    key={`${social.label}-${social.url}`}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                  >
                    {social.label}
                    <ArrowUpRight size={14} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
