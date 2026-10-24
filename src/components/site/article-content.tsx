"use client";

import { useEffect, useRef } from "react";

/**
 * Injects progressive enhancements into the server-sanitised article HTML:
 * code copy buttons and a readable image fallback. It never parses Markdown
 * or executes author-provided HTML.
 */
export function ArticleContent({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const cleanups: Array<() => void> = [];

    root.querySelectorAll("pre").forEach((pre) => {
      if (pre.querySelector(".code-copy")) return;
      const code = pre.querySelector("code");
      if (!code) return;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "code-copy";
      button.textContent = "复制";
      button.setAttribute("aria-label", "复制代码");

      let resetTimer: number | undefined;
      const onClick = async () => {
        try {
          await navigator.clipboard.writeText(code.textContent ?? "");
          button.textContent = "已复制";
        } catch {
          button.textContent = "复制失败";
        }
        window.clearTimeout(resetTimer);
        resetTimer = window.setTimeout(() => {
          button.textContent = "复制";
        }, 1800);
      };

      button.addEventListener("click", onClick);
      pre.appendChild(button);
      cleanups.push(() => {
        window.clearTimeout(resetTimer);
        button.removeEventListener("click", onClick);
        button.remove();
      });
    });

    root.querySelectorAll("img").forEach((image) => {
      const onError = () => {
        const fallback = document.createElement("span");
        fallback.className =
          "my-4 flex items-center justify-center rounded-xl border border-dashed border-line-strong bg-bg-subtle px-4 py-8 text-sm text-muted";
        fallback.textContent = image.alt ? `图片加载失败：${image.alt}` : "图片加载失败";
        image.replaceWith(fallback);
      };

      if (image.complete && image.naturalWidth === 0) {
        onError();
      } else {
        image.addEventListener("error", onError);
        cleanups.push(() => image.removeEventListener("error", onError));
      }
    });

    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  }, [html]);

  return (
    <div
      ref={ref}
      className="article-content prose-article"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
