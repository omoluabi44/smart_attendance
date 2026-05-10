"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { montserrat } from "@/app/ui/fonts";
import {
  useGetStudentSessionsQuery,
  useGetAvailableSessionsQuery,
  useStudentEnrollMutation,
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
} from "@/app/lib/api/facepassApi";
import {
  AcademicCapIcon,
  BellAlertIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
  XMarkIcon,
  PlusIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

export default function StudentDashboard() {
  const user = useSelector((state) => state.user);
  const { data: sessionsData, isLoading } = useGetStudentSessionsQuery();
  const { data: notifData } = useGetNotificationsQuery();
  const [markAllRead] = useMarkAllNotificationsReadMutation();

  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const sessions = sessionsData?.data || [];
  const notifications = notifData?.data || [];
  const unreadCount = notifData?.unread_count || 0;

  // Check for any warning/danger sessions
  const hasWarning = sessions.some((s) => s.warning);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* ── Top Bar ── */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className={`${montserrat.className} text-2xl font-black text-slate-900`}>
              facePass <span className="text-blue-500">Student</span>
            </h1>
            <p className="text-slate-500 text-xs font-semibold mt-1 uppercase tracking-widest">
              My Attendance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setShowNotifications(!showNotifications); }}
              className="relative p-2.5 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
            >
              <BellAlertIcon className="h-5 w-5 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowEnrollModal(true)}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-600 transition shadow-lg shadow-blue-200"
            >
              <PlusIcon className="h-4 w-4" /> Enroll in Session
            </button>
          </div>
        </div>
      </div>

      {/* ── Warning Banner ── */}
      {hasWarning && (
        <div className="max-w-5xl mx-auto px-6 mt-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
            <div className="bg-amber-100 p-2 rounded-xl">
              <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-amber-800 text-sm">Attendance Warning</h3>
              <p className="text-amber-700 text-xs">
                You have sessions where your attendance is close to or below the 75% eligibility threshold. Check your sessions below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Notifications Dropdown ── */}
      {showNotifications && (
        <div className="max-w-5xl mx-auto px-6 mt-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl p-4 max-h-80 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-slate-800 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={() => markAllRead()} className="text-xs text-blue-500 font-bold hover:underline">
                  Mark all as read
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">No notifications.</p>
            ) : (
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div key={n.id} className={`p-3 rounded-xl text-sm ${n.is_read ? "bg-slate-50" : "bg-blue-50 border border-blue-100"}`}>
                    <p className="font-bold text-slate-800">{n.title}</p>
                    <p className="text-slate-500 text-xs mt-1">{n.message}</p>
                    <p className="text-slate-300 text-[10px] mt-1">{n.created_at}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Sessions Grid ── */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-lg font-bold text-slate-800 mb-6">My Enrolled Sessions</h2>

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse h-56 border border-slate-100" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20">
            <AcademicCapIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-500 mb-2">No Sessions Yet</h3>
            <p className="text-slate-400 mb-6">Enroll in a session to start tracking your attendance.</p>
            <button
              onClick={() => setShowEnrollModal(true)}
              className="bg-blue-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-600 transition"
            >
              Browse Sessions
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {sessions.map((s) => (
              <Link
                key={s.id}
                href={`/student/${s.id}`}
                className={`group bg-white rounded-2xl p-6 border transition-all duration-300 hover:shadow-lg ${
                  s.warning === "danger"
                    ? "border-red-200 hover:shadow-red-50"
                    : s.warning === "warning"
                    ? "border-amber-200 hover:shadow-amber-50"
                    : "border-slate-100 hover:shadow-blue-50 hover:border-blue-200"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-blue-50 p-2.5 rounded-xl">
                    <AcademicCapIcon className="h-6 w-6 text-blue-500" />
                  </div>
                  {s.eligible ? (
                    <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1">
                      <CheckBadgeIcon className="h-3.5 w-3.5" /> Eligible
                    </span>
                  ) : (
                    <span className="bg-red-50 text-red-600 text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1">
                      <ExclamationTriangleIcon className="h-3.5 w-3.5" /> Ineligible
                    </span>
                  )}
                </div>

                <h3 className="font-black text-slate-900 text-lg">{s.courseID}</h3>
                <p className="text-slate-500 text-sm font-medium mb-4">{s.course_name}</p>

                {/* Progress Ring */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-14 h-14">
                    <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                      <path className="text-slate-100" stroke="currentColor" strokeWidth="3" fill="none" d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path
                        className={s.percentage >= 75 ? "text-emerald-500" : s.percentage >= 65 ? "text-amber-500" : "text-red-500"}
                        stroke="currentColor" strokeWidth="3" fill="none"
                        strokeDasharray={`${Math.min(s.percentage, 100)}, 100`}
                        strokeLinecap="round"
                        d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-700">
                      {s.percentage}%
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <p><span className="font-bold text-slate-600">{s.days_present}</span> present</p>
                    <p><span className="font-bold text-slate-600">{s.days_absent}</span> absent</p>
                    <p><span className="font-bold text-slate-600">{s.days_excused}</span> excused</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold text-slate-400 border-t border-slate-50 pt-4">
                  <span className="flex items-center gap-1">
                    <CalendarDaysIcon className="h-3.5 w-3.5" /> {s.session_name}
                  </span>
                  {s.lecturers?.length > 0 && (
                    <span>By: {s.lecturers.map((l) => l.name).join(", ")}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Enroll Modal ── */}
      {showEnrollModal && (
        <EnrollModal onClose={() => setShowEnrollModal(false)} />
      )}
    </div>
  );
}

function EnrollModal({ onClose }) {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useGetAvailableSessionsQuery(search);
  const [enroll, { isLoading: enrolling }] = useStudentEnrollMutation();

  const sessions = data?.data || [];

  const handleEnroll = async (sessionId) => {
    try {
      await enroll({ session_id: sessionId }).unwrap();
      toast.success("Enrolled successfully!");
    } catch (err) {
      toast.error(err?.data?.error || "Failed to enroll");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl relative max-h-[80vh] flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-xl transition">
          <XMarkIcon className="h-5 w-5 text-slate-400" />
        </button>
        <h2 className="text-xl font-black text-slate-900 mb-4">Browse Sessions</h2>

        <div className="relative mb-4">
          <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by course code (e.g. PHY)"
            className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-slate-400 text-sm">Searching...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">No sessions found.</div>
          ) : (
            sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-bold text-slate-800 text-sm">{s.courseID} — {s.course_name}</p>
                  <p className="text-xs text-slate-400">{s.session_name} • {s.enrolled_students} students</p>
                  {s.lecturers?.length > 0 && (
                    <p className="text-xs text-slate-400 mt-0.5">Lecturer: {s.lecturers.map((l) => l.name).join(", ")}</p>
                  )}
                </div>
                <button
                  onClick={() => handleEnroll(s.id)}
                  disabled={enrolling}
                  className="bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-600 transition"
                >
                  Enroll
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
