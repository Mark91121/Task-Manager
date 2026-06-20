"use client";

/** Compact top bar shown only on mobile/tablet to open the sidebar drawer. */
export default function MobileTopbar({ onOpenMenu, heading }) {
  return (
    <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 bg-surface/95 backdrop-blur border-b border-border px-4 py-3">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open menu"
        className="text-ink p-1.5 -ml-1.5 rounded-lg hover:bg-bg transition-colors"
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
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
      <span className="font-display text-sm font-semibold text-ink truncate">
        {heading}
      </span>
    </div>
  );
}
