"use client";

import { useState } from "react";
import { Check, Copy } from "@/components/ui/icons";

export function CopyFeedButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function copy() {
    setFailed(false);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setFailed(true);
    }
  }

  return (
    <button type="button" className="btn btn-primary btn-sm" onClick={copy}>
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "已复制订阅链接" : failed ? "请手动复制" : "复制订阅链接"}
    </button>
  );
}
