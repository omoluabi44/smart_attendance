"use client";

import { Menu, ShieldCheck } from "lucide-react";

export default function TopBar({
  onMenuClick,
  title = "Dashboard",
  subtitle = "System Workspace",
  actions = null,
}) {
  return (
    <header className="sticky top-0 z-20 backdrop-blur-md bg-white/85 border-b border-slate-200/80">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger trigger + Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                {title}
              </span>
            </div>
            {subtitle && (
              <span className="text-[11px] font-sans text-slate-500 hidden sm:inline-block">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Right: Context actions */}
        <div className="flex items-center gap-2.5">
          {actions}
        </div>
      </div>
    </header>
  );
}
