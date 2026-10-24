import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Shield } from "@/components/ui/icons";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { LoginForm } from "@/components/admin/login-form";
import { getCurrentSession } from "@/lib/auth/current";
import { config } from "@/lib/config";
import { getSiteConfig } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "管理员登录",
  description: "受保护的管理区域。",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLoginPage() {
  const session = await getCurrentSession();
  if (session) redirect(config.adminPath);

  const settings = getSiteConfig();
  const brandMark =
    settings.brand.mark.trim() || settings.siteName.trim().slice(0, 1).toUpperCase() || "F";

  return (
    <div className="grid min-h-screen bg-bg lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-[#141311] px-12 py-12 text-[#f4f0e8] lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-24 top-1/4 size-96 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #d75f30, transparent 65%)" }}
          aria-hidden="true"
        />

        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-3">
            {settings.brand.logoUrl ? (
              <Image
                src={settings.brand.logoUrl}
                alt=""
                width={36}
                height={36}
                className="size-9 rounded-[11px] bg-[#f4f0e8] object-contain p-1"
              />
            ) : (
              <span className="grid size-9 place-items-center rounded-[11px] bg-[#f4f0e8] text-sm font-semibold text-[#191816]">
                {brandMark}
              </span>
            )}
            <span className="text-sm font-medium tracking-[0.02em]">{settings.siteName}</span>
          </Link>
        </div>

        <div className="relative max-w-md">
          <p className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-[#a09a8e]">
            Protected workspace
          </p>
          <h1 className="mt-5 text-[2.6rem] font-medium leading-[1.15] tracking-[-0.035em]">
            写作是思考的
            <br />
            延长线。
          </h1>
          <p className="mt-6 text-sm leading-relaxed text-[#a9a296]">
            这里是站点内容的管理区域。文章、项目与站点资料都在同一个地方维护，每一次修改都经过服务端身份校验与数据验证。
          </p>
          <div className="mt-8 h-px w-16 bg-[#d75f30]" aria-hidden="true" />
        </div>

        <div className="relative flex items-center gap-2 text-[0.7rem] text-[#7e786c]">
          <Shield size={14} />
          受保护的私有区域 · 不会出现在公开导航与站点地图中
        </div>
      </aside>

      <main className="flex min-h-screen flex-col px-5 py-6 sm:px-10 sm:py-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft size={15} />
            返回站点
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <div className="lg:hidden">
              {settings.brand.logoUrl ? (
                <Image
                  src={settings.brand.logoUrl}
                  alt=""
                  width={40}
                  height={40}
                  className="size-10 rounded-xl border border-line bg-card object-contain p-1"
                />
              ) : (
                <span className="grid size-10 place-items-center rounded-xl bg-ink text-sm font-semibold text-bg">
                  {brandMark}
                </span>
              )}
            </div>
            <p className="mt-6 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted lg:mt-0">
              Admin sign in
            </p>
            <h2 className="mt-3 text-[1.8rem] font-semibold tracking-[-0.025em] text-ink">
              登录后台
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              仅允许已创建的管理员账户登录。没有公开注册入口。
            </p>

            <LoginForm adminPath={config.adminPath} />

            <p className="mt-8 text-center text-[0.68rem] leading-relaxed text-muted">
              忘记密码？请在服务器上通过
              <code className="mx-1 rounded border border-line bg-bg-subtle px-1.5 py-0.5 font-mono text-[0.65rem] text-ink-soft">
                npm run admin:create -- --force
              </code>
              重置。
            </p>
          </div>
        </div>

        <p className="text-center text-[0.66rem] text-muted">
          受保护的管理区域 · 不会被搜索引擎索引
        </p>
      </main>
    </div>
  );
}
