"use client";

import { Menu, ShieldCheck } from "lucide-react";

export default function TopBar({
  onMenuClick,
  title = "Dashboard",
  subtitle = "System Workspace",
  actions = null,
}) {
  return (
    <header className="sticky top-0 z-20 backdrop-blur-md bg-white/90 border-b border-slate-200/80">
      <div className="w-full px-3 sm:px-6 lg:px-8 min-h-[3.5rem] sm:h-16 py-2 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile hamburger trigger + Breadcrumbs */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition focus:outline-none shrink-0"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
                {title}
              </span>
            </div>
            {subtitle && (
              <span className="text-[11px] font-sans text-slate-500 hidden sm:inline-block truncate">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Right: Context actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {actions}
        </div>
      </div>
    </header>
  );
}
