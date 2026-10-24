"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { AdminSessionProvider } from "@/components/admin/admin-session";
import { useToast } from "@/components/ui/toast";
import {
  ArrowUpRight,
  ChevronRight,
  Close,
  Dashboard,
  FileText,
  Folder,
  Globe,
  ImageIcon,
  Loader,
  LogOut,
  Menu,
  Plus,
  Settings,
  User,
} from "@/components/ui/icons";
import { formatDateTime } from "@/lib/date";
import { adminHref } from "@/lib/route-path";
import type { AdminAccount } from "@/lib/types";
import { cn, getInitials } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "", label: "仪表盘", icon: Dashboard },
  { href: "/posts", label: "文章", icon: FileText },
  { href: "/projects", label: "项目", icon: Folder },
  { href: "/gallery", label: "照片墙", icon: ImageIcon },
  { href: "/settings", label: "站点设置", icon: Settings },
  { href: "/account", label: "账户安全", icon: User },
];

function AdminAvatar({
  avatarUrl,
  name,
  className,
}: {
  avatarUrl: string;
  name: string;
  className?: string;
}) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={`${name} 的头像`}
        width={32}
        height={32}
        className={cn("rounded-full border border-line object-cover", className)}
      />
    );
  }

  return (
    <span
      className={cn("avatar-monogram text-[0.7rem]", className)}
      aria-hidden="true"
    >
      {getInitials(name)}
    </span>
  );
}

export function AdminShell({
  children,
  admin,
  csrfToken,
  adminPath,
  sessionExpiresAt,
  siteName,
  brandLogoUrl,
  brandMark,
  profileName,
  avatarUrl,
}: {
  children: React.ReactNode;
  admin: AdminAccount;
  csrfToken: string;
  adminPath: string;
  sessionExpiresAt: string;
  siteName: string;
  brandLogoUrl: string;
  brandMark: string;
  profileName: string;
  avatarUrl: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const displayName = profileName.trim() || admin.displayName;

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

  const isActive = (href: string) => {
    const target = adminHref(adminPath, href);
    if (!href) return pathname === target;
    return pathname === target || pathname.startsWith(`${target}/`);
  };

  const currentNav = [...NAV_ITEMS].reverse().find((item) => isActive(item.href));
  const pageLabel = currentNav?.label ?? "管理后台";
  const loginHref = adminHref(adminPath, "/login");

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "x-csrf-token": csrfToken },
      });
      if (!response.ok) throw new Error("logout failed");
      router.replace(loginHref);
      router.refresh();
    } catch {
      toast.error("退出登录失败，请稍后重试");
      setLoggingOut(false);
    }
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-line px-5">
        <Link href={adminPath} className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          {brandLogoUrl ? (
            <Image
              src={brandLogoUrl}
              alt=""
              width={32}
              height={32}
              className="size-8 rounded-[10px] border border-line bg-card object-contain p-0.5"
            />
          ) : (
            <span className="grid size-8 place-items-center rounded-[10px] bg-ink text-[0.8rem] font-semibold text-bg">
              {brandMark.trim() || siteName.trim().slice(0, 1).toUpperCase() || "F"}
            </span>
          )}
          <span className="flex flex-col leading-none">
            <span className="text-[0.9rem] font-semibold text-ink">{siteName}</span>
            <span className="mt-1 text-[0.58rem] uppercase tracking-[0.18em] text-muted">
              Admin
            </span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="icon-btn ml-auto lg:hidden"
          aria-label="关闭菜单"
        >
          <Close size={18} />
        </button>
      </div>

      <div className="p-3">
        <Link
          href={adminHref(adminPath, "/posts/new")}
          className="btn btn-primary btn-sm w-full"
          onClick={() => setMobileOpen(false)}
        >
          <Plus size={15} />
          新建文章
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-1" aria-label="后台导航">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={adminHref(adminPath, item.href)}
              className="admin-nav-link"
              data-active={isActive(item.href)}
              aria-current={isActive(item.href) ? "page" : undefined}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line p-3">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="admin-nav-link"
          onClick={() => setMobileOpen(false)}
        >
          <Globe size={17} />
          查看站点
          <ArrowUpRight size={13} className="ml-auto text-muted" />
        </Link>

        <div className="mt-2 flex items-center gap-2.5 rounded-xl bg-bg-subtle p-2.5">
          <AdminAvatar avatarUrl={avatarUrl} name={displayName} className="size-8" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.8rem] font-medium text-ink">{displayName}</p>
            <p className="truncate text-[0.66rem] text-muted">@{admin.username}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="icon-btn size-8 flex-none"
            aria-label="退出登录"
            title="退出登录"
          >
            {loggingOut ? <Loader size={15} /> : <LogOut size={15} />}
          </button>
        </div>

        <p className="mt-2 px-1 text-[0.6rem] leading-relaxed text-muted">
          会话有效期至 {formatDateTime(sessionExpiresAt)}
        </p>
      </div>
    </div>
  );

  return (
    <AdminSessionProvider value={{ admin, csrfToken, adminPath, sessionExpiresAt }}>
      <div className="min-h-screen bg-bg">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-line bg-card lg:block">
          {sidebar}
        </aside>

        <div className="lg:pl-[248px]">
          <header className="glass sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="icon-btn lg:hidden"
              aria-label="打开菜单"
              aria-expanded={mobileOpen}
            >
              <Menu size={19} />
            </button>

            <Link href={adminPath} className="flex items-center gap-2 lg:hidden">
              {brandLogoUrl ? (
                <Image
                  src={brandLogoUrl}
                  alt=""
                  width={28}
                  height={28}
                  className="size-7 rounded-[8px] border border-line bg-card object-contain p-0.5"
                />
              ) : (
                <span className="grid size-7 place-items-center rounded-[8px] bg-ink text-[0.7rem] font-semibold text-bg">
                  {brandMark.trim() || siteName.trim().slice(0, 1).toUpperCase() || "F"}
                </span>
              )}
              <span className="text-[0.82rem] font-medium text-ink">{siteName}</span>
            </Link>

            <div className="hidden items-center gap-2 text-[0.72rem] text-muted lg:flex">
              <span>管理后台</span>
              <ChevronRight size={12} />
              <span className="text-ink">{pageLabel}</span>
            </div>

            <div className="ml-auto flex items-center gap-1">
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.75rem] text-muted transition-colors hover:bg-bg-subtle hover:text-ink sm:inline-flex"
              >
                查看站点
                <ArrowUpRight size={13} />
              </Link>
              <ThemeToggle />
              <Link
                href={adminHref(adminPath, "/account")}
                className="ml-1 rounded-full border border-line bg-bg-subtle transition-colors hover:border-line-strong"
                aria-label="账户设置"
                title={displayName}
              >
                <AdminAvatar avatarUrl={avatarUrl} name={displayName} className="size-8" />
              </Link>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
              onClick={() => setMobileOpen(false)}
              aria-label="关闭菜单"
            />
            <div className={cn("absolute inset-y-0 left-0 w-[280px] border-r border-line bg-card shadow-2xl")}>
              {sidebar}
            </div>
          </div>
        ) : null}
      </div>
    </AdminSessionProvider>
  );
}
