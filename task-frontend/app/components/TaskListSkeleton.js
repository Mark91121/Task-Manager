/**
 * Skeleton placeholder rows shown while tasks are loading, instead of a
 * spinner or "loading…" text. Mirrors the real TaskItem layout/dimensions
 * so there's no layout shift once real data arrives.
 */
export default function TaskListSkeleton({ count = 5 }) {
  return (
    <ul className="space-y-2.5" aria-busy="true" aria-label="Loading tasks">
      {Array.from({ length: count }).map((_, i) => (
        <li
          key={i}
          className="rounded-2xl border border-border bg-surface p-4 pl-5 flex items-start gap-3"
        >
          <span className="skeleton mt-0.5 h-5 w-5 flex-shrink-0 rounded-md" />
          <div className="flex-1 min-w-0 space-y-2">
            <span
              className="skeleton block h-4 rounded-md"
              style={{ width: `${55 + ((i * 13) % 30)}%` }}
            />
            <span
              className="skeleton block h-3 rounded-md"
              style={{ width: `${30 + ((i * 17) % 25)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
