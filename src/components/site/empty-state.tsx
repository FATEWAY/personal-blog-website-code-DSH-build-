import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "@/components/ui/icons";

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[18px] border border-dashed border-line-strong bg-card/60 px-6 py-16 text-center">
      {icon ? (
        <span className="mb-4 flex size-11 items-center justify-center rounded-full bg-bg-subtle text-muted">
          {icon}
        </span>
      ) : null}
      <p className="text-[0.95rem] font-medium text-ink">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">{description}</p>
      {action ? (
        <Link
          href={action.href}
          className="group mt-5 inline-flex items-center gap-1.5 text-sm text-accent-strong"
        >
          {action.label}
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : null}
    </div>
  );
}
