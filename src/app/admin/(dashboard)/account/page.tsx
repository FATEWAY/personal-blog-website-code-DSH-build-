import type { Metadata } from "next";
import { PasswordForm } from "@/components/admin/password-form";
import { LockKeyhole, Shield } from "@/components/ui/icons";
import { requireAdminPage } from "@/lib/auth/current";
import { formatDateTime } from "@/lib/date";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "账户安全",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AccountPage() {
  const auth = await requireAdminPage();

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <p className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-muted">
          Security
        </p>
        <h1 className="mt-1.5 text-[1.6rem] font-semibold tracking-[-0.025em] text-ink">
          账户安全
        </h1>
        <p className="mt-2 text-sm text-muted">
          管理唯一的管理员账户与登录凭据。系统不提供公开注册入口。
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <section className="card-surface p-5 sm:p-6">
          <h2 className="text-[1rem] font-semibold text-ink">修改密码</h2>
          <p className="mt-1 text-[0.75rem] text-muted">
            新密码使用 scrypt 哈希存储，不会以明文形式写入数据库。
          </p>
          <div className="mt-5">
            <PasswordForm />
          </div>
        </section>

        <div className="space-y-4">
          <section className="card-surface p-5">
            <h2 className="flex items-center gap-2 text-[0.95rem] font-semibold text-ink">
              <LockKeyhole size={16} />
              当前账户
            </h2>
            <dl className="mt-4 space-y-3 text-[0.76rem]">
              <div>
                <dt className="text-muted">显示名称</dt>
                <dd className="mt-0.5 font-medium text-ink">{auth.admin.displayName}</dd>
              </div>
              <div>
                <dt className="text-muted">登录用户名</dt>
                <dd className="mt-0.5 font-mono text-ink">@{auth.admin.username}</dd>
              </div>
              <div>
                <dt className="text-muted">上次登录</dt>
                <dd className="mt-0.5 text-ink-soft">
                  {auth.admin.lastLoginAt ? formatDateTime(auth.admin.lastLoginAt) : "首次登录"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">本次会话到期</dt>
                <dd className="mt-0.5 text-ink-soft">{formatDateTime(auth.session.expiresAt)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-[16px] border border-line bg-bg-subtle/50 p-4">
            <h2 className="flex items-center gap-2 text-[0.85rem] font-semibold text-ink">
              <Shield size={15} />
              安全说明
            </h2>
            <ul className="mt-3 space-y-2 text-[0.68rem] leading-relaxed text-muted">
              <li>· 会话 Cookie 使用 HttpOnly 与 SameSite=Lax，HTTPS 下自动启用 Secure。</li>
              <li>· 登录失败会按账号与 IP 限流，15 分钟内最多 5 次。</li>
              <li>· 管理 API 每次请求都会在服务端校验会话与 CSRF 令牌。</li>
              <li>· 密码重置可随时通过服务器上的管理员初始化命令完成。</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
