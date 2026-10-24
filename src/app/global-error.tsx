"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] fatal error", error);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f7f6f2",
          color: "#191816",
          fontFamily:
            '"Inter Variable", ui-sans-serif, system-ui, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
          padding: "2rem",
        }}
      >
        <main style={{ maxWidth: "28rem", textAlign: "center" }}>
          <p
            style={{
              fontSize: "0.68rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#79746b",
            }}
          >
            Something went wrong
          </p>
          <h1 style={{ marginTop: "1rem", fontSize: "1.8rem", letterSpacing: "-0.02em" }}>
            站点暂时不可用
          </h1>
          <p style={{ marginTop: "0.8rem", fontSize: "0.9rem", lineHeight: 1.8, color: "#79746b" }}>
            服务端遇到了未处理的问题。请稍后重试；如果问题持续出现，请检查服务器日志。
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              border: 0,
              borderRadius: "10px",
              background: "#191816",
              color: "#f7f6f2",
              padding: "0.7rem 1.15rem",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            重试
          </button>
        </main>
      </body>
    </html>
  );
}
