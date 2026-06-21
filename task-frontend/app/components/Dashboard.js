"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAnalytics } from "../hooks/useAnalytics";
import DashboardSkeleton from "./DashboardSkeleton";

const RANGE_OPTIONS = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "3 months" },
  { value: "year", label: "This year" },
  { value: "all", label: "All time" },
];

const RANGE_LABELS = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 3 months",
  year: "This year",
  all: "All time",
};

function RangeFilter({ range, onChange }) {
  return (
    <div className="flex gap-1 bg-surface border border-border rounded-xl p-1 self-start overflow-x-auto">
      {RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
            range === opt.value
              ? "bg-accent-soft text-accent"
              : "text-muted hover:text-ink"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    let rafId;

    function step(timestamp) {
      if (startTimestamp === null) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setValue(Math.round(progress * target));
      if (progress < 1) rafId = requestAnimationFrame(step);
    }

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);

  return value;
}

function StatCard({ label, value, accent = "ink", suffix = "" }) {
  const animatedValue = useCountUp(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-border bg-surface p-4 sm:p-5"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-faint">
        {label}
      </p>
      <p
        className={`font-display text-2xl sm:text-3xl font-semibold mt-1.5 text-${accent}`}
      >
        {animatedValue}
        {suffix && (
          <span className="text-base font-medium text-faint ml-0.5">
            {suffix}
          </span>
        )}
      </p>
    </motion.div>
  );
}

/** SVG bar chart for the created-vs-completed trend. Bars animate in from
 *  0 height; hovering any column shows an exact-count tooltip; date labels
 *  thin themselves out automatically so they never overlap, no matter how
 *  many buckets are in the selected range. */
function TrendChart({ trend }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const width = 560;
  const height = 160;
  const barGap = 10;
  const groupWidth = width / trend.length;
  const barWidth = (groupWidth - barGap) / 2;
  const maxVal = Math.max(1, ...trend.flatMap((d) => [d.created, d.completed]));

  const bucketLabel = (iso) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

  // Cap visible labels to roughly 7-8 regardless of bucket count, so 30
  // daily bars (or more) never overlap their labels.
  const labelInterval = Math.max(1, Math.ceil(trend.length / 7));

  const hovered = hoveredIndex !== null ? trend[hoveredIndex] : null;
  const tooltipX =
    hoveredIndex !== null
      ? Math.min(
          Math.max(hoveredIndex * groupWidth + groupWidth / 2, 55),
          width - 55,
        )
      : 0;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height + 24}`}
        className="w-full min-w-[420px] h-48"
        role="img"
        aria-label="Tasks created vs completed over the selected period"
      >
        {trend.map((d, i) => {
          const x = i * groupWidth;
          const createdH = (d.created / maxVal) * height;
          const completedH = (d.completed / maxVal) * height;
          const delay = Math.min(i * 0.04, 0.6);
          const isHovered = hoveredIndex === i;

          return (
            <g
              key={d.date}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Wide invisible hit area — lets hovering anywhere in this
                  column trigger the tooltip, not just the thin bars. */}
              <rect
                x={x}
                y={0}
                width={groupWidth}
                height={height}
                fill="transparent"
              />

              {isHovered && (
                <rect
                  x={x}
                  y={0}
                  width={groupWidth}
                  height={height}
                  fill="var(--color-border)"
                  opacity={0.35}
                />
              )}

              <motion.rect
                initial={{ height: 0, y: height }}
                animate={{ height: createdH, y: height - createdH }}
                transition={{ duration: 0.5, delay, ease: "easeOut" }}
                x={x + barGap / 2}
                width={barWidth}
                rx={3}
                fill="var(--color-accent)"
                opacity={isHovered ? 1 : 0.85}
              />
              <motion.rect
                initial={{ height: 0, y: height }}
                animate={{ height: completedH, y: height - completedH }}
                transition={{ duration: 0.5, delay, ease: "easeOut" }}
                x={x + barGap / 2 + barWidth}
                width={barWidth}
                rx={3}
                fill="var(--color-success)"
                opacity={isHovered ? 1 : 0.85}
              />

              {i % labelInterval === 0 && (
                <text
                  x={x + groupWidth / 2}
                  y={height + 16}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--color-faint)"
                  fontFamily="var(--font-mono)"
                >
                  {bucketLabel(d.date)}
                </text>
              )}
            </g>
          );
        })}

        {hovered && (
          <g>
            <rect
              x={tooltipX - 52}
              y={4}
              width={104}
              height={46}
              rx={6}
              fill="var(--color-ink)"
              opacity={0.94}
            />
            <text
              x={tooltipX}
              y={18}
              textAnchor="middle"
              fontSize="9"
              fontFamily="var(--font-mono)"
              fill="white"
              opacity={0.7}
            >
              {bucketLabel(hovered.date)}
            </text>
            <text
              x={tooltipX}
              y={31}
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill="#8fa3ff"
            >
              Created: {hovered.created}
            </text>
            <text
              x={tooltipX}
              y={44}
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill="#5fe0ad"
            >
              Completed: {hovered.completed}
            </text>
          </g>
        )}
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
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: c.color }}
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

function DashboardContent({ data, range, onNavigateToTasks }) {
  const {
    totals,
    dueTodayTasks,
    completedToday,
    completedThisWeek,
    byCategory,
    recentTasks,
    trend,
  } = data;

  const [showDueToday, setShowDueToday] = useState(false);

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
              {RANGE_LABELS[range]}
            </h3>
            <span className="text-xs font-mono text-faint">
              {completedToday} done today · {completedThisWeek} this week
            </span>
          </div>
          <TrendChart key={range} trend={trend} />
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
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${totals.completionRate}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full bg-success"
            />
          </div>
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowDueToday((v) => !v)}
              disabled={totals.dueToday === 0}
              className="flex items-center gap-1.5 text-xs text-faint hover:text-ink transition-colors disabled:cursor-default disabled:hover:text-faint"
            >
              <span>
                {totals.dueToday} task{totals.dueToday === 1 ? "" : "s"} due
                today
              </span>
              {totals.dueToday > 0 && (
                <svg
                  className={`h-3.5 w-3.5 transition-transform ${showDueToday ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              )}
            </button>

            <AnimatePresence>
              {showDueToday && totals.dueToday > 0 && (
                <motion.ul
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-2 space-y-1.5 overflow-hidden"
                >
                  {dueTodayTasks.map((t) => (
                    <li
                      key={t.id}
                      className="text-sm text-ink flex items-center gap-2"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
                      <span className="truncate">{t.title}</span>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
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

export default function Dashboard({ onNavigateToTasks }) {
  const [range, setRange] = useState("7d");
  const { data, loading, error, refetch } = useAnalytics(range);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex justify-end">
        <RangeFilter range={range} onChange={setRange} />
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
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
      ) : (
        <DashboardContent
          data={data}
          range={range}
          onNavigateToTasks={onNavigateToTasks}
        />
      )}
    </div>
  );
}
