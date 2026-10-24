"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Eye, Loader } from "@/components/ui/icons";

export function LoginForm({ adminPath }: { adminPath: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setError("");
    setPending(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await response.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null;

      if (!response.ok) {
        setError(data?.error?.message ?? "登录失败，请稍后重试");
        return;
      }

      router.replace(adminPath || "/admin");
      router.refresh();
    } catch {
      setError("网络请求失败，请检查连接后重试");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-3 text-[0.82rem] leading-relaxed text-danger"
        >
          <AlertCircle size={15} className="mt-0.5 flex-none" />
          <span>{error}</span>
        </div>
      ) : null}

      <div>
        <label htmlFor="username" className="field-label">
          用户名
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          maxLength={64}
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="input"
          placeholder="管理员用户名"
          disabled={pending}
        />
      </div>

      <div>
        <label htmlFor="password" className="field-label">
          密码
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            maxLength={200}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="input pr-11"
            placeholder="输入密码"
            disabled={pending}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-1.5 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition-colors hover:bg-bg-subtle hover:text-ink"
            aria-label={showPassword ? "隐藏密码" : "显示密码"}
            tabIndex={-1}
          >
            <Eye size={16} />
          </button>
        </div>
      </div>

      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader size={15} />
            正在验证…
          </>
        ) : (
          <>
            <ArrowRight size={15} />
            登录后台
          </>
        )}
      </button>

      <p className="pt-1 text-center text-[0.68rem] leading-relaxed text-muted">
        登录失败超过 5 次将触发 15 分钟的保护性锁定。
      </p>
    </form>
  );
}
