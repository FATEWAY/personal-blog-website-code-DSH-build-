"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, ArrowRight } from "@/components/ui/icons";

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[site] render error", error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[62vh] flex-col items-center justify-center py-20 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger">
        <AlertTriangle size={22} />
      </span>
      <h1 className="mt-5 text-[1.8rem] font-semibold tracking-[-0.02em] text-ink">
        页面暂时无法加载
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
        服务端处理请求时出现了问题。稍后重试，或者回到首页继续浏览。
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">
          重试
          <ArrowRight size={15} />
        </button>
        <Link href="/" className="btn btn-secondary">
          返回首页
        </Link>      </div>
      {error.digest ? (
        <p className="mt-8 font-mono text-[0.68rem] text-muted">错误编号：{error.digest}</p>
      ) : null}
    </div>
  );
}
