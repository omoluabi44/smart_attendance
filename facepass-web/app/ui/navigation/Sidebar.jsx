"use client";

import Link from "next/link";
import CPLogo from "@/app/ui/CPLogo";
import {
  Users,
  Calendar,
  BookOpen,
  LayoutDashboard,
  UserPlus,
  LogOut,
  ShieldCheck,
  ChevronRight,
  PlusCircle,
  X,
  Server,
} from "lucide-react";

export default function Sidebar({
  user,
  role = "admin",
  activeTab,
  setActiveTab,
  onProvisionClick,
  onCreateCourseClick,
  onCreateSessionClick,
  onLogout,
  isOpen = false,
  setIsOpen = () => {},
  badges = {},
}) {
  const isAdmin = user?.role === "admin" || role === "admin";
  const userInitials = (user?.name || user?.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleNavClick = (tabKey) => {
    if (setActiveTab) {
      setActiveTab(tabKey);
    }
    setIsOpen(false);
  };

  const navContent = (
    <div className="flex flex-col h-full bg-white text-slate-800">
      {/* ── Brand & Architecture Header ── */}
      <div className="p-5 border-b border-slate-200/80">
        <div className="flex items-center justify-between">
          <Link
            href={isAdmin ? "/admin" : "/lecturer"}
            onClick={() => setIsOpen(false)}
            className="focus:outline-none flex items-center gap-2"
          >
            <CPLogo theme="light" size="sm" />
          </Link>

          {/* Mobile close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-md bg-obsidian-950 text-white text-[10px] font-sans font-semibold tracking-wider">
            {isAdmin ? "ADMIN // GOVERNANCE" : "FACULTY // OPERATIONS"}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200/80 text-[10px] font-sans font-medium text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {isAdmin ? "SUPER ADMIN" : "ACTIVE"}
          </span>
        </div>
      </div>

      {/* ── Authenticated User Identity Card ── */}
      <div className="p-4 mx-3 my-3 rounded-xl bg-slate-50 border border-slate-200/70">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">
              {user?.name || "System Administrator"}
            </p>
            <p className="text-[11px] font-sans text-slate-500 truncate" title={user?.email}>
              {user?.email || "admin@coursepass.app"}
            </p>
          </div>
        </div>
        {user?.matric && (
          <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-sans text-slate-500">
            <span>ID / MATRIC</span>
            <span className="font-semibold text-slate-700">{user.matric}</span>
          </div>
        )}
      </div>

      {/* ── Primary Navigation Links ── */}
      <div className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1 text-[10px] font-sans uppercase tracking-wider text-slate-400">
          Navigation
        </div>

        {isAdmin && (
          <>
            <button
              onClick={() => handleNavClick("users")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                activeTab === "users"
                  ? "bg-blue-500 text-white shadow-sm shadow-blue-500/20 font-semibold"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className={`w-4 h-4 ${activeTab === "users" ? "text-white" : "text-slate-500"}`} />
                <span>Faculty & Accounts</span>
              </div>
              {badges.usersCount !== undefined && (
                <span
                  className={`text-[10px] font-sans px-1.5 py-0.5 rounded ${
                    activeTab === "users"
                      ? "bg-white/20 text-white"
                      : "bg-slate-200/70 text-slate-700"
                  }`}
                >
                  {badges.usersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleNavClick("sessions")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                activeTab === "sessions"
                  ? "bg-blue-500 text-white shadow-sm shadow-blue-500/20 font-semibold"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Calendar className={`w-4 h-4 ${activeTab === "sessions" ? "text-white" : "text-slate-500"}`} />
                <span>Courses & Sessions</span>
              </div>
              {badges.sessionsCount !== undefined && (
                <span
                  className={`text-[10px] font-sans px-1.5 py-0.5 rounded ${
                    activeTab === "sessions"
                      ? "bg-white/20 text-white"
                      : "bg-slate-200/70 text-slate-700"
                  }`}
                >
                  {badges.sessionsCount}
                </span>
              )}
            </button>

            <div className="pt-2">
              <div className="px-3 py-1 text-[10px] font-sans uppercase tracking-wider text-slate-400">
                Workspaces
              </div>
              <Link
                href="/lecturer"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-blue-50/60 hover:text-blue-600 transition"
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4 text-blue-500" />
                  <span>Lecturer Console</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </>
        )}

        {!isAdmin && (
          <>
            <Link
              href="/lecturer"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-blue-500 text-white shadow-sm shadow-blue-500/20"
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 text-white" />
                <span>Lecturer Dashboard</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-white/80" />
            </Link>

            {user?.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Admin Console</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            )}
          </>
        )}

        {/* ── Quick Action Triggers ── */}
        <div className="pt-3">
          <div className="px-3 py-1 text-[10px] font-sans uppercase tracking-wider text-slate-400">
            Quick Actions
          </div>
          {isAdmin && onProvisionClick && (
            <button
              onClick={() => {
                onProvisionClick();
                setIsOpen(false);
              }}
              className="w-full mt-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100/80 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Provision Lecturer</span>
            </button>
          )}

          {onCreateCourseClick && (
            <button
              onClick={() => {
                onCreateCourseClick();
                setIsOpen(false);
              }}
              className="w-full mt-1.5 flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
            >
              <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>New Course</span>
            </button>
          )}

          {onCreateSessionClick && (
            <button
              onClick={() => {
                onCreateSessionClick();
                setIsOpen(false);
              }}
              className="w-full mt-1 flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
            >
              <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>New Session</span>
            </button>
          )}
        </div>
      </div>

      {/* ── System Status & Sign Out ── */}
      <div className="p-3 border-t border-slate-200/80 space-y-2">
        <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-between text-[10px] font-sans text-slate-500">
          <span className="flex items-center gap-1.5">
            <Server className="w-3 h-3 text-emerald-500" />
            ENGINE
          </span>
          <span className="text-emerald-600 font-semibold">CONNECTED</span>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop Permanent Sidebar ── */}
      <aside className="hidden lg:flex lg:flex-col fixed inset-y-0 left-0 w-64 xl:w-72 border-r border-slate-200/80 z-30 shadow-2xs">
        {navContent}
      </aside>

      {/* ── Mobile Off-Canvas Drawer with Backdrop ── */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          />

          {/* Slide-in Sidebar Panel */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full shadow-2xl z-10 animate-fade-in-up">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
