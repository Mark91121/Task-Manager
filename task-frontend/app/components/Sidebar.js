"use client";

import { useState } from "react";

function LogoMark() {
  return (
    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-accent shadow-[0_2px_6px_rgba(79,110,247,0.35)]">
      <svg
        className="h-4.5 w-4.5 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 11l3 3L22 4"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"
        />
      </svg>
    </span>
  );
}

function NavIcon({ path }) {
  return (
    <svg
      className="h-[18px] w-[18px]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d={path}
      />
    </svg>
  );
}

const DASHBOARD_ICON =
  "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6";
const ALL_TASKS_ICON =
  "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2";

const SWATCHES = [
  "#5b5bd6",
  "#4f6ef7",
  "#1fb27a",
  "#d6914a",
  "#e15252",
  "#0ea5b8",
];

/** Inline edit form for an existing category — swaps in place of the row. */
function CategoryEditRow({ category, onSave, onCancel }) {
  const [name, setName] = useState(category.name);
  const [color, setColor] = useState(category.color);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSave({ name: name.trim(), color });
    } catch (err) {
      setError(err.message || "Failed to update category.");
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSave}
      className="px-2.5 py-2 space-y-2 rounded-xl bg-surface border border-accent/30"
    >
      <input
        autoFocus
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-lg border border-border bg-bg/40 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
      />
      <div className="flex items-center gap-1.5">
        {SWATCHES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            aria-label={`Choose color ${c}`}
            className="h-5 w-5 rounded-full flex-shrink-0"
            style={{
              backgroundColor: c,
              boxShadow:
                color === c
                  ? `0 0 0 2px var(--color-sidebar), 0 0 0 4px ${c}`
                  : "none",
            }}
          />
        ))}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex gap-1.5">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-accent text-white text-xs font-medium px-2.5 py-1.5 hover:bg-accent-hover disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="rounded-lg bg-surface border border-border text-xs font-medium px-2.5 py-1.5 hover:bg-bg"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function Sidebar({
  categories,
  totalCount,
  view,
  onChangeView,
  selectedCategoryId,
  onSelectCategory,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  mobileOpen,
  onCloseMobile,
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(SWATCHES[1]);
  const [addError, setAddError] = useState("");
  const [addBusy, setAddBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) {
      setAddError("Name is required.");
      return;
    }
    setAddBusy(true);
    setAddError("");
    try {
      await onAddCategory(newName.trim(), newColor);
      setNewName("");
      setShowAddForm(false);
    } catch (err) {
      setAddError(err.message || "Failed to add category.");
    } finally {
      setAddBusy(false);
    }
  }

  function selectCategoryAndClose(id) {
    onSelectCategory(id);
    onCloseMobile?.();
  }

  return (
    <>
      {/* Mobile backdrop — only rendered/interactive when the drawer is open */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/40 md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 z-50 w-72 sm:w-64 flex-shrink-0 bg-sidebar border-r border-border h-screen px-4 py-6 flex flex-col transition-transform duration-200 md:translate-x-0 ${
          mobileOpen
            ? "translate-x-0 animate-[drawer-in_0.2s_ease-out]"
            : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5 px-1.5">
            <LogoMark />
            <span className="font-display text-lg font-semibold tracking-tight text-ink">
              TaskMaster Pro
            </span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close menu"
            className="md:hidden text-faint hover:text-ink p-1"
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

        {/* Dashboard first, then All Tasks — Team / Settings removed per spec */}
        <nav className="space-y-0.5">
          <button
            type="button"
            onClick={() => {
              onChangeView("dashboard");
              onCloseMobile?.();
            }}
            className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              view === "dashboard"
                ? "bg-surface text-accent shadow-[0_1px_2px_rgba(17,21,28,0.06)]"
                : "text-muted hover:bg-surface/60 hover:text-ink"
            }`}
          >
            <NavIcon path={DASHBOARD_ICON} />
            Dashboard
          </button>

          <button
            type="button"
            onClick={() => {
              onChangeView("tasks");
              selectCategoryAndClose(null);
            }}
            className={`w-full flex items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              view === "tasks" && selectedCategoryId === null
                ? "bg-surface text-accent shadow-[0_1px_2px_rgba(17,21,28,0.06)]"
                : "text-muted hover:bg-surface/60 hover:text-ink"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <NavIcon path={ALL_TASKS_ICON} />
              All Tasks
            </span>
            <span className="text-xs font-mono text-faint">{totalCount}</span>
          </button>
        </nav>

        <div className="mt-7 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between px-1.5 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-faint">
              Categories
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm((v) => !v)}
              aria-label="Add category"
              className="text-faint hover:text-accent transition-colors"
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
                  d="M12 5v14M5 12h14"
                />
              </svg>
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAdd} className="px-1.5 mb-2 space-y-2">
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Category name"
                className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
              />
              <div className="flex items-center gap-1.5">
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    aria-label={`Choose color ${c}`}
                    className="h-5 w-5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: c,
                      boxShadow:
                        newColor === c
                          ? `0 0 0 2px var(--color-sidebar), 0 0 0 4px ${c}`
                          : "none",
                    }}
                  />
                ))}
              </div>
              {addError && <p className="text-xs text-danger">{addError}</p>}
              <div className="flex gap-1.5">
                <button
                  type="submit"
                  disabled={addBusy}
                  className="rounded-lg bg-accent text-white text-xs font-medium px-2.5 py-1.5 hover:bg-accent-hover disabled:opacity-50"
                >
                  {addBusy ? "Adding…" : "Add"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-lg bg-surface border border-border text-xs font-medium px-2.5 py-1.5 hover:bg-bg"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-0.5 overflow-y-auto">
            {categories.length === 0 && !showAddForm && (
              <p className="px-3 py-2 text-xs text-faint">No categories yet.</p>
            )}
            {categories.map((cat) =>
              editingId === cat.id ? (
                <CategoryEditRow
                  key={cat.id}
                  category={cat}
                  onCancel={() => setEditingId(null)}
                  onSave={async (values) => {
                    await onUpdateCategory(cat.id, values);
                    setEditingId(null);
                  }}
                />
              ) : (
                <div
                  key={cat.id}
                  className={`group w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                    view === "tasks" && selectedCategoryId === cat.id
                      ? "bg-surface text-ink shadow-[0_1px_2px_rgba(17,21,28,0.06)]"
                      : "text-muted hover:bg-surface/60 hover:text-ink"
                  }`}
                  onClick={() => {
                    onChangeView("tasks");
                    selectCategoryAndClose(cat.id);
                  }}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate">{cat.name}</span>
                  </span>
                  <span className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-xs font-mono text-faint mr-0.5">
                      {cat.taskCount}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(cat.id);
                      }}
                      aria-label={`Edit ${cat.name}`}
                      className="text-faint hover:text-accent transition-colors p-0.5"
                    >
                      <svg
                        className="h-3.5 w-3.5"
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
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCategory(cat);
                      }}
                      aria-label={`Delete ${cat.name}`}
                      className="text-faint hover:text-danger transition-colors p-0.5"
                    >
                      <svg
                        className="h-3.5 w-3.5"
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
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
