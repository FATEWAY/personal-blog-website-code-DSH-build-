"use client";

import { useState } from "react";
import { useAdminSession } from "@/components/admin/admin-session";
import { useToast } from "@/components/ui/toast";
import { AlertCircle, Check, Loader, Shield } from "@/components/ui/icons";

export function PasswordForm() {
  const { csrfToken } = useAdminSession();
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const nextErrors: Record<string, string> = {};
    if (newPassword !== confirmPassword) nextErrors.confirmPassword = "两次输入的新密码不一致";
    if (newPassword.length < 12) nextErrors.newPassword = "新密码至少需要 12 个字符";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setPending(true);
    setErrors({});
    try {
      const response = await fetch("/api/admin/account/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            revokedSessions?: number;
            error?: { message?: string; fields?: Record<string, string>; details?: Record<string, unknown> };
          }
        | null;

      if (!response.ok) {
        const fields =
          data?.error?.fields ??
          (data?.error?.details && typeof data.error.details === "object"
            ? (data.error.details as Record<string, string>)
            : undefined);
        if (fields) {
          const next: Record<string, string> = {};
          for (const [key, value] of Object.entries(fields)) {
            if (typeof value === "string") next[key] = value;
          }
          setErrors(next);
        }
        toast.error(data?.error?.message ?? "密码修改失败");
      } else {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        const revoked = data?.revokedSessions ?? 0;
        toast.success(
          revoked > 0
            ? `密码已更新，并退出了其他 ${revoked} 个会话`
            : "密码已更新",
        );
      }
    } catch {
      toast.error("网络请求失败，密码没有修改");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="current-password" className="field-label">
          当前密码
        </label>
        <input
          id="current-password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          className="input"
          maxLength={200}
          aria-invalid={Boolean(errors.currentPassword)}
        />
        {errors.currentPassword ? <p className="field-error">{errors.currentPassword}</p> : null}
      </div>

      <div>
        <label htmlFor="new-password" className="field-label">
          新密码
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          className="input"
          maxLength={200}
          aria-invalid={Boolean(errors.newPassword)}
        />
        {errors.newPassword ? <p className="field-error">{errors.newPassword}</p> : null}
      </div>

      <div>
        <label htmlFor="confirm-password" className="field-label">
          再次输入新密码
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="input"
          maxLength={200}
          aria-invalid={Boolean(errors.confirmPassword)}
        />
        {errors.confirmPassword ? <p className="field-error">{errors.confirmPassword}</p> : null}
      </div>

      <div className="rounded-xl border border-line bg-bg-subtle/50 p-3.5 text-[0.68rem] leading-relaxed text-muted">
        <p className="flex items-center gap-1.5 font-medium text-ink-soft">
          <Shield size={13} />
          密码要求
        </p>
        <ul className="mt-2 space-y-1">
          <li className="flex items-center gap-1.5">
            <Check size={11} /> 至少 12 个字符
          </li>
          <li className="flex items-center gap-1.5">
            <Check size={11} /> 12–15 位需包含大小写、数字、符号中的至少三类
          </li>
          <li className="flex items-center gap-1.5">
            <Check size={11} /> 不能包含用户名，也不能是常见密码
          </li>
        </ul>
      </div>

      {Object.keys(errors).length > 0 ? (
        <p className="flex items-start gap-1.5 text-[0.75rem] text-danger" role="alert">
          <AlertCircle size={14} className="mt-0.5 flex-none" />
          请修正上方标记的问题后重试。
        </p>
      ) : null}

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? <Loader size={15} /> : <Shield size={15} />}
        {pending ? "正在更新…" : "更新密码"}
      </button>

      <p className="text-[0.68rem] leading-relaxed text-muted">
        修改密码后，当前会话保持登录，其他设备上的会话会立即失效。
      </p>
    </form>
  );
}
