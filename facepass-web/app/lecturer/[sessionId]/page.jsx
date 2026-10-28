"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  useGetSessionDashboardQuery,
  useGetSessionHistoryQuery,
  useManualOverrideMutation,
  useAddCoLecturerMutation,
  useUpdateSessionMutation,
} from "@/app/lib/api/facepassApi";
import {
  Users,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Settings,
  Download,
  UserPlus,
  X,
  ScanFace,
  ShieldAlert,
  ShieldCheck,
  Search,
  BookOpen,
  Award,
  LogOut,
  FileSpreadsheet,
  Sparkles,
  CloudUpload,
  Cpu,
  XCircle,
  Eye,
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/app/lib/features/user/userStore";
import CPLogo from "@/app/ui/CPLogo";
import VisionScannerModal from "@/app/ui/lecturer/VisionScannerModal";
import StudentAuditDrawer from "@/app/ui/lecturer/StudentAuditDrawer";
import {
  CourseMaterialsPanel,
  QuizzesAndGradesPanel,
} from "@/app/ui/lecturer/SessionResourcesTabs";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function SessionControlRoom() {
  const { sessionId } = useParams();
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useSelector((s) => s.user);

  useEffect(() => {
    if (user?.must_change_password) {
      router.replace("/change-password");
    }
  }, [user?.must_change_password, router]);

  const {
    data: dashboard,
    isLoading,
    refetch: refetchDashboard,
  } = useGetSessionDashboardQuery(sessionId);
  const { data: historyData, refetch: refetchHistory } =
    useGetSessionHistoryQuery(sessionId);
  const [manualOverride] = useManualOverrideMutation();
  const [addCoLecturer] = useAddCoLecturerMutation();
  const [updateSession] = useUpdateSessionMutation();

  // Roster Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDept, setFilterDept] = useState("All");

  // Student Audit Drawer state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [auditData, setAuditData] = useState(null);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState("roster");
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showCoLecturerModal, setShowCoLecturerModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [coLecturerEmail, setCoLecturerEmail] = useState("");
  const [downloading, setDownloading] = useState(false);

  // Attendance Scan Jobs & Intruder Alert State
  const [attendanceJobs, setAttendanceJobs] = useState([]);
  const [intruderAlert, setIntruderAlert] = useState(null);

  const startAttendanceJob = (file, mode) => {
    const jobId = Date.now().toString();
    const newJob = {
      id: jobId,
      fileName: file.name,
      mode,
      stage: "uploading", // uploading | processing | done | error
      uploadProgress: 0,
      results: null,
      error: null,
    };
    setAttendanceJobs((prev) => [...prev, newJob]);
    runAttendancePipeline(jobId, file, mode);
  };

  const updateJob = (jobId, updates) => {
    setAttendanceJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, ...updates } : j))
    );
  };

  const removeJob = (jobId) => {
    setAttendanceJobs((prev) => prev.filter((j) => j.id !== jobId));
  };

  const onAttendanceComplete = () => {
    refetchDashboard();
    refetchHistory();
  };

  const runAttendancePipeline = async (jobId, file, mode) => {
    try {
      const fileType =
        file.type || (mode === "video" ? "video/mp4" : "image/jpeg");
      const presignedRes = await axios.get(
        `${API_URL}lecturer/sessions/${sessionId}/attendance/presigned-url`,
        {
          params: { file_name: file.name, file_type: fileType },
          headers: { Authorization: `Bearer ${user.access_token}` },
        }
      );
      const { presigned_url, s3_key } = presignedRes.data;

      await axios.put(presigned_url, file, {
        headers: { "Content-Type": fileType },
        onUploadProgress: (progressEvent) => {
          const pct = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 50;
          updateJob(jobId, { uploadProgress: pct });
        },
      });

      updateJob(jobId, { stage: "processing", uploadProgress: 100 });

      if (mode === "image") {
        const res = await axios.post(
          `${API_URL}lecturer/sessions/${sessionId}/attendance/image`,
          { s3_key },
          { headers: { Authorization: `Bearer ${user.access_token}` } }
        );
        updateJob(jobId, { stage: "done", results: res.data });
        toast.success(
          `Computer Vision Engine matched ${res.data.unique_faces_recognized} students`
        );
        if (res.data.unregistered_alert) {
          setIntruderAlert(res.data.unregistered_alert);
        } else if (
          res.data.total_faces_detected > res.data.unique_faces_recognized
        ) {
          const diff =
            res.data.total_faces_detected - res.data.unique_faces_recognized;
          setIntruderAlert(
            `WARNING: ${diff} unmatched face(s) detected in lecture hall frame that are not enrolled in this course collection.`
          );
        }
        onAttendanceComplete();
      } else {
        const res = await axios.post(
          `${API_URL}lecturer/sessions/${sessionId}/attendance/video`,
          { s3_key },
          { headers: { Authorization: `Bearer ${user.access_token}` } }
        );
        const rekogJobId = res.data.job_id;

        const pollInterval = setInterval(async () => {
          try {
            const poll = await axios.get(
              `${API_URL}lecturer/sessions/${sessionId}/attendance/video-status/${rekogJobId}`,
              { headers: { Authorization: `Bearer ${user.access_token}` } }
            );
            if (poll.data.status === "complete") {
              clearInterval(pollInterval);
              updateJob(jobId, { stage: "done", results: poll.data });
              toast.success(
                `Recognized ${poll.data.unique_faces_recognized} students from video`
              );
              if (poll.data.unknown_faces && poll.data.unknown_faces > 0) {
                setIntruderAlert(
                  `WARNING: ${poll.data.unknown_faces} unregistered face track(s) detected in classroom video.`
                );
              }
              onAttendanceComplete();
            } else if (poll.data.status === "failed") {
              clearInterval(pollInterval);
              updateJob(jobId, {
                stage: "error",
                error: "Video processing failed",
              });
              toast.error("Video processing failed");
            }
          } catch {
            clearInterval(pollInterval);
            updateJob(jobId, { stage: "error", error: "Polling error" });
            toast.error("Polling error");
          }
        }, 5000);
      }
    } catch (err) {
      updateJob(jobId, {
        stage: "error",
        error: err?.response?.data?.error || err.message || "Upload failed",
      });
      toast.error(err?.response?.data?.error || err.message || "Upload failed");
    }
  };

  const handleOpenStudentAudit = async (student) => {
    setSelectedStudent(student);
    setAuditData(null);
    setLoadingAudit(true);
    try {
      const res = await axios.get(
        `${API_URL}lecturer/sessions/${sessionId}/student-audit/${student.id}`,
        { headers: { Authorization: `Bearer ${user.access_token}` } }
      );
      setAuditData(res.data);
    } catch {
      setAuditData({ student_id: student.id, history: [], quizzes: [] });
    } finally {
      setLoadingAudit(false);
    }
  };

  const studentsList = dashboard?.students || [];
  const allDepartments = useMemo(() => {
    const set = new Set(studentsList.map((s) => s.department || "N/A"));
    return Array.from(set).sort();
  }, [studentsList]);

  // Filtered students for Roster tab (Fixes previous un-wired searchQuery & filterDept bug)
  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return studentsList.filter((s) => {
      const dept = s.department || "N/A";
      const matchesDept = filterDept === "All" || dept === filterDept;
      const matchesQuery =
        !q ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.matric && s.matric.toLowerCase().includes(q)) ||
        dept.toLowerCase().includes(q);
      return matchesDept && matchesQuery;
    });
  }, [studentsList, searchQuery, filterDept]);

  const groupedByDept = useMemo(() => {
    const groups = {};
    filteredStudents.forEach((s) => {
      const dept = s.department || "N/A";
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(s);
    });
    return groups;
  }, [filteredStudents]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-obsidian-950 text-blue-400 flex items-center justify-center animate-pulse">
          <ScanFace className="w-5 h-5" />
        </div>
        <div className="text-xs font-sans uppercase tracking-wider text-slate-500">
          SYNCHRONIZING SESSION CONTROL ROOM...
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-base font-bold text-slate-800 mb-2">
          Session Not Found
        </p>
        <Link
          href="/lecturer"
          className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold"
        >
          Return to Command Center
        </Link>
      </div>
    );
  }

  const { session, stats, at_risk_students, lecturers } = dashboard;
  const history = historyData?.data || [];

  const handleExportExcel = async () => {
    setDownloading(true);
    try {
      const response = await axios.get(
        `${API_URL}lecturer/sessions/${sessionId}/export`,
        {
          responseType: "blob",
          headers: { Authorization: `Bearer ${user.access_token}` },
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Attendance_${session.courseID}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Excel attendance ledger downloaded!");
    } catch {
      toast.error("Excel export failed.");
    } finally {
      setDownloading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await axios.get(
        `${API_URL}lecturer/sessions/${sessionId}/export-csv`,
        {
          responseType: "blob",
          headers: { Authorization: `Bearer ${user.access_token}` },
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `FacePass_Roster_${session.courseID}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("CSV Roster exported!");
    } catch {
      toast.error("CSV export failed.");
    }
  };

  const handleOverride = async (logId, newStatus) => {
    try {
      await manualOverride({ sessionId, logId, status: newStatus }).unwrap();
      toast.success(
        `Attendance status updated to ${newStatus.toUpperCase()} & synced`
      );
    } catch {
      toast.error("Manual override failed.");
    }
  };

  const handleAddCoLecturer = async (e) => {
    e.preventDefault();
    try {
      await addCoLecturer({
        sessionId,
        email: coLecturerEmail.trim(),
      }).unwrap();
      toast.success("Co-lecturer granted session access!");
      setShowCoLecturerModal(false);
      setCoLecturerEmail("");
      refetchDashboard();
    } catch (err) {
      toast.error(err?.data?.error || "Failed to add co-lecturer");
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    router.push("/login");
    toast.success("Signed out of FacePass");
  };

  const tabs = [
    {
      key: "roster",
      label: `Class Register (${studentsList.length})`,
      icon: Users,
    },
    {
      key: "history",
      label: `Attendance History (${history.length})`,
      icon: Clock,
    },
    {
      key: "at-risk",
      label: `At-Risk Watchlist (${stats.at_risk_count})`,
      icon: AlertTriangle,
    },
    {
      key: "materials",
      label: "Course Materials",
      icon: BookOpen,
    },
    {
      key: "quizzes",
      label: "Quizzes & Grades",
      icon: Award,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 flex flex-col">
      {/* ── Top Control Room Bar ── */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/90 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/lecturer"
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
              title="Back to Command Center"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-obsidian-950 text-white font-sans text-xs font-bold">
                  {session.courseID}
                </span>
                <span className="text-xs font-sans text-slate-500">
                  SESSION {session.session_name} •{" "}
                  {session.total_expected_classes} LECTURES
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-[10px] font-sans text-blue-700">
                  <ScanFace className="w-3 h-3 text-blue-600" />
                  COL-{session.courseID}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                {session.course_name}
              </h1>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {user?.role === "admin" && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 bg-obsidian-950 hover:bg-slate-800 text-white px-3.5 py-2.5 rounded-xl font-semibold text-xs transition"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Admin Console</span>
              </Link>
            )}
            <button
              onClick={() => setShowScannerModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition"
            >
              <ScanFace className="w-4 h-4 text-white" />
              <span>Launch Vision Scanner</span>
            </button>

            <button
              onClick={() => setShowCoLecturerModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
            >
              <UserPlus className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Co-Lecturer</span>
            </button>

            <button
              onClick={() => setShowSettingsModal(true)}
              title="Session Settings"
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={handleExportExcel}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{downloading ? "Exporting..." : "Export Excel"}</span>
            </button>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-600 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Co-Lecturers Bar */}
        {lecturers && lecturers.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 border-t border-slate-100 flex items-center gap-2 text-xs">
            <span className="font-sans text-[11px] uppercase text-slate-400">
              ASSIGNED FACULTY:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {lecturers.map((l) => (
                <span
                  key={l.id}
                  className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-xs"
                >
                  {l.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* ── Main Control Room Body ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Intruder / Unregistered Face Alert Banner */}
        {intruderAlert && (
          <div className="rounded-2xl bg-rose-950 text-white border border-rose-500/50 p-4 flex items-start justify-between gap-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-sans uppercase tracking-wider text-rose-300 font-bold">
                  BIOMETRIC ANOMALY // UNREGISTERED CLASSROOM ATTENDEE
                </div>
                <p className="text-xs sm:text-sm text-rose-100 mt-0.5">
                  {intruderAlert}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIntruderAlert(null)}
              className="p-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── 4 Precision KPI Telemetry Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-[11px] font-sans text-slate-400 uppercase">
              <span>ENROLLED ROSTER</span>
              <Users className="w-4 h-4 text-slate-700" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-bold font-sans text-slate-900">
                {stats.total_enrolled}
              </span>
              <span className="text-[11px] font-sans text-slate-500">
                STUDENTS
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-[11px] font-sans text-slate-400 uppercase">
              <span>MEAN ATTENDANCE</span>
              <BarChart3 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-bold font-sans text-slate-900">
                {stats.average_attendance}%
              </span>
              <span className="text-[11px] font-sans text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                TARGET ≥75%
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-[11px] font-sans text-slate-400 uppercase">
              <span>EXAM ELIGIBLE (≥75%)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-bold font-sans text-emerald-600">
                {stats.eligible_count}
              </span>
              <span className="text-[11px] font-sans text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                CLEARED
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-[11px] font-sans text-slate-400 uppercase">
              <span>AT-RISK WATCHLIST (&lt;75%)</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-bold font-sans text-rose-600">
                {stats.at_risk_count}
              </span>
              <button
                onClick={() => setActiveTab("at-risk")}
                className="text-[11px] font-sans text-rose-600 hover:underline"
              >
                INSPECT →
              </button>
            </div>
          </div>
        </div>

        {/* ── 5-Tab Navigation Strip ── */}
        <div className="flex items-center gap-1.5 overflow-x-auto bg-white p-1.5 rounded-2xl border border-slate-200/90 w-full sm:w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
                  active
                    ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    active ? "text-white" : "text-slate-400"
                  }`}
                />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── TAB 1: CLASS REGISTER (ROSTER) ── */}
        {activeTab === "roster" && (
          <div className="space-y-5">
            {/* Search & Department Filter Bar */}
            <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center bg-white p-4 rounded-2xl border border-slate-200/90">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search student by name, matric number, or department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-900 outline-none transition"
                  />
                </div>

                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:border-slate-900 outline-none"
                >
                  <option value="All">
                    All Departments ({allDepartments.length})
                  </option>
                  {allDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-sans text-slate-400 hidden lg:inline">
                  CLICK ANY STUDENT ROW TO OPEN BIOMETRIC AUDIT DOSSIER
                </span>
                <button
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
              </div>
            </div>

            {Object.keys(groupedByDept).length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-800 mb-1">
                  {studentsList.length === 0
                    ? "No Students Enrolled in This Session Yet"
                    : "No Students Match Your Search Filter"}
                </p>
                <p className="text-xs text-slate-500">
                  {studentsList.length === 0
                    ? "Students enroll and register their facial biometrics via the CoursePass portal."
                    : "Try clearing your search query or switching back to All Departments."}
                </p>
              </div>
            ) : (
              Object.keys(groupedByDept)
                .sort()
                .map((dept) => (
                  <div
                    key={dept}
                    className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs"
                  >
                    <div className="px-6 py-3.5 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-obsidian-950" />
                        <span className="font-sans text-xs font-bold uppercase tracking-wider text-slate-800">
                          DEPARTMENT // {dept}
                        </span>
                      </div>
                      <span className="text-[11px] font-sans font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-0.5 rounded-md">
                        {groupedByDept[dept].length} Students
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] font-sans uppercase tracking-wider text-slate-400">
                            <th className="py-3.5 px-6">#</th>
                            <th className="py-3.5 px-6">Student Name</th>
                            <th className="py-3.5 px-6">Matric No.</th>
                            <th className="py-3.5 px-6">Attended / Excused</th>
                            <th className="py-3.5 px-6">Missed</th>
                            <th className="py-3.5 px-6">75% Threshold Gauge</th>
                            <th className="py-3.5 px-6">Eligibility</th>
                            <th className="py-3.5 px-6 text-right">Dossier</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {groupedByDept[dept].map((s, i) => (
                            <tr
                              key={s.id}
                              onClick={() => handleOpenStudentAudit(s)}
                              className="hover:bg-slate-50/90 cursor-pointer transition group"
                            >
                              <td className="py-3.5 px-6 font-sans text-slate-400">
                                {String(i + 1).padStart(2, "0")}
                              </td>
                              <td className="py-3.5 px-6 font-semibold text-slate-900 group-hover:text-blue-600">
                                {s.name}
                              </td>
                              <td className="py-3.5 px-6 font-sans text-slate-600">
                                {s.matric}
                              </td>
                              <td className="py-3.5 px-6 font-sans">
                                <span className="font-bold text-emerald-600">
                                  {s.days_attended}
                                </span>
                                {s.excused > 0 && (
                                  <span className="ml-1.5 text-[11px] text-blue-600">
                                    (+{s.excused} exc)
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-6 font-sans font-bold text-rose-600">
                                {s.days_missed}
                              </td>
                              <td className="py-3.5 px-6 w-48">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        s.eligible
                                          ? "bg-emerald-500"
                                          : s.percentage >= 65
                                          ? "bg-amber-500"
                                          : "bg-rose-500"
                                      }`}
                                      style={{
                                        width: `${Math.min(
                                          100,
                                          Math.max(0, s.percentage || 0)
                                        )}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="font-sans font-bold text-slate-800 w-12 text-right">
                                    {s.percentage}%
                                  </span>
                                </div>
                              </td>
                              <td className="py-3.5 px-6">
                                <span
                                  className={`inline-flex px-2.5 py-0.5 rounded-md font-sans text-[10px] font-bold uppercase border ${
                                    s.eligible
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : s.percentage >= 65
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-rose-50 text-rose-700 border-rose-200"
                                  }`}
                                >
                                  {s.eligible
                                    ? "ELIGIBLE"
                                    : s.percentage >= 65
                                    ? "WARNING"
                                    : "INELIGIBLE"}
                                </span>
                              </td>
                              <td className="py-3.5 px-6 text-right">
                                <span className="inline-flex items-center gap-1 text-[11px] font-sans text-slate-400 group-hover:text-slate-900">
                                  <Eye className="w-3.5 h-3.5" />
                                  Audit
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* ── TAB 2: ATTENDANCE HISTORY & MANUAL OVERRIDE ── */}
        {activeTab === "history" && (
          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center">
                <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-800 mb-1">
                  No Biometric Attendance Logs Recorded Yet
                </p>
                <p className="text-xs text-slate-500 mb-4">
                  Launch the Vision Scanner to capture a classroom group photo, live snapshot, or walkthrough video.
                </p>
                <button
                  onClick={() => setShowScannerModal(true)}
                  className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold shadow-md shadow-blue-500/20"
                >
                  Launch Vision Scanner
                </button>
              </div>
            ) : (
              history.map((day) => (
                <div
                  key={day.date}
                  className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs"
                >
                  <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg bg-obsidian-950 text-white font-sans text-xs font-bold">
                        {day.date}
                      </span>
                      <span className="text-xs font-sans text-slate-600">
                        {day.total_present} / {day.total_records} PRESENT
                      </span>
                    </div>

                    <button
                      onClick={async () => {
                        try {
                          const response = await axios.get(
                            `${API_URL}lecturer/sessions/${sessionId}/export-date/${day.date}`,
                            {
                              responseType: "blob",
                              headers: {
                                Authorization: `Bearer ${user.access_token}`,
                              },
                            }
                          );
                          const url = window.URL.createObjectURL(
                            new Blob([response.data])
                          );
                          const link = document.createElement("a");
                          link.href = url;
                          link.setAttribute(
                            "download",
                            `Attendance_${session.courseID}_${day.date}.xlsx`
                          );
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                          toast.success(`Exported ${day.date} sheet!`);
                        } catch {
                          toast.error("Date export failed.");
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export Date Excel
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-sans uppercase tracking-wider text-slate-400">
                          <th className="py-3 px-6">Student Name</th>
                          <th className="py-3 px-6">Matric No.</th>
                          <th className="py-3 px-6">Timestamp</th>
                          <th className="py-3 px-6">Verified By</th>
                          <th className="py-3 px-6">Status</th>
                          <th className="py-3 px-6 text-right">
                            Lecturer Override
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {day.entries.map((entry) => (
                          <tr
                            key={entry.log_id}
                            className="hover:bg-slate-50/70 transition"
                          >
                            <td className="py-3 px-6 font-semibold text-slate-900">
                              {entry.student_name}
                            </td>
                            <td className="py-3 px-6 font-sans text-slate-600">
                              {entry.student_matric}
                            </td>
                            <td className="py-3 px-6 font-sans text-slate-500">
                              {entry.time || "—"}
                            </td>
                            <td className="py-3 px-6 text-slate-500">
                              {entry.recorded_by}
                            </td>
                            <td className="py-3 px-6">
                              <span
                                className={`inline-flex px-2.5 py-0.5 rounded-md font-sans text-[10px] font-bold uppercase border ${
                                  entry.status === "present"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : entry.status === "excused"
                                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                    : "bg-rose-50 text-rose-700 border-rose-200"
                                }`}
                              >
                                {entry.status}
                              </span>
                            </td>
                            <td className="py-3 px-6 text-right">
                              <select
                                value={entry.status}
                                onChange={(e) =>
                                  handleOverride(entry.log_id, e.target.value)
                                }
                                className="text-xs font-sans border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 bg-white hover:border-slate-400 focus:border-slate-900 outline-none cursor-pointer"
                              >
                                <option value="present">PRESENT</option>
                                <option value="excused">EXCUSED</option>
                                <option value="absent">ABSENT</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── TAB 3: AT-RISK WATCHLIST (<75%) ── */}
        {activeTab === "at-risk" && (
          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
            <div className="px-6 py-4 bg-rose-50/70 border-b border-rose-200/70 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-sans text-rose-700 font-bold uppercase tracking-wider">
                  COMPLIANCE WATCHLIST // BELOW 75% THRESHOLD
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Students Requiring Attendance Intervention (
                  {at_risk_students?.length || 0})
                </h3>
              </div>
              <span className="text-xs font-sans text-rose-700">
                REQUIRED: ≥{" "}
                {Math.ceil((session.total_expected_classes || 13) * 0.75)}{" "}
                LECTURES
              </span>
            </div>

            {at_risk_students && at_risk_students.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-sans uppercase tracking-wider text-slate-400">
                      <th className="py-3.5 px-6">Student Name</th>
                      <th className="py-3.5 px-6">Matric No.</th>
                      <th className="py-3.5 px-6">Department</th>
                      <th className="py-3.5 px-6">Attended</th>
                      <th className="py-3.5 px-6">Current Rate</th>
                      <th className="py-3.5 px-6">Recovery Deficit</th>
                      <th className="py-3.5 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {at_risk_students.map((s) => {
                      const req = Math.ceil(
                        (session.total_expected_classes || 13) * 0.75
                      );
                      const eff =
                        (Number(s.days_attended) || 0) +
                        (Number(s.excused) || 0);
                      const needed = Math.max(0, req - eff);
                      return (
                        <tr
                          key={s.id}
                          onClick={() => handleOpenStudentAudit(s)}
                          className="hover:bg-rose-50/30 cursor-pointer transition"
                        >
                          <td className="py-3.5 px-6 font-semibold text-slate-900">
                            {s.name}
                          </td>
                          <td className="py-3.5 px-6 font-sans text-slate-600">
                            {s.matric}
                          </td>
                          <td className="py-3.5 px-6 text-slate-500">
                            {s.department || "N/A"}
                          </td>
                          <td className="py-3.5 px-6 font-sans font-bold text-slate-800">
                            {eff} / {session.total_expected_classes}
                          </td>
                          <td className="py-3.5 px-6 font-sans font-bold text-rose-600">
                            {s.percentage}%
                          </td>
                          <td className="py-3.5 px-6">
                            <span className="px-2.5 py-0.5 rounded-md bg-rose-50 border border-rose-200 font-sans text-[11px] font-semibold text-rose-700">
                              +{needed} lecture{needed === 1 ? "" : "s"} needed
                            </span>
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenStudentAudit(s);
                              }}
                              className="px-3 py-1 rounded-lg bg-slate-900 text-white font-sans text-[11px] hover:bg-slate-700"
                            >
                              Audit Dossier
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-900">
                  100% Roster Compliance
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Every enrolled student in this session currently meets or exceeds the 75% attendance threshold.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: COURSE MATERIALS ── */}
        {activeTab === "materials" && (
          <CourseMaterialsPanel
            sessionId={sessionId}
            accessToken={user.access_token}
          />
        )}

        {/* ── TAB 5: QUIZZES & GRADES ── */}
        {activeTab === "quizzes" && (
          <QuizzesAndGradesPanel
            sessionId={sessionId}
            accessToken={user.access_token}
          />
        )}
      </main>

      {/* ── Dedicated AI Vision Scanner Modal ── */}
      <VisionScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        courseID={session.courseID}
        sessionName={session.session_name}
        onStartScan={startAttendanceJob}
      />

      {/* ── Slide-Over Student Audit Drawer (Fixes previous out-of-scope bug) ── */}
      <StudentAuditDrawer
        student={selectedStudent}
        session={session}
        auditData={auditData}
        loadingAudit={loadingAudit}
        sessionHistory={history}
        onClose={() => {
          setSelectedStudent(null);
          setAuditData(null);
        }}
      />

      {/* ── Co-Lecturer Modal ── */}
      {showCoLecturerModal && (
        <Modal
          badge="ACCESS CONTROL // CO-LECTURER"
          title="Assign Co-Lecturer"
          onClose={() => setShowCoLecturerModal(false)}
        >
          <form onSubmit={handleAddCoLecturer} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Faculty Institutional Email
              </label>
              <input
                type="email"
                value={coLecturerEmail}
                onChange={(e) => setCoLecturerEmail(e.target.value)}
                placeholder="colleague@university.edu"
                required
                className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-slate-900"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCoLecturerModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-500 text-white rounded-xl text-xs font-semibold hover:bg-blue-600 transition shadow-md shadow-blue-500/20"
              >
                Grant Access
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Session Settings Modal ── */}
      {showSettingsModal && (
        <SettingsModal
          session={session}
          sessionId={sessionId}
          updateSession={updateSession}
          onUpdated={refetchDashboard}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* ── Dark Obsidian Floating Attendance Telemetry Banner ── */}
      {attendanceJobs.length > 0 && (
        <AttendanceProgressBanner
          jobs={attendanceJobs}
          onRemove={removeJob}
        />
      )}
    </div>
  );
}

function Modal({ badge, title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian-950/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 sm:p-7 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition"
        >
          <X className="h-4 w-4" />
        </button>
        {badge && (
          <div className="text-[11px] font-sans text-blue-600 font-semibold uppercase mb-1">
            {badge}
          </div>
        )}
        <h2 className="text-lg font-bold text-slate-900 mb-5">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function SettingsModal({
  session,
  sessionId,
  updateSession,
  onUpdated,
  onClose,
}) {
  const [totalClasses, setTotalClasses] = useState(
    session.total_expected_classes
  );
  const [sessionName, setSessionName] = useState(session.session_name);
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await updateSession({
        sessionId,
        total_expected_classes: Number(totalClasses),
        session_name: sessionName,
      }).unwrap();
      toast.success("Session configuration updated!");
      if (onUpdated) onUpdated();
      onClose();
    } catch {
      toast.error("Update failed.");
    }
  };
  return (
    <Modal
      badge="CONFIGURATION // THRESHOLD CALIBRATION"
      title="Session Settings"
      onClose={onClose}
    >
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
            Academic Session Label
          </label>
          <input
            type="text"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white rounded-xl px-4 py-2.5 text-sm font-sans outline-none focus:border-slate-900"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
            Total Expected Lectures
          </label>
          <input
            type="number"
            value={totalClasses}
            onChange={(e) => setTotalClasses(e.target.value)}
            min={1}
            className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white rounded-xl px-4 py-2.5 text-sm font-sans outline-none focus:border-slate-900"
          />
          <p className="mt-1.5 text-[11px] font-sans text-slate-500">
            75% Eligibility = {Math.ceil((Number(totalClasses) || 0) * 0.75)}{" "}
            lectures required.
          </p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-blue-500 text-white rounded-xl text-xs font-semibold hover:bg-blue-600 transition shadow-md shadow-blue-500/20"
          >
            Save Configuration
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AttendanceProgressBanner({ jobs, onRemove }) {
  const stageConfig = {
    uploading: {
      icon: CloudUpload,
      label: "STREAMING TO ENCRYPTED CLOUD BUCKET",
      color: "text-blue-400",
    },
    processing: {
      icon: Cpu,
      label: "COMPUTER VISION 1:N VECTOR EXTRACTION",
      color: "text-blue-400",
    },
    done: {
      icon: CheckCircle2,
      label: "BIOMETRIC MATCH COMPLETE",
      color: "text-emerald-400",
    },
    error: {
      icon: XCircle,
      label: "PIPELINE INTERRUPTED",
      color: "text-rose-400",
    },
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 w-full max-w-sm space-y-3 px-4 sm:px-0">
      {jobs.map((job) => {
        const cfg = stageConfig[job.stage] || stageConfig.uploading;
        const StageIcon = cfg.icon;
        const isActive =
          job.stage === "uploading" || job.stage === "processing";
        const flatStudents = job.results?.data
          ? Object.values(job.results.data).flat()
          : [];

        return (
          <div
            key={job.id}
            className="bg-obsidian-950 text-white rounded-2xl shadow-2xl border border-slate-800 overflow-hidden"
          >
            <div className="p-4 flex items-center gap-3 border-b border-slate-800/80">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <StageIcon
                  className={`h-4 w-4 ${cfg.color} ${
                    isActive ? "animate-pulse" : ""
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-sans font-bold text-white truncate">
                  {job.fileName}
                </p>
                <p className={`text-[10px] font-sans ${cfg.color}`}>
                  {cfg.label}
                </p>
              </div>
              {!isActive && (
                <button
                  onClick={() => onRemove(job.id)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* 3-Step Telemetry Bar */}
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-3 gap-1.5">
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{
                      width:
                        job.stage === "uploading"
                          ? `${job.uploadProgress}%`
                          : "100%",
                    }}
                  />
                </div>
                <div
                  className={`h-1.5 rounded-full ${
                    job.stage === "processing"
                      ? "bg-blue-400 animate-pulse"
                      : job.stage === "done"
                      ? "bg-blue-400"
                      : "bg-slate-800"
                  }`}
                />
                <div
                  className={`h-1.5 rounded-full ${
                    job.stage === "done"
                      ? "bg-emerald-400"
                      : job.stage === "error"
                      ? "bg-rose-500"
                      : "bg-slate-800"
                  }`}
                />
              </div>

              {job.stage === "done" && job.results && (
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="block text-[9px] font-sans text-slate-400">
                      DETECTED
                    </span>
                    <span className="font-sans text-xs font-bold text-white">
                      {job.results.total_faces_detected ??
                        job.results.unique_faces_recognized ??
                        0}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="block text-[9px] font-sans text-slate-400">
                      MATCHED
                    </span>
                    <span className="font-sans text-xs font-bold text-emerald-400">
                      {job.results.unique_faces_recognized ?? 0}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="block text-[9px] font-sans text-slate-400">
                      NEW LOGS
                    </span>
                    <span className="font-sans text-xs font-bold text-blue-400">
                      {job.results.new_records ??
                        job.results.unique_faces_recognized ??
                        0}
                    </span>
                  </div>
                </div>
              )}

              {job.stage === "error" && job.error && (
                <p className="text-xs font-sans text-rose-400 bg-rose-950/60 border border-rose-500/30 px-3 py-2 rounded-lg">
                  {job.error}
                </p>
              )}

              {job.stage === "done" && flatStudents.length > 0 && (
                <div className="max-h-28 overflow-y-auto space-y-1 pt-1">
                  {flatStudents.slice(0, 4).map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-slate-900/90 rounded-lg px-2.5 py-1.5 text-xs"
                    >
                      <span className="font-medium text-slate-200 truncate">
                        {s.name}
                      </span>
                      <span className="font-sans text-[10px] text-emerald-400">
                        {s.matric} ✓
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
