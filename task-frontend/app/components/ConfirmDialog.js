"use client";

import { useEffect } from "react";

/**
 * Generic confirmation modal for destructive actions (delete task, delete
 * category, delete-with-reassign). Kept separate from ToastProvider because
 * confirmations need to block on a user decision, while toasts are fire-and-forget.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = true,
  busy = false,
  onConfirm,
  onCancel,
}) {
  // Lock page scroll behind the modal while it's open.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    // Backdrop click no longer dismisses the dialog — only the explicit
    // Confirm/Cancel buttons can, so an accidental click outside doesn't
    // silently cancel a delete the user actually meant to confirm.
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/40 backdrop-blur-[2px] px-4">
      <div
        className="w-full max-w-sm bg-surface rounded-2xl border border-border shadow-[0_12px_32px_rgba(17,21,28,0.18)] p-5 animate-[feedback-in_0.18s_ease-out]"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <h3
          id="confirm-dialog-title"
          className="font-display text-base font-semibold text-ink mb-1.5"
        >
          {title}
        </h3>
        <p className="text-sm text-muted leading-relaxed">{message}</p>

        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              danger
                ? "bg-danger hover:bg-danger/90"
                : "bg-accent hover:bg-accent-hover"
            }`}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-xl bg-bg border border-border text-ink text-sm font-medium px-4 py-2.5 hover:bg-border/40 transition-colors"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
