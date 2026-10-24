import Link from "next/link";
import Image from "next/image";
import { currentYear } from "@/lib/date";
import type { SiteSettings } from "@/lib/types";
import { ArrowUpRight, Github, Mail } from "@/components/ui/icons";

const FOOTER_LINKS = [
  { label: "首页", href: "/" },
  { label: "关于", href: "/about" },
  { label: "项目", href: "/projects" },
  { label: "照片墙", href: "/gallery" },
  { label: "博客", href: "/blog" },
  { label: "联系", href: "/contact" },
];

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const year = currentYear();
  const socials = settings.socials.filter((social) => social.url);
  const mark =
    settings.brand.mark.trim() || settings.siteName.trim().slice(0, 1).toUpperCase() || "F";

  return (
    <footer className="mt-24 border-t border-line">
      <div className="container-page py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5" aria-label="返回首页">
              {settings.brand.logoUrl ? (
                <Image
                  src={settings.brand.logoUrl}
                  alt=""
                  width={32}
                  height={32}
                  className="size-8 rounded-[10px] border border-line bg-card object-contain p-0.5"
                />
              ) : (
                <span className="grid size-8 place-items-center rounded-[10px] bg-ink text-[0.8rem] font-semibold text-bg">
                  {mark}
                </span>
              )}
              <span className="text-[0.95rem] font-semibold tracking-[-0.01em] text-ink">
                {settings.siteName}
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">{settings.description}</p>
            {settings.contactEmail ? (
              <a
                href={`mailto:${settings.contactEmail}`}
                className="mt-5 inline-flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-accent-strong"
              >
                <Mail size={15} />
                {settings.contactEmail}
              </a>
            ) : null}
          </div>

          <nav aria-label="页脚导航">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted">页面</p>
            <ul className="mt-4 space-y-2.5">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-soft transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted">
              更多
            </p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link
                  href="/subscribe"
                  className="inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink"
                >
                  RSS 订阅
                  <ArrowUpRight size={13} />
                </Link>
              </li>
              {socials.map((social) => (
                <li key={`${social.label}-${social.url}`}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink"
                  >
                    {social.label.toLowerCase().includes("github") ? (
                      <Github size={14} />
                    ) : (
                      <ArrowUpRight size={13} />
                    )}
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {settings.siteName}
            {settings.footerNote ? ` · ${settings.footerNote}` : ""}
          </p>
        </div>
      </div>
    </footer>
  );
}
