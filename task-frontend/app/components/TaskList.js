"use client";

import { useState } from "react";
import { AnimatePresence, LayoutGroup } from "framer-motion";
import TaskItem from "./TaskItem";
import ConfirmDialog from "./ConfirmDialog";

export default function TaskList({
  tasks,
  onToggle,
  onDelete,
  onRequestEdit,
  hasActiveFilters,
}) {
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await onDelete(pendingDelete.id);
      setPendingDelete(null);
    } catch {
      // Error toast is already raised by the caller (page.js); keep the
      // dialog open so the user can retry instead of losing their place.
    } finally {
      setDeleting(false);
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-14 px-6 border border-dashed border-border rounded-2xl bg-surface/50">
        <svg
          className="mx-auto h-10 w-10 text-faint mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-5 9l2 2 4-4"
          />
        </svg>
        <p className="text-sm font-medium text-ink">No tasks here</p>
        <p className="text-sm text-muted mt-1">
          {hasActiveFilters
            ? "Nothing matches your search and filter — try adjusting them, or add a new task above."
            : "You don't have any tasks yet — add one above to get started."}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* LayoutGroup lets items animate position changes (e.g. a completed
          task sliding down past still-active ones) even though they're
          re-sorted by the parent's `orderBy` rather than re-mounted. */}
      <LayoutGroup>
        <ul className="space-y-2.5">
          <AnimatePresence initial={false}>
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={onToggle}
                onDelete={(id) => setPendingDelete(task)}
                onRequestEdit={onRequestEdit}
              />
            ))}
          </AnimatePresence>
        </ul>
      </LayoutGroup>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete task?"
        message={
          pendingDelete
            ? `"${pendingDelete.title}" will be permanently deleted. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
