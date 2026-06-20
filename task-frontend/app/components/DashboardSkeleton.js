/** Skeleton placeholders for the dashboard's stat cards + chart + lists while analytics loads. */
export default function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-surface p-4 space-y-2.5"
          >
            <span className="skeleton block h-3 w-2/3 rounded-md" />
            <span className="skeleton block h-7 w-1/3 rounded-md" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-surface p-5 space-y-3">
          <span className="skeleton block h-4 w-1/4 rounded-md" />
          <span className="skeleton block h-40 w-full rounded-xl" />
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
          <span className="skeleton block h-4 w-1/2 rounded-md" />
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className="skeleton block h-3 w-full rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}
