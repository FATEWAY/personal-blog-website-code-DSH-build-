"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useAdminSession } from "@/components/admin/admin-session";
import { Close, ImageIcon, Loader, Upload } from "@/components/ui/icons";

export function ImageUploader({
  value,
  onChange,
  label = "封面图片",
  maxMb = 5,
  aspect = "aspect-[16/9]",
  fit = "cover",
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  maxMb?: number;
  aspect?: string;
  fit?: "cover" | "contain";
}) {
  const { csrfToken } = useAdminSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File | undefined) {
    if (!file) return;
    setError("");

    if (file.size > maxMb * 1024 * 1024) {
      setError(`图片不能超过 ${maxMb} MB`);
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "x-csrf-token": csrfToken },
        body,
      });
      const data = (await response.json().catch(() => null)) as
        | { url?: string; error?: { message?: string } }
        | null;

      if (!response.ok || !data?.url) {
        setError(data?.error?.message ?? "上传失败，请稍后重试");
        return;
      }

      onChange(data.url);
    } catch {
      setError("网络请求失败，图片没有上传");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <span className="field-label">{label}</span>

      {value ? (
        <div className="overflow-hidden rounded-xl border border-line bg-bg-subtle">
          <div className={`relative ${aspect}`}>
            <Image
              src={value}
              alt="已上传图片预览"
              fill
              sizes="320px"
              className={fit === "contain" ? "object-contain p-2" : "object-cover"}
            />
            {uploading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                <Loader size={20} />
              </div>
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-line px-3 py-2">
            <span className="truncate font-mono text-[0.62rem] text-muted">{value}</span>
            <div className="flex flex-none items-center gap-1">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="btn btn-ghost btn-sm"
                disabled={uploading}
              >
                更换
              </button>
              <button
                type="button"
                onClick={() => onChange(null)}
                className="icon-btn size-7 text-muted hover:text-danger"
                aria-label="移除图片"
                disabled={uploading}
              >
                <Close size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong bg-bg-subtle/40 px-4 py-7 text-center transition-colors hover:border-muted hover:bg-bg-subtle/70 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <Loader size={19} className="text-muted" />
          ) : (
            <span className="flex size-9 items-center justify-center rounded-full bg-card text-muted">
              <Upload size={16} />
            </span>
          )}
          <span className="text-[0.78rem] text-ink-soft">
            {uploading ? "正在上传…" : "点击上传图片"}
          </span>
          <span className="text-[0.66rem] leading-relaxed text-muted">
            JPEG / PNG / WebP · 最大 {maxMb} MB
            <br />
            自动压缩并转换为 WebP
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => upload(event.target.files?.[0])}
        tabIndex={-1}
      />

      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : (
        <p className="mt-1.5 flex items-center gap-1.5 text-[0.66rem] text-muted">
          <ImageIcon size={12} />
          图片会保存在独立的上传目录，不会覆盖程序文件。
        </p>
      )}
    </div>
  );
}
