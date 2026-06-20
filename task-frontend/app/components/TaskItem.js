"use client";

import { useState } from "react";
import { motion } from "framer-motion";

function formatDueDate(dueDate) {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isOverdue(dueDate, completed) {
  if (!dueDate || completed) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

export default function TaskItem({ task, onToggle, onDelete, onRequestEdit }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleToggle() {
    setBusy(true);
    setError("");
    try {
      await onToggle(task.id, !task.completed);
    } catch (err) {
      setError(err.message || "Failed to update task.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await onDelete(task.id);
    } catch (err) {
      setError(err.message || "Failed to delete task.");
      setBusy(false);
    }
  }

  const dueLabel = formatDueDate(task.dueDate);
  const overdue = isOverdue(task.dueDate, task.completed);

  return (
    // layout + the shared `tasks` layoutId group lets Framer Motion animate
    // this item sliding to the bottom of the list the instant `completed`
    // flips — the "real time bring down" behavior requested — without
    // needing to manually re-sort and re-render the whole list.
    <motion.li
      layout
      layoutId={task.id}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 500, damping: 38 }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-4 pl-5 flex items-start gap-3 transition-shadow hover:shadow-[0_2px_8px_rgba(17,21,28,0.06)]"
    >
      <span
        className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${
          task.completed ? "bg-success" : overdue ? "bg-danger" : "bg-accent"
        }`}
      />

      <button
        type="button"
        onClick={handleToggle}
        disabled={busy}
        aria-label={task.completed ? "Mark as active" : "Mark as completed"}
        className={`mt-0.5 h-5 w-5 flex-shrink-0 rounded-md border-2 flex items-center justify-center transition-colors disabled:opacity-50 ${
          task.completed
            ? "bg-success border-success"
            : "border-border group-hover:border-accent"
        }`}
      >
        {task.completed && (
          <svg
            className="h-3 w-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={`text-sm font-medium break-words ${task.completed ? "line-through text-faint" : "text-ink"}`}
          >
            {task.title}
          </p>
          {task.completed && (
            <span className="text-xs font-medium text-success bg-success-soft rounded-full px-2 py-0.5 flex-shrink-0">
              Complete
            </span>
          )}
          {overdue && (
            <span className="text-xs font-medium text-danger bg-danger-soft rounded-full px-2 py-0.5 flex-shrink-0">
              Overdue
            </span>
          )}
          {task.category && (
            <span
              className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 flex-shrink-0"
              style={{
                color: task.category.color,
                backgroundColor: `${task.category.color}1a`,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: task.category.color }}
              />
              {task.category.name}
            </span>
          )}
        </div>

        {task.description && (
          <p
            className={`text-sm mt-1 break-words ${task.completed ? "text-faint" : "text-muted"}`}
          >
            {task.description}
          </p>
        )}

        {dueLabel && (
          <p
            className={`text-xs mt-1.5 font-mono ${overdue ? "text-danger" : "text-faint"}`}
          >
            Due {dueLabel}
          </p>
        )}

        {error && <p className="text-sm text-danger mt-1">{error}</p>}
      </div>

      <div className="flex gap-1 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => onRequestEdit(task)}
          disabled={busy}
          className="p-1.5 rounded-lg text-accent hover:bg-accent-soft transition-colors disabled:opacity-50"
          aria-label="Edit task"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={busy}
          className="p-1.5 rounded-lg text-danger hover:bg-danger-soft transition-colors disabled:opacity-50"
          aria-label="Delete task"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </motion.li>
  );
}
