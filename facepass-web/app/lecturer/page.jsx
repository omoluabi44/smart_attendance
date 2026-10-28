"use client";

import { useState, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/app/lib/features/user/userStore";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import CPLogo from "@/app/ui/CPLogo";
import Sidebar from "@/app/ui/navigation/Sidebar";
import TopBar from "@/app/ui/navigation/TopBar";
import {
  useGetLecturerSessionsQuery,
  useGetLecturerCoursesQuery,
  useLecturerCreateCourseMutation,
  useLecturerCreateSessionMutation,
} from "@/app/lib/api/facepassApi";
import {
  Plus,
  BookOpen,
  Calendar,
  Users,
  ArrowUpRight,
  X,
  ScanFace,
  ShieldCheck,
  Search,
  LogOut,
  Cpu,
  FolderPlus,
} from "lucide-react";
import Link from "next/link";

export default function LecturerDashboard() {
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useSelector((state) => state.user);

  useEffect(() => {
    if (user?.must_change_password) {
      router.replace("/change-password");
    }
  }, [user?.must_change_password, router]);

  const { data: sessionsData, isLoading, refetch } = useGetLecturerSessionsQuery();
  const { data: coursesData } = useGetLecturerCoursesQuery();
  const [createCourse, { isLoading: creatingCourse }] = useLecturerCreateCourseMutation();
  const [createSession, { isLoading: creatingSession }] = useLecturerCreateSessionMutation();

  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filter & Search state
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Course form
  const [courseID, setCourseID] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseDesc, setCourseDesc] = useState("");

  // Session form
  const [sessionCourseID, setSessionCourseID] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [sessionName, setSessionName] = useState("2025/2026");
  const [totalClasses, setTotalClasses] = useState(13);

  const sessions = sessionsData?.data || [];
  const courses = coursesData?.data || [];

  const filteredModalCourses = useMemo(() => {
    const q = courseSearch.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) =>
        (c.courseID && c.courseID.toLowerCase().includes(q)) ||
        (c.courseName && c.courseName.toLowerCase().includes(q))
    );
  }, [courses, courseSearch]);

  // Computed metrics
  const totalEnrolledAcrossSessions = useMemo(
    () =>
      sessions.reduce(
        (acc, s) => acc + (Number(s.enrolled_students) || 0),
        0
      ),
    [sessions]
  );

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchesCourse =
        selectedCourseFilter === "ALL" || s.courseID === selectedCourseFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (s.courseID && s.courseID.toLowerCase().includes(q)) ||
        (s.course_name && s.course_name.toLowerCase().includes(q)) ||
        (s.session_name && s.session_name.toLowerCase().includes(q));
      return matchesCourse && matchesSearch;
    });
  }, [sessions, selectedCourseFilter, searchQuery]);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      const cleanCode = courseID.toUpperCase().trim();
      await createCourse({
        courseID: cleanCode,
        courseName: courseName.trim(),
        description: courseDesc.trim() || "No description",
      }).unwrap();
      toast.success(`Course ${cleanCode} registered in catalog.`);
      setShowCourseModal(false);
      setCourseID("");
      setCourseName("");
      setCourseDesc("");
      setSessionCourseID(cleanCode);
    } catch (err) {
      toast.error(err?.data?.error || "Failed to register course");
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      const selectedCourseObj = courses.find((c) => c.courseID === sessionCourseID);
      await createSession({
        courseID: sessionCourseID,
        courseName: selectedCourseObj?.courseName || sessionCourseID,
        description: selectedCourseObj?.description || "Synced from CoursePass catalog",
        session_name: sessionName.trim(),
        total_expected_classes: Number(totalClasses),
      }).unwrap();
      toast.success("Session & isolated Computer Vision collection provisioned!");
      setShowSessionModal(false);
      setSessionCourseID("");
      setSessionName("2025/2026");
      setTotalClasses(13);
      refetch();
    } catch (err) {
      toast.error(err?.data?.error || "Failed to provision session");
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    router.push("/login");
    toast.success("Signed out of Command Center");
  };

  const requiredLecturesPreview = Math.ceil((Number(totalClasses) || 0) * 0.75);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 flex">
      {/* ── Left Sidebar Navigation ── */}
      <Sidebar
        user={user}
        role="lecturer"
        onCreateSessionClick={() => setShowSessionModal(true)}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        badges={{
          sessionsCount: sessions.length,
        }}
      />

      {/* ── Main Workspace Area (Offset by sidebar width on desktop) ── */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 xl:pl-72">
        <TopBar
          onMenuClick={() => setSidebarOpen(true)}
          title="Lecturer Console"
          subtitle="CoursePass // Attendance & Biometrics Roster"
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSessionModal(true)}
                className="inline-flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white px-3.5 py-2 rounded-xl font-semibold text-xs transition shadow-sm shadow-blue-500/20"
              >
                <Plus className="w-3.5 h-3.5 text-white" />
                <span>New Session</span>
              </button>
            </div>
          }
        />

        {/* ── Main Content Workspace ── */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ── Executive Summary Strip (4 Metric Cards) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-sans text-slate-400 uppercase">
              <span>ACTIVE SESSIONS</span>
              <Calendar className="w-4 h-4 text-blue-500" />
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-bold font-sans tracking-tight text-slate-900">
                {sessions.length}
              </span>
              <span className="text-[11px] font-sans text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded">
                LIVE ROSTERS
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-sans text-slate-400 uppercase">
              <span>COURSEPASS CATALOG</span>
              <BookOpen className="w-4 h-4 text-blue-500" />
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-bold font-sans tracking-tight text-slate-900">
                {courses.length}
              </span>
              <span className="text-[11px] font-sans text-blue-600 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded">
                API SYNCED
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-sans text-slate-400 uppercase">
              <span>ENROLLED STUDENTS</span>
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-bold font-sans tracking-tight text-slate-900">
                {totalEnrolledAcrossSessions}
              </span>
              <span className="text-[11px] font-sans text-slate-500">
                PORTAL SYNCED
              </span>
            </div>
          </div>

          <div className="bg-obsidian-950 text-white rounded-2xl p-5 border border-obsidian-700 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-vision-grid-dark opacity-30 pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between text-[11px] font-sans text-blue-400 uppercase">
              <span>CV FACE COLLECTIONS</span>
              <ScanFace className="w-4 h-4 text-blue-400" />
            </div>
            <div className="relative z-10 mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-bold font-sans tracking-tight text-white">
                {sessions.length}
              </span>
              <span className="text-[10px] font-sans text-blue-300 bg-blue-500/15 border border-blue-400/30 px-2 py-0.5 rounded">
                ISOLATED 1:N
              </span>
            </div>
          </div>
        </div>

        {/* ── Course Registry Filter Pills & Search Bar ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <span className="text-[11px] font-sans uppercase text-slate-400 mr-1 shrink-0">
              FILTER:
            </span>
            <button
              onClick={() => setSelectedCourseFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-sans font-semibold transition shrink-0 ${
                selectedCourseFilter === "ALL"
                  ? "bg-blue-500 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600"
              }`}
            >
              ALL SESSIONS ({sessions.length})
            </button>
            {Array.from(new Set(sessions.map((s) => s.courseID).filter(Boolean))).map((code) => (
              <button
                key={code}
                onClick={() => setSelectedCourseFilter(code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-sans font-semibold transition shrink-0 ${
                  selectedCourseFilter === code
                    ? "bg-blue-500 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                {code}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by course code or title..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition"
            />
          </div>
        </div>

        {/* ── Sessions Grid ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-sans uppercase tracking-wider text-slate-500 font-semibold">
              PROVISIONED COURSE SESSIONS ({filteredSessions.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-6 animate-pulse h-56 border border-slate-200/80"
                />
              ))}
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center max-w-xl mx-auto my-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center mx-auto mb-4 shadow-md shadow-blue-500/20">
                <ScanFace className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                {sessions.length === 0
                  ? "No Course Sessions Provisioned"
                  : "No matching sessions found"}
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                {sessions.length === 0
                  ? "Select an existing course from the CoursePass Central Hub to provision an isolated Computer Vision collection, share lecture materials, and schedule quizzes."
                  : "Try clearing your search query or switching the course filter pill above."}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => setShowSessionModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold transition shadow-md shadow-blue-500/20"
                >
                  Provision Course Session
                </button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/lecturer/${session.id}`}
                  className="group relative bg-white rounded-2xl p-6 border border-slate-200/90 hover:border-blue-500 hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden"
                >
                  {/* Subtle Corner Reticles on Hover */}
                  <div className="absolute top-2.5 left-2.5 w-2.5 h-2.5 border-t-2 border-l-2 border-transparent group-hover:border-blue-500 transition-colors" />
                  <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 border-t-2 border-r-2 border-transparent group-hover:border-blue-500 transition-colors" />
                  <div className="absolute bottom-2.5 left-2.5 w-2.5 h-2.5 border-b-2 border-l-2 border-transparent group-hover:border-blue-500 transition-colors" />
                  <div className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 border-b-2 border-r-2 border-transparent group-hover:border-blue-500 transition-colors" />

                  <div>
                    {/* Top Metadata Row */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-500 text-white font-sans text-xs font-bold tracking-wider">
                          {session.courseID}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-sans text-xs font-medium">
                          {session.session_name}
                        </span>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 group-hover:bg-blue-500 group-hover:text-white group-hover:border-blue-500 transition-colors">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Course Name */}
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-1">
                      {session.course_name}
                    </h3>

                    {/* Computer Vision Collection Tag */}
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-sans text-slate-400 mb-6">
                      <ScanFace className="w-3.5 h-3.5 text-blue-500" />
                      <span>CV ENGINE SCOPE: CV-{session.courseID}</span>
                    </div>
                  </div>

                  {/* Bottom Telemetry Strip */}
                  <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100">
                      <span className="block text-[10px] font-sans text-slate-400 uppercase">
                        ENROLLED ROSTER
                      </span>
                      <span className="font-sans font-bold text-slate-900 text-sm">
                        {session.enrolled_students ?? 0} Students
                      </span>
                    </div>
                    <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100">
                      <span className="block text-[10px] font-sans text-slate-400 uppercase">
                        ELIGIBILITY RULE
                      </span>
                      <span className="font-sans font-bold text-emerald-700 text-sm">
                        ≥ 75% Attendance
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      </div>

      {/* ── Create Course Modal ── */}
      {showCourseModal && (
        <Modal
          badge="CATALOG // NEW COURSE"
          title="Register Academic Course"
          subtitle="Add a course code to your lecturer catalog before provisioning an academic session."
          onClose={() => setShowCourseModal(false)}
        >
          <form onSubmit={handleCreateCourse} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Course Code
              </label>
              <input
                type="text"
                value={courseID}
                onChange={(e) => setCourseID(e.target.value)}
                placeholder="e.g. CSC401 or PHY102"
                className="w-full border border-slate-200 bg-slate-50/60 focus:bg-white rounded-xl px-4 py-2.5 text-sm font-sans uppercase text-slate-900 focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Course Title
              </label>
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g. Artificial Intelligence & Computer Vision"
                className="w-full border border-slate-200 bg-slate-50/60 focus:bg-white rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Syllabus / Description (Optional)
              </label>
              <textarea
                value={courseDesc}
                onChange={(e) => setCourseDesc(e.target.value)}
                placeholder="Brief course overview for synced student rosters..."
                rows={3}
                className="w-full border border-slate-200 bg-slate-50/60 focus:bg-white rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none resize-none transition"
              />
            </div>
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCourseModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingCourse}
                className="px-5 py-2.5 bg-blue-500 text-white rounded-xl text-xs font-semibold hover:bg-blue-600 disabled:bg-slate-300 transition shadow-sm shadow-blue-500/20"
              >
                {creatingCourse ? "Registering..." : "Register Course"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Create Session Modal ── */}
      {showSessionModal && (
        <Modal
          badge="PROVISIONING // COMPUTER VISION SESSION"
          title="Provision Course Session"
          subtitle="Creates an academic session and provisions an isolated per-course Computer Vision collection."
          onClose={() => setShowSessionModal(false)}
        >
          <form onSubmit={handleCreateSession} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Select Course (CoursePass Central Hub)
              </label>
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  placeholder="Search CoursePass courses by code or title (e.g. CSC, MTH, PHY)..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 outline-none transition"
                />
              </div>
              <select
                value={sessionCourseID}
                onChange={(e) => setSessionCourseID(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50/60 focus:bg-white rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none cursor-pointer transition"
                required
              >
                <option value="" disabled>
                  Choose a course from CoursePass Central Hub ({filteredModalCourses.length} available)...
                </option>
                {filteredModalCourses.map((course) => (
                  <option key={course.courseID} value={course.courseID}>
                    {course.courseID} — {course.courseName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Academic Session
                </label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="e.g. 2025/2026"
                  className="w-full border border-slate-200 bg-slate-50/60 focus:bg-white rounded-xl px-4 py-2.5 text-sm font-sans text-slate-900 focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition"
                  required
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
                  max={100}
                  className="w-full border border-slate-200 bg-slate-50/60 focus:bg-white rounded-xl px-4 py-2.5 text-sm font-sans text-slate-900 focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition"
                  required
                />
              </div>
            </div>

            {/* Live 75% Threshold Calculation Box */}
            <div className="p-3.5 rounded-xl bg-obsidian-950 text-white border border-obsidian-700 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-sans text-blue-400 uppercase block">
                  75% ATTENDANCE ELIGIBILITY THRESHOLD
                </span>
                <span className="text-xs text-slate-300">
                  Students must attend at least{" "}
                  <strong className="text-white font-sans">
                    {requiredLecturesPreview} of {totalClasses || 0}
                  </strong>{" "}
                  lectures to qualify for exams.
                </span>
              </div>
              <ScanFace className="w-5 h-5 text-blue-400 shrink-0" />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSessionModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingSession || courses.length === 0}
                className="px-5 py-2.5 bg-blue-500 text-white rounded-xl text-xs font-semibold hover:bg-blue-600 disabled:bg-slate-300 transition shadow-sm shadow-blue-500/20"
              >
                {creatingSession ? "Provisioning..." : "Provision Session"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ badge, title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian-950/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
        >
          <X className="h-4 w-4" />
        </button>
        {badge && (
          <div className="text-[11px] font-sans font-semibold text-blue-600 uppercase tracking-wider mb-1">
            {badge}
          </div>
        )}
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-1 mb-6">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
