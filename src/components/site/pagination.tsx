import Link from "next/link";
import { ChevronLeft, ChevronRight } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

function pageHref(
  basePath: string,
  params: Record<string, string | undefined>,
  target: number,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  if (target > 1) search.set("page", String(target));
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function Pagination({
  page,
  totalPages,
  basePath = "/blog",
  params = {},
}: {
  page: number;
  totalPages: number;
  basePath?: string;
  params?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  const pages = Array.from({ length: end - start + 1 }, (_, index) => start + index);

  return (
    <nav className="mt-10 flex items-center justify-between gap-4" aria-label="分页导航">
      <div>
        {page > 1 ? (
          <Link
            href={pageHref(basePath, params, page - 1)}
            className="btn btn-secondary btn-sm"
            rel="prev"
          >
            <ChevronLeft size={15} />
            上一页
          </Link>
        ) : (
          <span className="btn btn-secondary btn-sm pointer-events-none opacity-40">
            <ChevronLeft size={15} />
            上一页
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        {pages.map((target) => (
          <Link
            key={target}
            href={pageHref(basePath, params, target)}
            aria-label={`第 ${target} 页`}
            aria-current={target === page ? "page" : undefined}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-lg font-mono text-xs transition-colors",
              target === page
                ? "bg-ink text-bg"
                : "text-muted hover:bg-bg-subtle hover:text-ink",
            )}
          >
            {target}
          </Link>
        ))}
      </div>

      <div>
        {page < totalPages ? (
          <Link
            href={pageHref(basePath, params, page + 1)}
            className="btn btn-secondary btn-sm"
            rel="next"
          >
            下一页
            <ChevronRight size={15} />
          </Link>
        ) : (
          <span className="btn btn-secondary btn-sm pointer-events-none opacity-40">
            下一页
            <ChevronRight size={15} />
          </span>
        )}
      </div>
    </nav>
  );
}
