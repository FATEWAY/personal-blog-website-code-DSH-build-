"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, Check, Close } from "./icons";

type ToastKind = "success" | "error" | "info";

type ToastItem = {
  id: number;
  kind: ToastKind;
  message: string;
};

type ToastApi = {
  push: (kind: ToastKind, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = (counter.current += 1);
      setToasts((current) => [...current.slice(-3), { id, kind, message }]);
      window.setTimeout(() => remove(id), 4600);
    },
    [remove],
  );

  const api = useMemo<ToastApi>(
    () => ({
      push,
      success: (message) => push("success", message),
      error: (message) => push("error", message),
      info: (message) => push("info", message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[120] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border bg-card px-3.5 py-3 text-sm shadow-[var(--shadow-md)]",
              toast.kind === "success" && "border-success/30",
              toast.kind === "error" && "border-danger/35",
              toast.kind === "info" && "border-line-strong",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex size-5 flex-none items-center justify-center rounded-full",
                toast.kind === "success" && "bg-success-soft text-success",
                toast.kind === "error" && "bg-danger-soft text-danger",
                toast.kind === "info" && "bg-bg-subtle text-muted",
              )}
            >
              {toast.kind === "success" ? (
                <Check size={13} />
              ) : toast.kind === "error" ? (
                <AlertCircle size={13} />
              ) : (
                <span className="size-1.5 rounded-full bg-current" />
              )}
            </span>
            <p className="min-w-0 flex-1 leading-relaxed text-ink">{toast.message}</p>
            <button
              type="button"
              onClick={() => remove(toast.id)}
              className="-mr-1 -mt-1 rounded p-1 text-muted transition-colors hover:text-ink"
              aria-label="关闭提示"
            >
              <Close size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}
