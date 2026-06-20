"use client";

const FILTERS = ["All", "Active", "Completed"];

export default function SearchFilterBar({
  search,
  onSearchChange,
  filter,
  onFilterChange,
}) {
  return (
    <div className="flex flex-col xs:flex-row gap-3 xs:items-center xs:justify-between">
      <div className="relative flex-1 min-w-0">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-faint"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
          />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks by name…"
          className="w-full rounded-xl border border-border bg-surface pl-10 pr-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow"
        />
      </div>

      <div className="flex gap-1 bg-surface border border-border rounded-xl p-1 self-start xs:self-auto overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onFilterChange(f)}
            className={`px-3 sm:px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              filter === f
                ? "bg-accent-soft text-accent"
                : "text-muted hover:text-ink"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
    </div>
  );
}
