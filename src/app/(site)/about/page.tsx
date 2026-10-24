import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Mail } from "@/components/ui/icons";
import { Reveal } from "@/components/site/reveal";
import { getSiteConfig } from "@/lib/site-data";
import { getInitials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "关于",
  description: "关于站长与这个博客。",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const settings = getSiteConfig();

  return (
    <div className="container-page pb-4 pt-14 sm:pt-20">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <aside>
          <p className="eyebrow">
            <span className="eyebrow-dot" aria-hidden="true" />
            About
          </p>
          <h1 className="mt-4 text-[2.5rem] font-semibold leading-[1.1] tracking-[-0.035em] text-ink sm:text-[3rem]">
            关于我
          </h1>
          <p className="mt-5 max-w-md text-[0.95rem] leading-relaxed text-ink-soft">
            {settings.profile.bio[0] ?? settings.description}
          </p>

          <div className="mt-9 rounded-[20px] border border-line bg-card p-5 shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-4">
              {settings.avatarUrl ? (
                <Image
                  src={settings.avatarUrl}
                  alt={`${settings.profile.name} 的头像`}
                  width={60}
                  height={60}
                  className="size-15 rounded-full border border-line object-cover"
                />
              ) : (
                <div className="avatar-monogram size-14 text-lg" aria-hidden="true">
                  {getInitials(settings.profile.name)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[1rem] font-semibold text-ink">{settings.profile.name}</p>
                <p className="mt-1 text-[0.8rem] text-muted">{settings.profile.role}</p>
                {settings.profile.location ? (
                  <p className="mt-0.5 text-[0.72rem] text-muted">{settings.profile.location}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-1.5">
              {settings.profile.focus.map((item) => (
                <span key={item} className="chip text-[0.68rem]">
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-5 border-t border-line pt-4">
              {settings.contactEmail ? (
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="inline-flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-accent-strong"
                >
                  <Mail size={15} />
                  {settings.contactEmail}
                </a>
              ) : (
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink"
                >
                  <Mail size={15} />
                  联系方式尚未配置
                </Link>
              )}
            </div>
          </div>
        </aside>

        <div className="space-y-14">
          <Reveal>
            <section aria-labelledby="about-intro">
              <h2 id="about-intro" className="text-[1.15rem] font-semibold tracking-[-0.01em] text-ink">
                简介
              </h2>
              <div className="mt-4 space-y-4 text-[0.98rem] leading-[1.9] text-ink-soft">
                {settings.profile.bio.slice(1).map((paragraph) => (
                  <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                ))}
              </div>
              {settings.profile.focus.length > 0 ? (
                <div className="mt-6 rounded-[16px] border border-line bg-bg-subtle/60 p-5">
                  <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted">
                    关注方向
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {settings.profile.focus.map((item) => (
                      <span key={item} className="chip bg-card">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          </Reveal>

          {settings.profile.principles.length > 0 ? (
            <Reveal delay={60}>
              <section aria-labelledby="about-principles">
                <h2
                  id="about-principles"
                  className="text-[1.15rem] font-semibold tracking-[-0.01em] text-ink"
                >
                  {settings.profile.principlesTitle}
                </h2>
                <div className="mt-4 space-y-px overflow-hidden rounded-[16px] border border-line">
                  {settings.profile.principles.map((principle, index) => (
                    <div
                      key={principle.title}
                      className="flex gap-4 border-b border-line bg-card p-5 last:border-0"
                    >
                      <span className="font-mono text-[0.68rem] text-muted">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p className="text-[0.9rem] font-medium text-ink">{principle.title}</p>
                        <p className="mt-1 text-[0.85rem] leading-relaxed text-muted">
                          {principle.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </Reveal>
          ) : null}

          <Reveal delay={120}>
            <section className="rounded-[20px] border border-line bg-card p-6 sm:p-8">
              <h2 className="text-[1.15rem] font-semibold text-ink">继续了解</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                订阅 RSS 获取新文章，或者直接浏览项目与技术笔记。
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/blog" className="btn btn-primary btn-sm">
                  阅读博客
                  <ArrowRight size={14} />
                </Link>
                <Link href="/projects" className="btn btn-secondary btn-sm">
                  查看项目
                </Link>
                <Link href="/subscribe" className="btn btn-ghost btn-sm">
                  RSS 订阅
                </Link>
              </div>
            </section>
          </Reveal>
        </div>
      </div>

      <div className="mt-20 border-t border-line pt-14">
        <section className="relative overflow-hidden rounded-[24px] border border-line bg-card px-6 py-12 sm:px-10 md:px-14">
          <div className="hero-glow pointer-events-none absolute inset-0 opacity-80" aria-hidden="true" />
          <div className="relative flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow">
                <span className="eyebrow-dot" aria-hidden="true" />
                Gallery
              </p>
              <h2 className="section-title mt-3.5 text-ink">照片墙</h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
                奖状、证书与值得留存的瞬间，已经按相册分类整理。进入照片墙可以查看全部合集。
              </p>
            </div>
            <Link href="/gallery" className="btn btn-primary shrink-0">
              查看照片墙
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
