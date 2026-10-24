import Link from "next/link";
import { ArrowLeft, FileText } from "@/components/ui/icons";
import { config } from "@/lib/config";
import { adminHref } from "@/lib/route-path";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-bg-subtle text-muted">
        <FileText size={20} />
      </span>
      <h1 className="mt-5 text-[1.6rem] font-semibold tracking-[-0.02em] text-ink">
        找不到这个页面或内容
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
        内容可能已被删除，或者链接地址不正确。你可以返回仪表盘继续管理站点。
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href={config.adminPath} className="btn btn-primary btn-sm">
          返回仪表盘
        </Link>
        <Link
          href={adminHref(config.adminPath, "/posts")}
          className="btn btn-secondary btn-sm"
        >
          <ArrowLeft size={14} />
          文章列表
        </Link>
      </div>
    </div>
  );
}
