"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import { montserrat } from "@/app/ui/fonts";
import {
  useGetSessionDashboardQuery,
  useGetSessionHistoryQuery,
  useManualOverrideMutation,
  useAddCoLecturerMutation,
  useUpdateSessionMutation,
} from "@/app/lib/api/facepassApi";
import {
  UserGroupIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowLeftIcon,
  Cog6ToothIcon,
  DocumentArrowDownIcon,
  UserPlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import axios from "axios";
import { useSelector } from "react-redux";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function SessionControlRoom() {
  const { sessionId } = useParams();
  const user = useSelector((state) => state.user);
  const { data: dashboard, isLoading } = useGetSessionDashboardQuery(sessionId);
  const { data: historyData } = useGetSessionHistoryQuery(sessionId);
  const [manualOverride] = useManualOverrideMutation();
  const [addCoLecturer] = useAddCoLecturerMutation();
  const [updateSession] = useUpdateSessionMutation();

  const [activeTab, setActiveTab] = useState("roster");
  const [showCoLecturerModal, setShowCoLecturerModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [coLecturerEmail, setCoLecturerEmail] = useState("");
  const [downloading, setDownloading] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-pulse text-slate-400 text-lg font-bold">Loading Control Room...</div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <p className="text-slate-500 font-bold">Session not found.</p>
      </div>
    );
  }

  const { session, stats, students, at_risk_students, eligible_students, lecturers } = dashboard;
  const history = historyData?.data || [];

  const handleExport = async () => {
    setDownloading(true);
    try {
      const response = await axios.get(`${API_URL}lecturer/sessions/${sessionId}/export`, {
        responseType: "blob",
        headers: { Authorization: `Bearer ${user.access_token}` },
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Attendance_${session.courseID}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Report downloaded!");
    } catch {
      toast.error("Export failed.");
    } finally {
      setDownloading(false);
    }
  };

  const handleOverride = async (logId, newStatus) => {
    try {
      await manualOverride({ sessionId, logId, status: newStatus }).unwrap();
      toast.success(`Status updated to ${newStatus}`);
    } catch {
      toast.error("Override failed.");
    }
  };

  const handleAddCoLecturer = async (e) => {
    e.preventDefault();
    try {
      await addCoLecturer({ sessionId, email: coLecturerEmail.trim() }).unwrap();
      toast.success("Co-lecturer added!");
      setShowCoLecturerModal(false);
      setCoLecturerEmail("");
    } catch (err) {
      toast.error(err?.data?.error || "Failed to add co-lecturer");
    }
  };

  const tabs = [
    { key: "roster", label: "Student Roster", icon: UserGroupIcon },
    { key: "history", label: "Attendance History", icon: ClockIcon },
    { key: "at-risk", label: `At Risk (${stats.at_risk_count})`, icon: ExclamationTriangleIcon },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/lecturer" className="p-2 hover:bg-slate-100 rounded-xl transition">
                <ArrowLeftIcon className="h-5 w-5 text-slate-400" />
              </Link>
              <div>
                <h1 className={`${montserrat.className} text-xl font-black text-slate-900`}>
                  {session.courseID} — <span className="text-blue-500">{session.course_name}</span>
                </h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Session {session.session_name} • {session.total_expected_classes} lectures
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowCoLecturerModal(true)} className="flex items-center gap-2 bg-slate-100 text-slate-600 px-3 py-2 rounded-xl text-sm font-bold hover:bg-slate-200 transition">
                <UserPlusIcon className="h-4 w-4" /> Co-Lecturer
              </button>
              <button onClick={() => setShowSettingsModal(true)} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition">
                <Cog6ToothIcon className="h-5 w-5 text-slate-500" />
              </button>
              <button onClick={handleExport} disabled={downloading} className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-600 transition shadow-lg shadow-emerald-200">
                <DocumentArrowDownIcon className="h-4 w-4" />
                {downloading ? "Exporting..." : "Export Excel"}
              </button>
            </div>
          </div>

          {/* Co-lecturers badge */}
          {lecturers && lecturers.length > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-slate-400 font-bold">Lecturers:</span>
              {lecturers.map((l) => (
                <span key={l.id} className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full">{l.name}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard icon={<UserGroupIcon className="h-6 w-6 text-blue-500" />} label="Total Enrolled" value={stats.total_enrolled} color="blue" />
          <KPICard icon={<ChartBarIcon className="h-6 w-6 text-violet-500" />} label="Avg Attendance" value={`${stats.average_attendance}%`} color="violet" />
          <KPICard icon={<ExclamationTriangleIcon className="h-6 w-6 text-amber-500" />} label="At Risk" value={stats.at_risk_count} color="amber" />
          <KPICard icon={<CheckBadgeIcon className="h-6 w-6 text-emerald-500" />} label="Eligible" value={stats.eligible_count} color="emerald" />
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl mb-6 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition ${
                activeTab === tab.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        {activeTab === "roster" && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">S/N</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Name</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Matric</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Days</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">%</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(students || []).map((s, i) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 text-sm font-bold text-slate-400">{i + 1}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">{s.name}</td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-500">{s.matric}</td>
                    <td className="px-6 py-4 text-sm font-bold">{s.days_attended}</td>
                    <td className="px-6 py-4 text-sm font-bold">{s.percentage}%</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-black px-3 py-1 rounded-full ${
                        s.eligible
                          ? "bg-emerald-50 text-emerald-600"
                          : s.percentage >= 65
                          ? "bg-amber-50 text-amber-600"
                          : "bg-red-50 text-red-600"
                      }`}>
                        {s.eligible ? "Eligible" : s.percentage >= 65 ? "At Risk" : "Ineligible"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!students || students.length === 0) && (
              <div className="text-center py-12 text-slate-400 font-bold">No students enrolled yet.</div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-bold bg-white rounded-2xl border border-slate-100">
                No attendance recorded yet.
              </div>
            ) : (
              history.map((day) => (
                <div key={day.date} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ClockIcon className="h-5 w-5 text-slate-400" />
                      <span className="font-black text-slate-700">{day.date}</span>
                    </div>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      {day.total_present}/{day.total_records} Present
                    </span>
                  </div>
                  <table className="w-full text-left">
                    <tbody className="divide-y divide-slate-50">
                      {day.entries.map((entry) => (
                        <tr key={entry.log_id} className="hover:bg-slate-50/50 transition">
                          <td className="px-6 py-3 text-sm font-bold text-slate-800">{entry.student_name}</td>
                          <td className="px-6 py-3 text-sm font-mono text-slate-500">{entry.student_matric}</td>
                          <td className="px-6 py-3 text-sm text-slate-400">{entry.time}</td>
                          <td className="px-6 py-3 text-sm text-slate-400">By: {entry.recorded_by}</td>
                          <td className="px-6 py-3">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              entry.status === "present" ? "bg-emerald-50 text-emerald-600"
                              : entry.status === "excused" ? "bg-blue-50 text-blue-600"
                              : "bg-red-50 text-red-600"
                            }`}>{entry.status}</span>
                          </td>
                          <td className="px-6 py-3">
                            <select
                              defaultValue={entry.status}
                              onChange={(e) => handleOverride(entry.log_id, e.target.value)}
                              className="text-xs border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-600 bg-transparent cursor-pointer"
                            >
                              <option value="present">Present</option>
                              <option value="absent">Absent</option>
                              <option value="excused">Excused</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "at-risk" && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            {at_risk_students && at_risk_students.length > 0 ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-amber-50/50">
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-amber-600">Name</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-amber-600">Matric</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-amber-600">Days</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-amber-600">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {at_risk_students.map((s) => (
                    <tr key={s.id} className="hover:bg-amber-50/30 transition">
                      <td className="px-6 py-4 text-sm font-bold">{s.name}</td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-500">{s.matric}</td>
                      <td className="px-6 py-4 text-sm font-bold">{s.days_attended}</td>
                      <td className="px-6 py-4 text-sm font-bold text-amber-600">{s.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 text-slate-400 font-bold">No at-risk students. 🎉</div>
            )}
          </div>
        )}
      </div>

      {/* ── Add Co-Lecturer Modal ── */}
      {showCoLecturerModal && (
        <Modal title="Add Co-Lecturer" onClose={() => setShowCoLecturerModal(false)}>
          <form onSubmit={handleAddCoLecturer} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Lecturer Email</label>
              <input
                type="email" value={coLecturerEmail} onChange={(e) => setCoLecturerEmail(e.target.value)}
                placeholder="lecturer@university.edu" required
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
              />
            </div>
            <button type="submit" className="w-full bg-blue-500 text-white py-3.5 rounded-xl font-bold hover:bg-blue-600 transition">
              Add Co-Lecturer
            </button>
          </form>
        </Modal>
      )}

      {/* ── Settings Modal ── */}
      {showSettingsModal && (
        <SettingsModal
          session={session}
          sessionId={sessionId}
          updateSession={updateSession}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
  );
}

function KPICard({ icon, label, value, color }) {
  const bgMap = { blue: "bg-blue-50", violet: "bg-violet-50", amber: "bg-amber-50", emerald: "bg-emerald-50" };
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100">
      <div className={`${bgMap[color]} p-2.5 rounded-xl w-fit mb-3`}>{icon}</div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-xl transition">
          <XMarkIcon className="h-5 w-5 text-slate-400" />
        </button>
        <h2 className="text-xl font-black text-slate-900 mb-6">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function SettingsModal({ session, sessionId, updateSession, onClose }) {
  const [totalClasses, setTotalClasses] = useState(session.total_expected_classes);
  const [sessionName, setSessionName] = useState(session.session_name);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await updateSession({ sessionId, total_expected_classes: Number(totalClasses), session_name: sessionName }).unwrap();
      toast.success("Session updated!");
      onClose();
    } catch {
      toast.error("Update failed.");
    }
  };

  return (
    <Modal title="Session Settings" onClose={onClose}>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Session Name</label>
          <input type="text" value={sessionName} onChange={(e) => setSessionName(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Total Expected Lectures</label>
          <input type="number" value={totalClasses} onChange={(e) => setTotalClasses(e.target.value)} min={1}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none" />
        </div>
        <button type="submit" className="w-full bg-blue-500 text-white py-3.5 rounded-xl font-bold hover:bg-blue-600 transition">
          Save Changes
        </button>
      </form>
    </Modal>
  );
}
