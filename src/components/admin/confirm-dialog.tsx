"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, Loader } from "@/components/ui/icons";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "确认删除",
  cancelLabel = "取消",
  loading = false,
  tone = "danger",
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  tone?: "danger" | "default";
  onConfirm: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    const handleCancel = (event: Event) => {
      event.preventDefault();
      if (!loading) onClose();
    };

    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [loading, onClose]);

  return (
    <dialog
      ref={ref}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-[20px] border border-line bg-card p-0 text-ink shadow-[var(--shadow-lg)] backdrop:bg-black/40 backdrop:backdrop-blur-[2px]"
      aria-labelledby="confirm-title"
    >
      <div className="p-6">
        <span
          className={
            tone === "danger"
              ? "flex size-10 items-center justify-center rounded-full bg-danger-soft text-danger"
              : "flex size-10 items-center justify-center rounded-full bg-bg-subtle text-ink-soft"
          }
        >
          <AlertTriangle size={19} />
        </span>
        <h2 id="confirm-title" className="mt-4 text-[1.05rem] font-semibold text-ink">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={tone === "danger" ? "btn btn-danger btn-sm" : "btn btn-primary btn-sm"}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <Loader size={14} /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
