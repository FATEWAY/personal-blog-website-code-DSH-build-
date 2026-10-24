"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Close, Menu, Search } from "@/components/ui/icons";
import { SearchDialog } from "./search-dialog";
import { ThemeToggle } from "./theme-toggle";

const NAV_ITEMS = [
  { label: "首页", href: "/" },
  { label: "关于", href: "/about" },
  { label: "项目", href: "/projects" },
  { label: "照片墙", href: "/gallery" },
  { label: "博客", href: "/blog" },
  { label: "联系", href: "/contact" },
];

export function SiteHeader({
  siteName,
  brandLogoUrl,
  brandMark,
  brandSubtitle,
}: {
  siteName: string;
  brandLogoUrl: string;
  brandMark: string;
  brandSubtitle: string;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  const mark = brandMark.trim() || siteName.trim().slice(0, 1).toUpperCase() || "F";

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[130] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-bg"
      >
        跳到主要内容
      </a>

      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-300",
          scrolled || mobileOpen
            ? "glass border-line shadow-[0_1px_0_rgba(0,0,0,0.02),0_12px_30px_-24px_rgba(0,0,0,0.25)]"
            : "border-transparent bg-transparent",
        )}
      >
        <div className="container-page flex h-[var(--header-height)] items-center justify-between gap-4">
          <Link
            href="/"
            className="group flex items-center gap-2.5 rounded-lg"
            aria-label={`${siteName} — 返回首页`}
          >
            {brandLogoUrl ? (
              <Image
                src={brandLogoUrl}
                alt=""
                width={32}
                height={32}
                className="size-8 rounded-[10px] border border-line bg-card object-contain p-0.5 transition-transform duration-200 group-hover:-rotate-3"
              />
            ) : (
              <span className="grid size-8 place-items-center rounded-[10px] bg-ink text-[0.8rem] font-semibold text-bg transition-transform duration-200 group-hover:-rotate-3">
                {mark}
              </span>
            )}
            <span className="flex flex-col leading-none">
              <span className="text-[0.95rem] font-semibold tracking-[-0.01em] text-ink">
                {siteName}
              </span>
              {brandSubtitle ? (
                <span className="mt-1 text-[0.6rem] uppercase tracking-[0.2em] text-muted">
                  {brandSubtitle}
                </span>
              ) : null}
            </span>
          </Link>

          <nav className="hidden items-center gap-5 md:flex lg:gap-7" aria-label="主导航">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="nav-link"
                data-active={isActive(item.href)}
                aria-current={isActive(item.href) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden items-center gap-2 rounded-full border border-line bg-card/70 px-3 py-1.5 text-xs text-muted transition-colors hover:border-line-strong hover:text-ink sm:inline-flex"
              aria-label="打开站内搜索"
            >
              <Search size={14} />
              <span>搜索</span>
              <kbd className="rounded border border-line bg-bg-subtle px-1.5 py-0.5 font-sans text-[0.6rem] text-muted">
                Ctrl K
              </kbd>
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="icon-btn sm:hidden"
              aria-label="打开站内搜索"
            >
              <Search size={18} />
            </button>
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="icon-btn md:hidden"
              aria-label={mobileOpen ? "关闭菜单" : "打开菜单"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
            >
              {mobileOpen ? <Close size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <div
            id="mobile-nav"
            className="rise fixed inset-x-0 bottom-0 top-[var(--header-height)] overflow-y-auto border-t border-line bg-bg/95 backdrop-blur-xl md:hidden"
          >
            <nav className="container-page flex flex-col pb-10 pt-2" aria-label="移动端导航">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between border-b border-line/70 py-4 text-[1.05rem] last:border-0",
                    isActive(item.href) ? "text-ink" : "text-ink-soft",
                  )}
                  aria-current={isActive(item.href) ? "page" : undefined}
                >
                  <span>{item.label}</span>
                  {isActive(item.href) ? (
                    <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
                  ) : null}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  setSearchOpen(true);
                }}
                className="flex items-center gap-2 py-4 text-left text-[1.05rem] text-ink-soft"
              >
                <Search size={17} />
                搜索文章
              </button>
              <p className="mt-8 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-muted">
                {siteName}
                {brandSubtitle ? ` · ${brandSubtitle}` : ""}
              </p>
            </nav>
          </div>
        ) : null}
      </header>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
