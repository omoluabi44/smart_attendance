"use client";

import { useMemo } from "react";
import {
  X,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Award,
  UserCheck,
  Building2,
  Hash,
} from "lucide-react";
import { toast } from "react-toastify";

export default function StudentAuditDrawer({
  student,
  session,
  auditData,
  loadingAudit,
  sessionHistory = [],
  onClose,
}) {
  // Synthesize chronological attendance log from auditData.history or fallback to sessionHistory
  const chronologicalRecords = useMemo(() => {
    if (!student) return [];
    if (auditData?.history && auditData.history.length > 0) {
      return auditData.history;
    }
    const derived = [];
    sessionHistory.forEach((dayGroup) => {
      (dayGroup.entries || []).forEach((entry) => {
        if (
          entry.student_id === student.id ||
          (entry.student_matric && entry.student_matric === student.matric)
        ) {
          derived.push({
            date: dayGroup.date,
            time: entry.time || "—",
            status: entry.status,
            recorded_by: entry.recorded_by || "Computer Vision Engine",
          });
        }
      });
    });
    return derived;
  }, [student, auditData, sessionHistory]);

  if (!student) return null;

  const totalExpected = session?.total_expected_classes || 13;
  const requiredClasses = Math.ceil(totalExpected * 0.75);
  const effectiveAttended =
    (Number(student.days_attended) || 0) + (Number(student.excused) || 0);
  const deficit = Math.max(0, requiredClasses - effectiveAttended);

  const handleDownloadStudentCSV = () => {
    try {
      const headers = [
        "Student Name",
        "Matric Number",
        "Department",
        "Course Code",
        "Academic Session",
        "Days Attended",
        "Excused",
        "Days Missed",
        "Attendance Percentage",
        "Exam Eligibility (75% Rule)",
      ];
      const summaryRow = [
        `"${student.name || ""}"`,
        `"${student.matric || ""}"`,
        `"${student.department || "N/A"}"`,
        `"${session?.courseID || ""}"`,
        `"${session?.session_name || ""}"`,
        student.days_attended ?? 0,
        student.excused ?? 0,
        student.days_missed ?? 0,
        `${student.percentage ?? 0}%`,
        student.eligible ? "ELIGIBLE" : "INELIGIBLE (<75%)",
      ];

      let csvContent = headers.join(",") + "\n" + summaryRow.join(",") + "\n\n";
      csvContent += "CHRONOLOGICAL ATTENDANCE LOG\nDate,Time,Status,Recorded By\n";
      if (chronologicalRecords.length === 0) {
        csvContent += "No attendance logs recorded,,,\n";
      } else {
        chronologicalRecords.forEach((rec) => {
          csvContent += `${rec.date || ""},${rec.time || ""},${(rec.status || "").toUpperCase()},"${rec.recorded_by || "System"}"\n`;
        });
      }

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeMatric = (student.matric || student.name || "student").replace(
        /[^a-zA-Z0-9_-]/g,
        "_"
      );
      link.setAttribute(
        "download",
        `Student_Audit_${session?.courseID || "Course"}_${safeMatric}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Individual student audit CSV downloaded.");
    } catch (err) {
      toast.error("Failed to export student CSV.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-obsidian-950/60 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Top Drawer Header */}
        <div className="px-6 py-5 bg-obsidian-950 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-blue-400 uppercase tracking-wider">
              <span>BIOMETRIC DOSSIER // STUDENT AUDIT</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5">{student.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadStudentCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition shadow-md shadow-blue-500/20"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Audit Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Identity & Eligibility Card */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-200/80">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-obsidian-950 text-blue-400 font-mono font-bold text-sm flex items-center justify-center">
                  {(student.name || "ST")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {student.name}
                  </div>
                  <div className="text-xs font-mono text-slate-500 flex items-center gap-2">
                    <span>{student.matric}</span>
                    <span>•</span>
                    <span>{student.department || "N/A"}</span>
                  </div>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                  student.eligible
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : student.percentage >= 65
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                {student.eligible
                  ? "ELIGIBLE (≥75%)"
                  : student.percentage >= 65
                  ? "WARNING (65–74%)"
                  : "CRITICAL (<65%)"}
              </span>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-500">
                  ATTENDANCE RATE ({effectiveAttended}/{totalExpected} LECTURES)
                </span>
                <span className="font-bold text-slate-900">
                  {student.percentage}%
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all ${
                    student.eligible
                      ? "bg-emerald-500"
                      : student.percentage >= 65
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                  style={{
                    width: `${Math.min(100, Math.max(0, student.percentage || 0))}%`,
                  }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>75% THRESHOLD = {requiredClasses} LECTURES</span>
                {deficit > 0 ? (
                  <span className="text-rose-600 font-semibold">
                    NEEDS +{deficit} MORE LECTURE{deficit > 1 ? "S" : ""}
                  </span>
                ) : (
                  <span className="text-emerald-600 font-semibold">
                    THRESHOLD MET ✓
                  </span>
                )}
              </div>
            </div>

            {/* Metric Breakdown */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 text-center">
                <span className="block text-[10px] font-mono text-slate-400">
                  PRESENT
                </span>
                <span className="font-mono font-bold text-base text-emerald-600">
                  {student.days_attended ?? 0}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 text-center">
                <span className="block text-[10px] font-mono text-slate-400">
                  EXCUSED
                </span>
                <span className="font-mono font-bold text-base text-indigo-600">
                  {student.excused ?? 0}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 text-center">
                <span className="block text-[10px] font-mono text-slate-400">
                  MISSED
                </span>
                <span className="font-mono font-bold text-base text-rose-600">
                  {student.days_missed ?? 0}
                </span>
              </div>
            </div>
          </div>

          {loadingAudit ? (
            <div className="py-12 text-center text-xs font-mono text-slate-400 animate-pulse">
              RETRIEVING CHRONOLOGICAL BIOMETRIC LOGS...
            </div>
          ) : (
            <>
              {/* Chronological Attendance History */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Chronological Attendance Log ({chronologicalRecords.length})
                  </h3>
                </div>

                {chronologicalRecords.length === 0 ? (
                  <div className="p-6 rounded-xl bg-slate-50 border border-slate-200/70 text-center text-xs text-slate-500">
                    No attendance check-ins recorded for this student yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {chronologicalRecords.map((rec, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200/90 hover:border-slate-300 transition"
                      >
                        <div>
                          <div className="text-xs font-mono font-bold text-slate-900">
                            {rec.date}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Time: {rec.time || "Logged"} • Verified by{" "}
                            {rec.recorded_by || "Computer Vision"}
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold uppercase ${
                            rec.status === "present"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : rec.status === "excused"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {rec.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quiz Performances */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5 mb-3">
                  <Award className="w-3.5 h-3.5 text-slate-400" />
                  Synced CoursePass Quiz Results
                </h3>

                {auditData?.quizzes && auditData.quizzes.length > 0 ? (
                  <div className="space-y-2">
                    {auditData.quizzes.map((quiz, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200/90"
                      >
                        <span className="text-xs font-semibold text-slate-800">
                          {quiz.title}
                        </span>
                        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                          {quiz.score} / {quiz.total_score}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/70 text-center text-xs text-slate-500">
                    No graded quiz submissions synced from CoursePass for this student yet.
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>COURSEPASS BIOMETRIC ID: {student.id?.slice(0, 8)}</span>
          <button
            onClick={onClose}
            className="text-slate-700 font-sans font-semibold hover:text-slate-900"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
}
