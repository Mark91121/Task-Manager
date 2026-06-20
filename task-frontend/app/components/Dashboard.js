"use client";

import { useAnalytics } from "../hooks/useAnalytics";
import DashboardSkeleton from "./DashboardSkeleton";

function StatCard({ label, value, accent = "ink", suffix = "" }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-faint">
        {label}
      </p>
      <p
        className={`font-display text-2xl sm:text-3xl font-semibold mt-1.5 text-${accent}`}
      >
        {value}
        {suffix && (
          <span className="text-base font-medium text-faint ml-0.5">
            {suffix}
          </span>
        )}
      </p>
    </div>
  );
}

/** Simple dependency-free SVG bar chart for the 7-day created-vs-completed trend. */
function TrendChart({ trend }) {
  const width = 560;
  const height = 160;
  const barGap = 10;
  const groupWidth = width / trend.length;
  const barWidth = (groupWidth - barGap) / 2;
  const maxVal = Math.max(1, ...trend.flatMap((d) => [d.created, d.completed]));

  const dayLabel = (iso) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
      weekday: "short",
    });

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height + 24}`}
        className="w-full min-w-[420px] h-44"
        role="img"
        aria-label="Tasks created vs completed over the last 7 days"
      >
        {trend.map((d, i) => {
          const x = i * groupWidth;
          const createdH = (d.created / maxVal) * height;
          const completedH = (d.completed / maxVal) * height;
          return (
            <g key={d.date}>
              <rect
                x={x + barGap / 2}
                y={height - createdH}
                width={barWidth}
                height={createdH}
                rx={3}
                fill="var(--color-accent)"
                opacity={0.85}
              />
              <rect
                x={x + barGap / 2 + barWidth}
                y={height - completedH}
                width={barWidth}
                height={completedH}
                rx={3}
                fill="var(--color-success)"
                opacity={0.85}
              />
              <text
                x={x + groupWidth / 2}
                y={height + 16}
                textAnchor="middle"
                fontSize="10"
                fill="var(--color-faint)"
                fontFamily="var(--font-mono)"
              >
                {dayLabel(d.date)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex items-center gap-4 mt-1 px-1">
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <span className="h-2 w-2 rounded-full bg-accent" /> Created
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <span className="h-2 w-2 rounded-full bg-success" /> Completed
        </span>
      </div>
    </div>
  );
}

function CategoryBreakdown({ categories }) {
  if (categories.length === 0) {
    return <p className="text-sm text-faint">No categories yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {categories.map((c) => {
        const pct = c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0;
        return (
          <li key={c.id}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="flex items-center gap-1.5 font-medium text-ink min-w-0">
                <span
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: c.color }}
                />
                <span className="truncate">{c.name}</span>
              </span>
              <span className="text-xs font-mono text-faint flex-shrink-0 ml-2">
                {c.completed}/{c.total}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-bg overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: c.color }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function RecentActivity({ tasks }) {
  if (tasks.length === 0) {
    return <p className="text-sm text-faint">No recent activity.</p>;
  }

  return (
    <ul className="space-y-2.5">
      {tasks.map((t) => (
        <li key={t.id} className="flex items-start gap-2.5 text-sm">
          <span
            className={`mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${
              t.completed ? "bg-success" : "bg-accent"
            }`}
          />
          <span className="min-w-0">
            <span
              className={`block truncate ${t.completed ? "text-faint line-through" : "text-ink"}`}
            >
              {t.title}
            </span>
            {t.category && (
              <span className="text-xs text-faint">{t.category.name}</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function Dashboard({ onNavigateToTasks }) {
  const { data, loading, error, refetch } = useAnalytics();

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="rounded-2xl border border-danger/20 bg-danger-soft p-6 text-center">
        <p className="text-sm font-medium text-danger">{error}</p>
        <button
          type="button"
          onClick={refetch}
          className="mt-3 text-sm font-medium text-accent hover:text-accent-hover"
        >
          Try again
        </button>
      </div>
    );
  }

  const {
    totals,
    completedToday,
    completedThisWeek,
    byCategory,
    recentTasks,
    trend,
  } = data;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total tasks" value={totals.total} />
        <StatCard label="Active" value={totals.active} accent="accent" />
        <StatCard label="Completed" value={totals.completed} accent="success" />
        <StatCard
          label="Overdue"
          value={totals.overdue}
          accent={totals.overdue > 0 ? "danger" : "ink"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-sm font-semibold text-ink">
              Last 7 days
            </h3>
            <span className="text-xs font-mono text-faint">
              {completedToday} done today · {completedThisWeek} this week
            </span>
          </div>
          <TrendChart trend={trend} />
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="font-display text-sm font-semibold text-ink mb-4">
            By category
          </h3>
          <CategoryBreakdown categories={byCategory} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-display text-sm font-semibold text-ink">
              Completion rate
            </h3>
            <span className="text-xs font-mono text-faint">
              {totals.completionRate}%
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-bg overflow-hidden mt-3">
            <div
              className="h-full rounded-full bg-success transition-all"
              style={{ width: `${totals.completionRate}%` }}
            />
          </div>
          <p className="text-xs text-faint mt-3">
            {totals.dueToday} task{totals.dueToday === 1 ? "" : "s"} due today.{" "}
            <button
              type="button"
              onClick={onNavigateToTasks}
              className="text-accent hover:text-accent-hover font-medium"
            >
              View all tasks →
            </button>
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="font-display text-sm font-semibold text-ink mb-4">
            Recent activity
          </h3>
          <RecentActivity tasks={recentTasks} />
        </div>
      </div>
    </div>
  );
}
