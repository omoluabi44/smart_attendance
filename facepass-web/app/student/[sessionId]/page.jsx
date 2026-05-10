"use client";

import { useParams } from "next/navigation";
import { montserrat } from "@/app/ui/fonts";
import { useGetStudentAttendanceQuery } from "@/app/lib/api/facepassApi";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

export default function StudentSessionDetail() {
  const { sessionId } = useParams();
  const { data, isLoading } = useGetStudentAttendanceQuery(sessionId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-pulse text-slate-400 text-lg font-bold">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <p className="text-slate-500 font-bold">Session not found or not enrolled.</p>
      </div>
    );
  }

  const { session, summary, history } = data;
  const percentage = summary.percentage;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center gap-4">
          <Link href="/student" className="p-2 hover:bg-slate-100 rounded-xl transition">
            <ArrowLeftIcon className="h-5 w-5 text-slate-400" />
          </Link>
          <div>
            <h1 className={`${montserrat.className} text-xl font-black text-slate-900`}>
              {session.courseID} — <span className="text-blue-500">{session.course_name}</span>
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Session {session.session_name}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* ── Eligibility Banner ── */}
        {summary.eligible ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-4 mb-8">
            <div className="bg-emerald-100 p-3 rounded-xl">
              <ShieldCheckIcon className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-black text-emerald-800 text-lg">You Are Eligible ✅</h3>
              <p className="text-emerald-600 text-sm">
                Your attendance is at {percentage}%, above the 75% required threshold.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-4 mb-8">
            <div className="bg-red-100 p-3 rounded-xl">
              <ExclamationTriangleIcon className="h-7 w-7 text-red-600" />
            </div>
            <div>
              <h3 className="font-black text-red-800 text-lg">Attendance Below Threshold 🚨</h3>
              <p className="text-red-600 text-sm">
                Your attendance is at {percentage}%. You need at least 75% to be eligible for exams.
                {summary.classes_remaining > 0 && ` You have ${summary.classes_remaining} classes remaining.`}
              </p>
            </div>
          </div>
        )}

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard value={summary.days_present} label="Present" color="emerald" />
          <StatCard value={summary.days_absent} label="Absent" color="red" />
          <StatCard value={summary.days_excused} label="Excused" color="blue" />
          <StatCard value={`${percentage}%`} label="Overall" color={percentage >= 75 ? "emerald" : "amber"} />
        </div>

        {/* ── Progress Bar ── */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800 text-sm">Progress Toward 75%</h3>
            <span className={`text-xs font-black px-3 py-1 rounded-full ${
              percentage >= 75 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
            }`}>
              {percentage >= 75 ? "On Track" : `${(75 - percentage).toFixed(1)}% more needed`}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                percentage >= 75 ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                : percentage >= 65 ? "bg-gradient-to-r from-amber-400 to-amber-500"
                : "bg-gradient-to-r from-red-400 to-red-500"
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-bold text-slate-300 mt-1.5">
            <span>0%</span>
            <span className="text-amber-400">75% threshold</span>
            <span>100%</span>
          </div>
        </div>

        {/* ── Attendance History ── */}
        <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
          <ClockIcon className="h-4 w-4" /> Attendance Log
        </h3>

        {history.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 text-center py-12 text-slate-400 font-bold">
            No attendance records yet.
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((entry) => (
              <div
                key={entry.log_id}
                className={`bg-white rounded-xl border p-4 flex items-center justify-between transition ${
                  entry.status === "present"
                    ? "border-emerald-100"
                    : entry.status === "excused"
                    ? "border-blue-100"
                    : "border-red-100"
                }`}
              >
                <div className="flex items-center gap-4">
                  {entry.status === "present" ? (
                    <div className="bg-emerald-50 p-2 rounded-lg">
                      <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                    </div>
                  ) : entry.status === "excused" ? (
                    <div className="bg-blue-50 p-2 rounded-lg">
                      <ShieldCheckIcon className="h-5 w-5 text-blue-500" />
                    </div>
                  ) : (
                    <div className="bg-red-50 p-2 rounded-lg">
                      <XCircleIcon className="h-5 w-5 text-red-500" />
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-slate-800 text-sm capitalize">{entry.status}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-2">
                      <CalendarDaysIcon className="h-3 w-3" /> {entry.date}
                      <span className="text-slate-300">•</span>
                      {entry.time}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-500">Recorded by</p>
                  <p className="text-sm font-bold text-blue-600">{entry.recorded_by}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ value, label, color }) {
  const textColors = { emerald: "text-emerald-600", red: "text-red-600", blue: "text-blue-600", amber: "text-amber-600" };
  const bgColors = { emerald: "bg-emerald-50", red: "bg-red-50", blue: "bg-blue-50", amber: "bg-amber-50" };

  return (
    <div className={`${bgColors[color]} rounded-2xl p-5 text-center`}>
      <p className={`text-3xl font-black ${textColors[color]}`}>{value}</p>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}
