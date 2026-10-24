import Link from "next/link";
import { ArrowRight, Search } from "@/components/ui/icons";

export default function SiteNotFound() {
  return (
    <div className="container-page flex min-h-[62vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-muted">404 / Not found</p>
      <h1 className="mt-4 text-[2.2rem] font-semibold tracking-[-0.03em] text-ink sm:text-[2.8rem]">
        这个页面不存在
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
        链接可能已经失效，或者文章已被下架、尚未发布。你可以回到首页，或者去博客继续浏览。
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="btn btn-primary">
          返回首页
          <ArrowRight size={15} />
        </Link>
        <Link href="/blog" className="btn btn-secondary">
          浏览博客
        </Link>
      </div>
      <Link href="/blog" className="mt-8 inline-flex items-center gap-2 text-xs text-muted hover:text-ink">
        <Search size={13} />
        也可以在博客页搜索文章
      </Link>
    </div>
  );
}
