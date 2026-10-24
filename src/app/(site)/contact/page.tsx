import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Mail, Rss } from "@/components/ui/icons";
import { getSiteConfig } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "联系",
  description: "通过邮件或社交主页与站长取得联系。",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const settings = getSiteConfig();
  const socials = settings.socials.filter((social) => social.url);

  return (
    <div className="container-page pb-4 pt-14 sm:pt-20">
      <header className="max-w-2xl">
        <p className="eyebrow">
          <span className="eyebrow-dot" aria-hidden="true" />
          Contact
        </p>
        <h1 className="mt-4 text-[2.5rem] font-semibold leading-[1.1] tracking-[-0.035em] text-ink sm:text-[3rem]">
          联系
        </h1>
        <p className="mt-4 text-[0.98rem] leading-relaxed text-ink-soft">
          技术讨论、合作想法，或者对某篇文章有疑问，都欢迎直接联系。这里只展示已经确认可用的联系方式。
        </p>
      </header>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <section className="rounded-[18px] border border-line bg-card p-6">
          <span className="flex size-10 items-center justify-center rounded-full bg-bg-subtle text-ink-soft">
            <Mail size={18} />
          </span>
          <h2 className="mt-5 text-[1.02rem] font-semibold text-ink">电子邮箱</h2>
          {settings.contactEmail ? (
            <>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                最直接的方式，通常会在看到后尽快回复。
              </p>
              <a
                href={`mailto:${settings.contactEmail}`}
                className="mt-4 inline-flex items-center gap-2 text-sm text-accent-strong hover:underline"
              >
                {settings.contactEmail}
                <ArrowUpRight size={14} />
              </a>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                站长尚未配置公开邮箱。你仍然可以通过 RSS 订阅后续内容。
              </p>
              <Link href="/subscribe" className="mt-4 inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink">
                订阅 RSS
                <Rss size={14} />
              </Link>
            </>
          )}
        </section>

        <section className="rounded-[18px] border border-line bg-card p-6">
          <span className="flex size-10 items-center justify-center rounded-full bg-bg-subtle text-ink-soft">
            <ArrowUpRight size={18} />
          </span>
          <h2 className="mt-5 text-[1.02rem] font-semibold text-ink">社交主页</h2>
          {socials.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {socials.map((social) => (
                <li key={`${social.label}-${social.url}`}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-accent-strong"
                  >
                    {social.label}
                    <ArrowUpRight size={13} />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-muted">
              尚未添加社交主页。你可以在后台的“站点设置”中填写后，它会出现在这里和页脚。
            </p>
          )}
        </section>
      </div>

      <section className="mt-4 rounded-[18px] border border-line bg-bg-subtle/60 p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div>
          <h2 className="text-[1.02rem] font-semibold text-ink">先看看文章？</h2>
          <p className="mt-1.5 text-sm text-muted">很多问题在技术笔记里已经有更完整的讨论。</p>
        </div>
        <Link href="/blog" className="btn btn-primary btn-sm mt-4 sm:mt-0">
          浏览博客
          <ArrowRight size={14} />
        </Link>
      </section>
    </div>
  );
}
