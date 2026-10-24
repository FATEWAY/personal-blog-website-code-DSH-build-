import type { PostStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  scheduled = false,
}: {
  status: PostStatus;
  scheduled?: boolean;
}) {
  if (status === "published" && scheduled) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning-soft px-2 py-0.5 text-[0.66rem] text-warning">
        <span className="status-dot bg-warning" aria-hidden="true" />
        定时发布
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[0.66rem]",
        status === "published"
          ? "border-success/30 bg-success-soft text-success"
          : "border-line-strong bg-bg-subtle text-muted",
      )}
    >
      <span
        className={cn("status-dot", status === "published" ? "bg-success" : "bg-muted")}
        aria-hidden="true"
      />
      {status === "published" ? "已发布" : "草稿"}
    </span>
  );
}
