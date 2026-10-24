import Link from "next/link";
import { config } from "@/lib/config";

export default function GlobalNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 py-20 text-center text-ink">
      <span className="grid size-11 place-items-center rounded-[13px] bg-ink text-sm font-semibold text-bg">
        {config.siteName.trim().slice(0, 1).toUpperCase() || "F"}
      </span>
      <p className="mt-8 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted">
        404 / Not found
      </p>
      <h1 className="mt-4 text-[2.2rem] font-semibold tracking-[-0.03em] text-ink sm:text-[2.8rem]">
        这个页面不存在
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
        链接可能已经失效，或者内容已被移动。回到首页，或者去博客继续浏览。
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="btn btn-primary">
          返回首页
        </Link>
        <Link href="/blog" className="btn btn-secondary">
          浏览博客
        </Link>
      </div>
    </main>
  );
}
