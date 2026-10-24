"use client";

import { useEffect, useState } from "react";
import type { TocHeading } from "@/lib/markdown/render";
import { cn } from "@/lib/utils";

export function TableOfContents({
  headings,
  className,
}: {
  headings: TocHeading[];
  className?: string;
}) {
  const [activeId, setActiveId] = useState(headings[0]?.id ?? "");

  useEffect(() => {
    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length > 0) {
          const sorted = [...visible].sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          );
          setActiveId(sorted[0].target.id);
        }
      },
      { rootMargin: "-90px 0px -68% 0px", threshold: 0 },
    );

    for (const element of elements) observer.observe(element);
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <nav aria-label="文章目录" className={cn("text-[0.8rem]", className)}>
      <p className="mb-3 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-muted">
        目录
      </p>
      <ul className="space-y-0.5 border-l border-line">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              aria-current={activeId === heading.id ? "location" : undefined}
              className={cn(
                "block border-l border-transparent py-1.5 pl-3 leading-snug transition-colors",
                heading.level === 3 && "pl-6 text-[0.76rem]",
                activeId === heading.id
                  ? "-ml-px border-accent text-ink"
                  : "text-muted hover:text-ink",
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
