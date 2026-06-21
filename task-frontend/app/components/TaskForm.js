"use client";

import { useEffect, useState } from "react";

function buildEmptyForm(defaultCategoryId) {
  return {
    title: "",
    description: "",
    dueDate: "",
    categoryId: defaultCategoryId || "",
  };
}

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function TaskForm({
  open,
  onClose,
  onSubmit,
  categories,
  initialTask,
  defaultCategoryId,
}) {
  const [form, setForm] = useState(() => buildEmptyForm(defaultCategoryId));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(initialTask);
  const todayString = getTodayString();

  useEffect(() => {
    if (!open) return;
    if (initialTask) {
      setForm({
        title: initialTask.title || "",
        description: initialTask.description || "",
        dueDate: initialTask.dueDate ? initialTask.dueDate.slice(0, 10) : "",
        categoryId: initialTask.categoryId || "",
      });
    } else {
      setForm(buildEmptyForm(defaultCategoryId));
    }
    setError("");
  }, [open, initialTask, defaultCategoryId]);

  // Lock page scroll behind the modal while it's open, restore it on close.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleDueDateChange(value) {
    if (value && value < todayString) {
      update("dueDate", todayString);
      setError("Due date cannot be before today — reset to today's date.");
      return;
    }
    setError("");
    update("dueDate", value);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) {
      setError("Title is required.");
      return;
    }

    if (form.dueDate && form.dueDate < todayString) {
      setError("Due date cannot be in the past.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await onSubmit({
        title: trimmedTitle,
        description: form.description.trim(),
        dueDate: form.dueDate || null,
        categoryId: form.categoryId || null,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-ink/40 backdrop-blur-[2px] px-4 py-8 overflow-y-auto">
      <div
        className="w-full max-w-md bg-surface rounded-2xl border border-border shadow-[0_12px_32px_rgba(17,21,28,0.18)] p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-semibold text-ink">
            {isEditing ? "Edit Task" : "Add New Task"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-faint hover:text-ink transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-ink"
            >
              Title
            </label>
            <input
              id="title"
              type="text"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
              className="w-full rounded-xl border border-border bg-bg/40 px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-ink"
            >
              Description{" "}
              <span className="text-faint font-normal">(optional)</span>
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Add more detail..."
              rows={2}
              className="w-full rounded-xl border border-border bg-bg/40 px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent resize-none transition-shadow"
            />
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label
                htmlFor="dueDate"
                className="block text-sm font-medium text-ink"
              >
                Due date{" "}
                <span className="text-faint font-normal">(optional)</span>
              </label>
              <input
                id="dueDate"
                type="date"
                value={form.dueDate}
                min={todayString}
                onChange={(e) => handleDueDateChange(e.target.value)}
                className="w-full rounded-xl border border-border bg-bg/40 px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="category"
                className="block text-sm font-medium text-ink"
              >
                Category
              </label>
              <select
                id="category"
                value={form.categoryId}
                onChange={(e) => update("categoryId", e.target.value)}
                className="w-full rounded-xl border border-border bg-bg/40 px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow"
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[0_1px_2px_rgba(79,110,247,0.3)]"
            >
              {submitting ? "Saving…" : isEditing ? "Save changes" : "Add task"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-bg border border-border text-ink text-sm font-medium px-4 py-2.5 hover:bg-border/40 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
