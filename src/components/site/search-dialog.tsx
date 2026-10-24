"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowRight, Loader, Search } from "@/components/ui/icons";

type SearchResult = {
  slug: string;
  title: string;
  summary: string;
  publishedAt: string | null;
  category: string | null;
};

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    setQuery("");
    setResults([]);
    setError("");
    setActiveIndex(0);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 40);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;
      const root = dialogRef.current;
      if (!root) return;

      const focusable = Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !root.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError("");

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("request failed");
        const data = (await response.json()) as { results?: SearchResult[] };
        setResults(Array.isArray(data.results) ? data.results : []);
        setActiveIndex(0);
      } catch (fetchError) {
        if ((fetchError as Error).name !== "AbortError") {
          setError("搜索暂时不可用，请稍后再试");
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 240);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  if (!open) return null;

  const go = (slug: string) => {
    onClose();
    router.push(`/blog/${slug}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && results.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp" && results.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      go(results[activeIndex].slug);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh] sm:pt-[16vh]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[3px]" aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="站内搜索"
        className="relative w-full max-w-xl overflow-hidden rounded-[20px] border border-line bg-card shadow-[var(--shadow-lg)]"
      >
        <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
          <Search size={17} className="text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索文章标题、摘要或正文…"
            aria-label="搜索关键词"
            className="h-7 flex-1 bg-transparent text-[0.95rem] text-ink outline-none placeholder:text-muted"
          />
          {loading ? <Loader size={15} className="text-muted" /> : null}
          <button type="button" onClick={onClose} className="chip text-[0.7rem]">
            ESC
          </button>
        </div>

        <div className="max-h-[54vh] overflow-y-auto p-2">
          {!query.trim() ? (
            <p className="px-3 py-8 text-center text-sm text-muted">
              输入关键词开始搜索，支持标题、摘要与正文。
            </p>
          ) : error ? (
            <p className="px-3 py-8 text-center text-sm text-danger" role="alert">
              {error}
            </p>
          ) : !loading && results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted">没有找到相关文章。</p>
          ) : (
            <ul className="space-y-0.5">
              {results.map((result, index) => (
                <li key={result.slug}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => go(result.slug)}
                    className={cn(
                      "group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                      index === activeIndex ? "bg-bg-subtle" : "hover:bg-bg-subtle",
                    )}
                  >
                    <span className="mt-0.5 text-[0.68rem] font-medium tracking-wide text-muted">
                      {result.category ?? "文章"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.9rem] font-medium text-ink">
                        {result.title}
                      </span>
                      <span className="mt-0.5 line-clamp-1 block text-xs text-muted">
                        {result.summary}
                      </span>
                    </span>
                    <ArrowRight
                      size={14}
                      className="mt-1 flex-none text-muted opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line bg-bg-subtle px-4 py-2 text-[0.7rem] text-muted">
          <span>↑ ↓ 选择 · Enter 打开</span>
          <span>{results.length > 0 ? `${results.length} 个结果` : "站内搜索"}</span>
        </div>
      </div>
    </div>
  );
}
