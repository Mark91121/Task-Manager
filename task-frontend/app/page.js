"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "./components/Sidebar";
import TaskForm from "./components/TaskForm";
import SearchFilterBar from "./components/SearchFilterBar";
import TaskList from "./components/TaskList";
import TaskListSkeleton from "./components/TaskListSkeleton";
import Dashboard from "./components/Dashboard";
import MobileTopbar from "./components/MobileTopbar";
import ConfirmDialog from "./components/ConfirmDialog";
import { useToast } from "./components/ToastProvider";
import { api } from "./lib/api";

function HomeContent() {
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read initial view/category straight from the URL on first load,
  // so a refresh lands back where the user was instead of resetting
  // to the dashboard.
  const [view, setView] = useState(
    () => searchParams.get("view") || "dashboard",
  );
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allTasksCount, setAllTasksCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    () => searchParams.get("category") || null,
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [categoryDeleteBusy, setCategoryDeleteBusy] = useState(false);

  // Keep the URL in sync with view/category so refresh, back/forward,
  // and shared links all land on the right section instead of always
  // resetting to the dashboard.
  useEffect(() => {
    const params = new URLSearchParams();
    if (view === "tasks") {
      params.set("view", "tasks");
      if (selectedCategoryId) params.set("category", selectedCategoryId);
    }
    const query = params.toString();
    router.replace(query ? `/?${query}` : "/", { scroll: false });
  }, [view, selectedCategoryId, router]);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await api.get("/categories");
      setCategories(data);
    } catch (err) {
      toast.error(err.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTasks = useCallback(
    async (currentSearch, currentFilter, currentCategoryId) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (currentSearch) params.set("search", currentSearch);
        if (currentFilter && currentFilter !== "All")
          params.set("filter", currentFilter);
        if (currentCategoryId) params.set("categoryId", currentCategoryId);

        const data = await api.get(`/tasks?${params.toString()}`);
        setTasks(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    api
      .get("/tasks")
      .then((data) => setAllTasksCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {});
  }, [tasks]);

  useEffect(() => {
    if (view !== "tasks") return undefined;
    const timeoutId = setTimeout(() => {
      fetchTasks(search, filter, selectedCategoryId);
    }, 350);
    return () => clearTimeout(timeoutId);
  }, [search, filter, selectedCategoryId, fetchTasks, view]);

  async function handleSubmitTask(values) {
    const isEditing = Boolean(editingTask);
    try {
      if (isEditing) {
        await api.put(`/tasks/${editingTask.id}`, values);
        toast.success("Task updated successfully.");
      } else {
        await api.post("/tasks", values);
        toast.success("Task added successfully.");
      }
      await Promise.all([
        fetchTasks(search, filter, selectedCategoryId),
        fetchCategories(),
      ]);
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }

  async function handleToggle(id, completed) {
    try {
      const updated = await api.put(`/tasks/${id}`, { completed });
      setTasks((prev) => {
        if (filter !== "All") return prev.filter((t) => t.id !== id);
        const next = prev.map((t) => (t.id === id ? updated : t));
        return [...next].sort((a, b) => {
          if (a.completed !== b.completed) return a.completed ? 1 : -1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
      });
      toast.success(
        completed ? "Task marked as completed." : "Task marked as active.",
      );
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      toast.success("Task deleted successfully.");
      fetchCategories();
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }

  async function handleAddCategory(name, color) {
    try {
      await api.post("/categories", { name, color });
      toast.success("Category added successfully.");
      await fetchCategories();
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }

  async function handleUpdateCategory(id, values) {
    try {
      await api.put(`/categories/${id}`, values);
      toast.success("Category updated successfully.");
      await Promise.all([
        fetchCategories(),
        fetchTasks(search, filter, selectedCategoryId),
      ]);
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }

  function requestDeleteCategory(category) {
    setCategoryToDelete({ ...category, taskCount: category.taskCount });
  }

  async function confirmDeleteCategory(forceReassign) {
    if (!categoryToDelete) return;
    setCategoryDeleteBusy(true);
    try {
      await api.delete(
        `/categories/${categoryToDelete.id}${forceReassign ? "?reassign=true" : ""}`,
      );
      toast.success("Category deleted successfully.");
      if (selectedCategoryId === categoryToDelete.id)
        setSelectedCategoryId(null);
      setCategoryToDelete(null);
      await Promise.all([
        fetchCategories(),
        fetchTasks(
          search,
          filter,
          selectedCategoryId === categoryToDelete.id
            ? null
            : selectedCategoryId,
        ),
      ]);
    } catch (err) {
      if (err.code === "CATEGORY_HAS_TASKS") {
        setCategoryToDelete((prev) => ({
          ...prev,
          blocked: true,
          taskCount: err.taskCount,
        }));
      } else {
        toast.error(err.message);
      }
    } finally {
      setCategoryDeleteBusy(false);
    }
  }

  function openCreateForm() {
    setEditingTask(null);
    setFormOpen(true);
  }

  function openEditForm(task) {
    setEditingTask(task);
    setFormOpen(true);
  }

  const activeCount = tasks.filter((t) => !t.completed).length;
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const heading =
    view === "dashboard"
      ? "Dashboard"
      : selectedCategory
        ? selectedCategory.name
        : "All Tasks";

  return (
    <div className="flex">
      <Sidebar
        categories={categories}
        totalCount={allTasksCount}
        view={view}
        onChangeView={setView}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        onAddCategory={handleAddCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={requestDeleteCategory}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <main className="flex-1 min-h-screen min-w-0">
        {/* Sticky header zone: mobile topbar + page title/actions + the
            search/filter bar all stay pinned to the top of the content
            area while the task list scrolls underneath, so search and
            filters stay reachable without scrolling back up. */}
        <div className="sticky top-0 z-30 bg-bg border-b border-border">
          <MobileTopbar
            onOpenMenu={() => setMobileMenuOpen(true)}
            heading={heading}
          />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-4 sm:pb-5">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="font-display text-xl sm:text-2xl lg:text-[1.7rem] font-semibold tracking-tight text-ink leading-tight truncate">
                  {heading}
                </h1>
                {view === "tasks" && (
                  <p className="text-xs font-mono text-muted mt-0.5 tracking-wide">
                    {loading
                      ? "syncing…"
                      : `${activeCount} active · ${tasks.length} total`}
                  </p>
                )}
              </div>

              {view === "tasks" && (
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3.5 sm:px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors shadow-[0_1px_2px_rgba(79,110,247,0.3)]"
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
                  <span className="hidden xs:inline">Add New Task</span>
                  <span className="xs:hidden">Add</span>
                </button>
              )}
            </header>

            {view === "tasks" && (
              <div className="mt-4 sm:mt-5">
                <SearchFilterBar
                  search={search}
                  onSearchChange={setSearch}
                  filter={filter}
                  onFilterChange={setFilter}
                />
              </div>
            )}
          </div>
        </div>

        {/* Scrollable content zone — only this part moves under the sticky
            header above. */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-7 pb-6 sm:pb-10 lg:pb-12">
          {view === "dashboard" ? (
            <Dashboard
              onNavigateToTasks={() => {
                setView("tasks");
                setSelectedCategoryId(null);
              }}
            />
          ) : (
            <div className="space-y-6">
              {error && (
                <p className="text-sm text-danger bg-danger-soft rounded-xl px-3.5 py-2.5">
                  {error}
                </p>
              )}

              {loading ? (
                <TaskListSkeleton />
              ) : (
                <TaskList
                  tasks={tasks}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onRequestEdit={openEditForm}
                  hasActiveFilters={Boolean(search) || filter !== "All"}
                />
              )}
            </div>
          )}
        </div>
      </main>

      <TaskForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmitTask}
        categories={categories}
        initialTask={editingTask}
        defaultCategoryId={selectedCategoryId}
      />

      <ConfirmDialog
        open={Boolean(categoryToDelete)}
        title={
          categoryToDelete?.blocked
            ? "Category still in use"
            : "Delete category?"
        }
        message={
          categoryToDelete?.blocked
            ? `"${categoryToDelete?.name}" has ${categoryToDelete?.taskCount} task(s) assigned to it. Deleting it will move those tasks to "No category" — they will not be deleted.`
            : `Delete "${categoryToDelete?.name}"? This cannot be undone.`
        }
        confirmLabel={categoryToDelete?.blocked ? "Delete anyway" : "Delete"}
        busy={categoryDeleteBusy}
        onConfirm={() => confirmDeleteCategory(categoryToDelete?.blocked)}
        onCancel={() => setCategoryToDelete(null)}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
