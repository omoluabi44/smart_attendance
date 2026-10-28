"use client";

import { useState, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import CPLogo from "@/app/ui/CPLogo";
import Sidebar from "@/app/ui/navigation/Sidebar";
import TopBar from "@/app/ui/navigation/TopBar";
import { logout } from "@/app/lib/features/user/userStore";
import {
  useGetAdminOverviewQuery,
  useGetAdminUsersQuery,
  useAdminCreateLecturerMutation,
  useAdminResetUserPasswordMutation,
  useAssignRoleMutation,
  useAdminDeleteUserMutation,
  useGetAdminCoursesQuery,
  useAdminDeleteCourseMutation,
  useGetAdminSessionsQuery,
  useAdminDeleteSessionMutation,
  useAdminAssignLecturerToSessionMutation,
  useAdminRemoveLecturerFromSessionMutation,
  useLecturerCreateCourseMutation,
  useLecturerCreateSessionMutation,
} from "@/app/lib/api/facepassApi";
import {
  Users,
  UserPlus,
  ShieldCheck,
  KeyRound,
  BookOpen,
  Calendar,
  ScanFace,
  Search,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  ArrowUpRight,
  LogOut,
  Plus,
  FolderPlus,
  X,
  AlertTriangle,
  Sparkles,
  Mail,
  LayoutDashboard,
} from "lucide-react";

function generateClientPassword(length = 10) {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "@#$";
  const all = upper + lower + digits + symbols;
  let pwd =
    upper[Math.floor(Math.random() * upper.length)] +
    lower[Math.floor(Math.random() * lower.length)] +
    digits[Math.floor(Math.random() * digits.length)] +
    symbols[Math.floor(Math.random() * symbols.length)];
  for (let i = pwd.length; i < length; i++) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }
  return pwd
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("");
}

export default function AdminCommandCenter() {
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useSelector((state) => state.user);

  // Route Guard: require authenticated admin without pending forced password change
  useEffect(() => {
    if (!user?.isLoggedIn || !user?.access_token) {
      router.replace("/login");
    } else if (user?.must_change_password) {
      router.replace("/change-password");
    } else if (user?.role !== "admin") {
      toast.error("Admin privileges required to access /admin.");
      router.replace("/lecturer");
    }
  }, [
    user?.isLoggedIn,
    user?.access_token,
    user?.must_change_password,
    user?.role,
    router,
  ]);

  const isAuthorizedAdmin =
    user?.isLoggedIn &&
    user?.access_token &&
    user?.role === "admin" &&
    !user?.must_change_password;

  // Queries
  const { data: overview, isLoading: loadingOverview } =
    useGetAdminOverviewQuery(undefined, { skip: !isAuthorizedAdmin });
  const { data: usersData, isLoading: loadingUsers } = useGetAdminUsersQuery(
    undefined,
    { skip: !isAuthorizedAdmin }
  );
  const { data: coursesData, isLoading: loadingCourses } =
    useGetAdminCoursesQuery(undefined, { skip: !isAuthorizedAdmin });
  const { data: sessionsData, isLoading: loadingSessions } =
    useGetAdminSessionsQuery(undefined, { skip: !isAuthorizedAdmin });

  // Mutations
  const [adminCreateLecturer, { isLoading: creatingLecturer }] =
    useAdminCreateLecturerMutation();
  const [adminResetPassword, { isLoading: resettingPassword }] =
    useAdminResetUserPasswordMutation();
  const [assignRole] = useAssignRoleMutation();
  const [adminDeleteUser] = useAdminDeleteUserMutation();
  const [adminDeleteCourse] = useAdminDeleteCourseMutation();
  const [adminDeleteSession] = useAdminDeleteSessionMutation();
  const [adminAssignLecturer, { isLoading: assigningLecturer }] =
    useAdminAssignLecturerToSessionMutation();
  const [adminRemoveLecturer] = useAdminRemoveLecturerFromSessionMutation();
  const [createCourse, { isLoading: creatingCourse }] =
    useLecturerCreateCourseMutation();
  const [createSession, { isLoading: creatingSession }] =
    useLecturerCreateSessionMutation();

  // Tabs & Filters & Mobile Navigation
  const [activeTab, setActiveTab] = useState("users"); // "users" | "sessions"
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [userSearch, setUserSearch] = useState("");
  const [sessionSearch, setSessionSearch] = useState("");

  // Modals State
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [credentialCard, setCredentialCard] = useState(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [assignModalSession, setAssignModalSession] = useState(null);
  const [selectedLecturerToAssign, setSelectedLecturerToAssign] = useState("");

  // Provision Lecturer Form State
  const [lecName, setLecName] = useState("");
  const [lecEmail, setLecEmail] = useState("");
  const [lecMatric, setLecMatric] = useState("");
  const [lecRole, setLecRole] = useState("lecturer");
  const [lecPassword, setLecPassword] = useState(() =>
    generateClientPassword(10)
  );
  const [forceChangeOnLogin, setForceChangeOnLogin] = useState(true);
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);

  // Course & Session Creation Form State
  const [courseID, setCourseID] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseDesc, setCourseDesc] = useState("");
  const [sessionCourseID, setSessionCourseID] = useState("");
  const [sessionName, setSessionName] = useState("2025/2026");
  const [totalClasses, setTotalClasses] = useState(13);

  // Copy states
  const [copiedField, setCopiedField] = useState(null);

  const allUsers = usersData?.data || [];
  const allCourses = coursesData?.data || [];
  const allSessions = sessionsData?.data || [];

  const lecturersList = useMemo(
    () => allUsers.filter((u) => u.role === "lecturer" || u.role === "admin"),
    [allUsers]
  );

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return allUsers.filter((u) => {
      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchesQuery =
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.matric && u.matric.toLowerCase().includes(q));
      return matchesRole && matchesQuery;
    });
  }, [allUsers, roleFilter, userSearch]);

  const filteredSessions = useMemo(() => {
    const q = sessionSearch.trim().toLowerCase();
    if (!q) return allSessions;
    return allSessions.filter(
      (s) =>
        (s.courseID && s.courseID.toLowerCase().includes(q)) ||
        (s.course_name && s.course_name.toLowerCase().includes(q)) ||
        (s.session_name && s.session_name.toLowerCase().includes(q))
    );
  }, [allSessions, sessionSearch]);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleProvisionSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await adminCreateLecturer({
        name: lecName.trim(),
        email: lecEmail.trim(),
        matric: lecMatric.trim() || undefined,
        role: lecRole,
        password: lecPassword.trim(),
        must_change_password: forceChangeOnLogin,
        send_email: sendWelcomeEmail,
      }).unwrap();

      toast.success(res.message || "Account provisioned!");
      setShowProvisionModal(false);

      // Show Credential Handover Card
      setCredentialCard({
        title: "Account Provisioned Successfully",
        name: res.user.name,
        email: res.user.email,
        matric: res.user.matric,
        role: res.user.role,
        temporary_password: res.temporary_password,
        must_change_password: res.user.must_change_password,
        email_sent: res.email_sent,
      });

      // Reset form
      setLecName("");
      setLecEmail("");
      setLecMatric("");
      setLecRole("lecturer");
      setLecPassword(generateClientPassword(10));
      setForceChangeOnLogin(true);
    } catch (err) {
      toast.error(err?.data?.error || "Failed to provision lecturer account");
    }
  };

  const handleResetUserPassword = async (targetUser) => {
    const newTempPassword = generateClientPassword(10);
    try {
      const res = await adminResetPassword({
        userId: targetUser.id,
        password: newTempPassword,
        must_change_password: true,
        send_email: true,
      }).unwrap();

      toast.success(`Temporary password generated for ${targetUser.name}`);
      setCredentialCard({
        title: "Temporary Password Reset",
        name: res.user.name,
        email: res.user.email,
        matric: targetUser.matric,
        role: res.user.role,
        temporary_password: res.temporary_password,
        must_change_password: true,
        email_sent: res.email_sent,
      });
    } catch (err) {
      toast.error(err?.data?.error || "Failed to reset password");
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await assignRole({ user_id: userId, role: newRole }).unwrap();
      toast.success(res.message || `Role updated to ${newRole}`);
    } catch (err) {
      toast.error(err?.data?.error || "Role update failed");
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete ${targetUser.name} (${targetUser.email})?`
      )
    ) {
      return;
    }
    try {
      await adminDeleteUser(targetUser.id).unwrap();
      toast.success(`Deleted ${targetUser.name}`);
    } catch (err) {
      toast.error(err?.data?.error || "Failed to delete user");
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      const cleanCode = courseID.toUpperCase().trim();
      await createCourse({
        courseID: cleanCode,
        courseName: courseName.trim(),
        description: courseDesc.trim() || "Institutional catalog course",
      }).unwrap();
      toast.success(`Course ${cleanCode} added to catalog!`);
      setShowCourseModal(false);
      setCourseID("");
      setCourseName("");
      setCourseDesc("");
      setSessionCourseID(cleanCode);
    } catch (err) {
      toast.error(err?.data?.error || "Failed to create course");
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      const selectedCourseObj = allCourses.find(
        (c) => c.courseID === sessionCourseID
      );
      await createSession({
        courseID: sessionCourseID,
        courseName: selectedCourseObj?.courseName || sessionCourseID,
        description: selectedCourseObj?.description || "Institutional course",
        session_name: sessionName.trim(),
        total_expected_classes: Number(totalClasses),
      }).unwrap();
      toast.success("Academic session provisioned!");
      setShowSessionModal(false);
      setSessionCourseID("");
      setSessionName("2025/2026");
      setTotalClasses(13);
    } catch (err) {
      toast.error(err?.data?.error || "Failed to provision session");
    }
  };

  const handleAssignLecturerToSession = async (e) => {
    e.preventDefault();
    if (!assignModalSession || !selectedLecturerToAssign) return;
    try {
      const res = await adminAssignLecturer({
        sessionId: assignModalSession.id,
        lecturer_id: selectedLecturerToAssign,
      }).unwrap();
      toast.success(res.message || "Lecturer assigned to session");
      setAssignModalSession(null);
      setSelectedLecturerToAssign("");
    } catch (err) {
      toast.error(err?.data?.error || "Failed to assign lecturer");
    }
  };

  const handleRemoveLecturerFromSession = async (sessionId, lecturerId, name) => {
    try {
      await adminRemoveLecturer({ sessionId, lecturerId }).unwrap();
      toast.success(`Removed ${name} from session`);
    } catch (err) {
      toast.error(err?.data?.error || "Failed to unassign lecturer");
    }
  };

  const handleDeleteSession = async (session) => {
    if (
      !window.confirm(
        `Delete session ${session.courseID} (${session.session_name}) and its attendance logs?`
      )
    ) {
      return;
    }
    try {
      await adminDeleteSession(session.id).unwrap();
      toast.success("Session deleted");
    } catch (err) {
      toast.error(err?.data?.error || "Failed to delete session");
    }
  };

  const handleDeleteCourse = async (course) => {
    if (
      !window.confirm(`Delete course ${course.courseID} (${course.courseName})?`)
    ) {
      return;
    }
    try {
      await adminDeleteCourse(course.id).unwrap();
      toast.success(`Course ${course.courseID} deleted`);
    } catch (err) {
      toast.error(err?.data?.error || "Failed to delete course");
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    router.push("/login");
    toast.success("Signed out of Admin Command Center");
  };

  if (!isAuthorizedAdmin) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-xs font-mono uppercase tracking-wider text-slate-500">
          VERIFYING ADMIN CLEARANCE...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 flex">
      {/* ── Left Sidebar Navigation ── */}
      <Sidebar
        user={user}
        role="admin"
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onProvisionClick={() => {
          setLecPassword(generateClientPassword(10));
          setShowProvisionModal(true);
        }}
        onCreateCourseClick={() => setShowCourseModal(true)}
        onCreateSessionClick={() => setShowSessionModal(true)}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        badges={{
          usersCount: allUsers.length,
          sessionsCount: allSessions.length,
        }}
      />

      {/* ── Main Workspace Area (Offset by sidebar width on desktop) ── */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 xl:pl-72">
        <TopBar
          onMenuClick={() => setSidebarOpen(true)}
          title="Administration Console"
          subtitle={
            activeTab === "users"
              ? "System Governance // Faculty & Accounts"
              : "System Governance // Course & Session Rosters"
          }
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setLecPassword(generateClientPassword(10));
                  setShowProvisionModal(true);
                }}
                className="inline-flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white px-3.5 py-2 rounded-xl font-semibold text-xs transition shadow-sm shadow-blue-500/20"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Provision Lecturer</span>
              </button>
            </div>
          }
        />

        {/* ── Main Admin Workspace Content ── */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ── 4 Executive Telemetry Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase">
              <span>FACULTY &amp; ADMINS</span>
              <ShieldCheck className="w-4 h-4 text-blue-500" />
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-bold font-mono tracking-tight text-slate-900">
                {loadingOverview
                  ? "—"
                  : (overview?.total_lecturers || 0) +
                    (overview?.total_admins || 0)}
              </span>
              <span className="text-[11px] font-mono text-blue-600 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded">
                {overview?.total_lecturers || 0} LECTURERS
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase">
              <span>PENDING PASSWORD RESETS</span>
              <KeyRound className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-bold font-mono tracking-tight text-slate-900">
                {loadingOverview ? "—" : overview?.pending_password_changes || 0}
              </span>
              <span className="text-[11px] font-mono text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded">
                FORCE ON LOGIN
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase">
              <span>COURSES &amp; SESSIONS</span>
              <Calendar className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-bold font-mono tracking-tight text-slate-900">
                {loadingOverview ? "—" : overview?.total_sessions || 0}
              </span>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded">
                {overview?.total_courses || 0} COURSES
              </span>
            </div>
          </div>

          <div className="bg-obsidian-950 text-white rounded-2xl p-5 border border-obsidian-700 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-vision-grid-dark opacity-30 pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-blue-400 uppercase">
              <span>SYNCED STUDENTS &amp; SCANS</span>
              <ScanFace className="w-4 h-4 text-blue-400" />
            </div>
            <div className="relative z-10 mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-bold font-mono tracking-tight text-white">
                {loadingOverview ? "—" : overview?.total_students || 0}
              </span>
              <span className="text-[10px] font-mono text-blue-300 bg-blue-500/15 border border-blue-400/30 px-2 py-0.5 rounded">
                {overview?.total_attendance_logs || 0} LOGS
              </span>
            </div>
          </div>
        </div>

        {/* ── Navigation Tabs ── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200/90">
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === "users"
                  ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Lecturers &amp; Users ({allUsers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("sessions")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === "sessions"
                  ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>
                Courses &amp; Sessions ({allSessions.length})
              </span>
            </button>
          </div>

          {activeTab === "sessions" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCourseModal(true)}
                className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-600 px-3.5 py-2 rounded-xl font-semibold text-xs transition"
              >
                <FolderPlus className="w-3.5 h-3.5 text-blue-500" />
                <span>Register Course</span>
              </button>
              <button
                onClick={() => setShowSessionModal(true)}
                className="inline-flex items-center gap-1.5 bg-obsidian-950 hover:bg-slate-800 text-white px-4 py-2 rounded-xl font-semibold text-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Provision Session</span>
              </button>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 1: LECTURERS & USERS MANAGEMENT
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "users" && (
          <div className="space-y-5">
            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                <span className="text-[11px] font-mono uppercase text-slate-400 mr-1 shrink-0">
                  ROLE FILTER:
                </span>
                {[
                  { key: "ALL", label: `ALL (${allUsers.length})` },
                  {
                    key: "lecturer",
                    label: `LECTURERS (${
                      allUsers.filter((u) => u.role === "lecturer").length
                    })`,
                  },
                  {
                    key: "admin",
                    label: `ADMINS (${
                      allUsers.filter((u) => u.role === "admin").length
                    })`,
                  },
                  {
                    key: "student",
                    label: `STUDENTS (${
                      allUsers.filter((u) => u.role === "student").length
                    })`,
                  },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setRoleFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition shrink-0 ${
                      roleFilter === tab.key
                        ? "bg-blue-500 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search name, email, or staff/matric ID..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition"
                />
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
              <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800">
                    INSTITUTIONAL DIRECTORY ({filteredUsers.length})
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  STUDENT BIOMETRIC ENROLLMENT IS MANAGED VIA COURSEPASS
                </span>
              </div>

              {loadingUsers ? (
                <div className="p-12 text-center text-xs font-mono text-slate-400">
                  LOADING DIRECTORY...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-800 mb-1">
                    No matching accounts found
                  </p>
                  <p className="text-xs text-slate-500 mb-4">
                    Provision a new lecturer account or clear your search filter.
                  </p>
                  <button
                    onClick={() => setShowProvisionModal(true)}
                    className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold"
                  >
                    + Provision Lecturer Account
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        <th className="py-3.5 px-6">Name &amp; Email</th>
                        <th className="py-3.5 px-6">Staff / Matric ID</th>
                        <th className="py-3.5 px-6">Role</th>
                        <th className="py-3.5 px-6">Password Policy Status</th>
                        <th className="py-3.5 px-6">Sessions</th>
                        <th className="py-3.5 px-6 text-right">
                          Admin Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredUsers.map((u) => {
                        const isSelf = u.id === user?.id;
                        return (
                          <tr
                            key={u.id}
                            className="hover:bg-slate-50/80 transition"
                          >
                            <td className="py-3.5 px-6">
                              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {isSelf && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white font-mono text-[9px]">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-500 font-mono text-[11px]">
                                {u.email}
                              </div>
                            </td>
                            <td className="py-3.5 px-6 font-mono text-slate-600">
                              {u.matric || "—"}
                            </td>
                            <td className="py-3.5 px-6">
                              <select
                                value={u.role || "student"}
                                disabled={isSelf}
                                onChange={(e) =>
                                  handleRoleChange(u.id, e.target.value)
                                }
                                className={`font-mono text-[11px] font-semibold uppercase rounded-lg px-2.5 py-1 border outline-none cursor-pointer ${
                                  u.role === "admin"
                                    ? "bg-obsidian-950 text-white border-obsidian-950"
                                    : u.role === "lecturer"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-slate-100 text-slate-700 border-slate-200"
                                }`}
                              >
                                <option
                                  value="lecturer"
                                  className="bg-white text-slate-900"
                                >
                                  LECTURER
                                </option>
                                <option
                                  value="admin"
                                  className="bg-white text-slate-900"
                                >
                                  ADMIN
                                </option>
                                <option
                                  value="student"
                                  className="bg-white text-slate-900"
                                >
                                  STUDENT
                                </option>
                              </select>
                            </td>
                            <td className="py-3.5 px-6">
                              {u.must_change_password ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-mono text-[10px] font-bold">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  TEMP PASSWORD // FORCE CHANGE
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-[10px] font-bold">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  PERSONAL PASSWORD SET
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-6 font-mono text-slate-600">
                              {u.role === "student"
                                ? "—"
                                : `${u.assigned_sessions_count || 0} assigned`}
                            </td>
                            <td className="py-3.5 px-6 text-right">
                              <div className="inline-flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  disabled={resettingPassword}
                                  onClick={() => handleResetUserPassword(u)}
                                  title="Generate a new temporary password & force password change on next login"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-600 font-semibold text-[11px] transition"
                                >
                                  <KeyRound className="w-3 h-3" />
                                  <span>Reset Temp Password</span>
                                </button>
                                {!isSelf && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUser(u)}
                                    title="Delete User"
                                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 transition"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 2: COURSES & ACADEMIC SESSIONS GOVERNANCE
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "sessions" && (
          <div className="space-y-8">
            {/* Search Sessions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  University-Wide Academic Sessions ({filteredSessions.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Assign or remove lecturers on any session, or open its live
                  Biometric Control Room.
                </p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={sessionSearch}
                  onChange={(e) => setSessionSearch(e.target.value)}
                  placeholder="Filter sessions by course code..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Sessions Table */}
            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
              {loadingSessions ? (
                <div className="p-12 text-center text-xs font-mono text-slate-400">
                  LOADING SESSIONS...
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="p-12 text-center">
                  <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-800 mb-1">
                    No Academic Sessions Found
                  </p>
                  <p className="text-xs text-slate-500 mb-4">
                    Register a course and provision a session to begin.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        <th className="py-3.5 px-6">Course &amp; Session</th>
                        <th className="py-3.5 px-6">Assigned Faculty</th>
                        <th className="py-3.5 px-6">Roster &amp; Logs</th>
                        <th className="py-3.5 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredSessions.map((s) => (
                        <tr
                          key={s.id}
                          className="hover:bg-slate-50/80 transition"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 rounded bg-blue-500 text-white font-mono text-xs font-bold">
                                {s.courseID}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[11px] text-slate-700">
                                {s.session_name}
                              </span>
                              <span className="text-[11px] font-mono text-slate-400">
                                {s.total_expected_classes} lectures
                              </span>
                            </div>
                            <div className="font-semibold text-slate-900">
                              {s.course_name}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {s.lecturers && s.lecturers.length > 0 ? (
                                s.lecturers.map((lec) => (
                                  <span
                                    key={lec.id}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-xs font-medium"
                                  >
                                    <span>{lec.name}</span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRemoveLecturerFromSession(
                                          s.id,
                                          lec.id,
                                          lec.name
                                        )
                                      }
                                      title={`Unassign ${lec.name}`}
                                      className="text-slate-400 hover:text-rose-600"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))
                              ) : (
                                <span className="text-amber-600 font-mono text-[11px]">
                                  UNASSIGNED
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setAssignModalSession(s);
                                  setSelectedLecturerToAssign("");
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 text-[11px] font-semibold transition"
                              >
                                <Plus className="w-3 h-3" />
                                Assign Lecturer
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-mono">
                            <div className="text-slate-900 font-bold">
                              {s.enrolled_students || 0} Students
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {s.attendance_logs_count || 0} Attendance Scans
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="inline-flex items-center gap-2">
                              <Link
                                href={`/lecturer/${s.id}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-obsidian-950 hover:bg-slate-800 text-white text-xs font-semibold transition"
                              >
                                <span>Control Room</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleDeleteSession(s)}
                                title="Delete Session"
                                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Course Catalog Table */}
            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
              <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800">
                  LOCAL COURSE CATALOG ({allCourses.length})
                </span>
              </div>
              {loadingCourses ? (
                <div className="p-8 text-center text-xs font-mono text-slate-400">
                  LOADING COURSES...
                </div>
              ) : allCourses.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No local courses registered yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        <th className="py-3 px-6">Course Code</th>
                        <th className="py-3 px-6">Course Title</th>
                        <th className="py-3 px-6">Active Sessions</th>
                        <th className="py-3 px-6 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {allCourses.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/80">
                          <td className="py-3 px-6 font-mono font-bold text-slate-900">
                            {c.courseID}
                          </td>
                          <td className="py-3 px-6 text-slate-700">
                            {c.courseName}
                          </td>
                          <td className="py-3 px-6 font-mono text-slate-600">
                            {c.session_count || 0}
                          </td>
                          <td className="py-3 px-6 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteCourse(c)}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 transition"
                              title="Delete Course"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 1: PROVISION LECTURER / ADMIN ACCOUNT
         ══════════════════════════════════════════════════════════════════════ */}
      {showProvisionModal && (
        <Modal
          badge="ADMINISTRATION // ACCOUNT PROVISIONING"
          title="Provision Lecturer or Admin Account"
          subtitle="Create a verified institutional account with a temporary password and force password rotation on first login."
          onClose={() => setShowProvisionModal(false)}
        >
          <form onSubmit={handleProvisionSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  value={lecName}
                  onChange={(e) => setLecName(e.target.value)}
                  placeholder="e.g. Dr. Adaeze Okafor"
                  required
                  className="w-full border border-slate-200 bg-slate-50/60 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Institutional Email
                </label>
                <input
                  type="email"
                  value={lecEmail}
                  onChange={(e) => setLecEmail(e.target.value)}
                  placeholder="lecturer@university.edu"
                  required
                  className="w-full border border-slate-200 bg-slate-50/60 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Staff ID (Optional)
                </label>
                <input
                  type="text"
                  value={lecMatric}
                  onChange={(e) => setLecMatric(e.target.value)}
                  placeholder="Auto-generated if blank (e.g. LEC-4821)"
                  className="w-full border border-slate-200 bg-slate-50/60 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Platform Role
                </label>
                <select
                  value={lecRole}
                  onChange={(e) => setLecRole(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50/60 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 outline-none cursor-pointer"
                >
                  <option value="lecturer">Lecturer (Command Center)</option>
                  <option value="admin">Administrator (Full Access)</option>
                </select>
              </div>
            </div>

            {/* Temporary Password Field with Generator */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Temporary Password
                </label>
                <button
                  type="button"
                  onClick={() => setLecPassword(generateClientPassword(10))}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Auto-Generate</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={lecPassword}
                  onChange={(e) => setLecPassword(e.target.value)}
                  required
                  minLength={6}
                  className="flex-1 border border-slate-200 bg-slate-50/60 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:border-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(lecPassword, "Temporary password")
                  }
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
              </div>
            </div>

            {/* Security Toggles */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={forceChangeOnLogin}
                  onChange={(e) => setForceChangeOnLogin(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="block text-xs font-semibold text-slate-900">
                    Force password change upon first login (Recommended)
                  </span>
                  <span className="block text-[11px] text-slate-500">
                    Redirects the lecturer to /change-password and blocks
                    access until they set a personal password.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer pt-1 border-t border-slate-200/60">
                <input
                  type="checkbox"
                  checked={sendWelcomeEmail}
                  onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="block text-xs font-semibold text-slate-900">
                    Send welcome email with temporary credentials
                  </span>
                  <span className="block text-[11px] text-slate-500">
                    Dispatches an email if SMTP is configured; you will also get
                    a copyable credential card on screen.
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowProvisionModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingLecturer}
                className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold shadow-md shadow-blue-500/20 disabled:bg-slate-300"
              >
                {creatingLecturer
                  ? "Provisioning..."
                  : "Create Account & View Credentials"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 2: CREDENTIAL HANDOVER CARD (AFTER CREATION OR RESET)
         ══════════════════════════════════════════════════════════════════════ */}
      {credentialCard && (
        <Modal
          badge="SECURITY HANDOVER // TEMPORARY CREDENTIALS"
          title={credentialCard.title}
          subtitle="Share these credentials with the faculty member. They will be required to set a new personal password immediately upon signing in."
          onClose={() => setCredentialCard(null)}
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-obsidian-950 text-white border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div>
                  <div className="text-xs font-bold text-white">
                    {credentialCard.name}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    {credentialCard.role?.toUpperCase()} •{" "}
                    {credentialCard.matric || "STAFF"}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono text-[10px]">
                  MUST CHANGE ON LOGIN
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block">
                      LOGIN EMAIL
                    </span>
                    <span className="text-slate-100">
                      {credentialCard.email}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(credentialCard.email, "Email")
                    }
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300"
                  >
                    {copiedField === "Email" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block">
                      TEMPORARY PASSWORD
                    </span>
                    <span className="text-emerald-400 font-bold text-sm">
                      {credentialCard.temporary_password}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        credentialCard.temporary_password,
                        "Temporary Password"
                      )
                    }
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300"
                  >
                    {copiedField === "Temporary Password" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {credentialCard.email_sent
                  ? "Welcome email dispatched via SMTP."
                  : "Copy credentials below to share directly with lecturer."}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const summary = `FacePass Institutional Credentials\nName: ${credentialCard.name}\nLogin Email: ${credentialCard.email}\nTemporary Password: ${credentialCard.temporary_password}\nNote: You will be prompted to set a new personal password on your first login.`;
                  copyToClipboard(summary, "Full Credential Summary");
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold shadow-md shadow-blue-500/20"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Full Summary</span>
              </button>
              <button
                type="button"
                onClick={() => setCredentialCard(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 3: ASSIGN LECTURER TO SESSION
         ══════════════════════════════════════════════════════════════════════ */}
      {assignModalSession && (
        <Modal
          badge="SESSION GOVERNANCE // FACULTY ASSIGNMENT"
          title={`Assign Lecturer to ${assignModalSession.courseID}`}
          subtitle={`Session ${assignModalSession.session_name} — ${assignModalSession.course_name}`}
          onClose={() => setAssignModalSession(null)}
        >
          <form onSubmit={handleAssignLecturerToSession} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Select Institutional Lecturer
              </label>
              <select
                value={selectedLecturerToAssign}
                onChange={(e) => setSelectedLecturerToAssign(e.target.value)}
                required
                className="w-full border border-slate-200 bg-slate-50/60 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 outline-none"
              >
                <option value="" disabled>
                  Choose a lecturer ({lecturersList.length} available)...
                </option>
                {lecturersList.map((lec) => (
                  <option key={lec.id} value={lec.id}>
                    {lec.name} ({lec.email}) — {lec.role.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAssignModalSession(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={assigningLecturer || !selectedLecturerToAssign}
                className="px-5 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold disabled:bg-slate-300"
              >
                {assigningLecturer ? "Assigning..." : "Assign to Session"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 4: REGISTER COURSE
         ══════════════════════════════════════════════════════════════════════ */}
      {showCourseModal && (
        <Modal
          badge="CATALOG // NEW COURSE"
          title="Register Academic Course"
          subtitle="Add a course code to the catalog before provisioning an academic session."
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
                placeholder="e.g. CSC401"
                required
                className="w-full border border-slate-200 bg-slate-50/60 focus:bg-white rounded-xl px-4 py-2.5 text-sm font-mono uppercase text-slate-900 outline-none"
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
                placeholder="e.g. Computer Vision & Biometrics"
                required
                className="w-full border border-slate-200 bg-slate-50/60 focus:bg-white rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Description (Optional)
              </label>
              <textarea
                value={courseDesc}
                onChange={(e) => setCourseDesc(e.target.value)}
                rows={2}
                className="w-full border border-slate-200 bg-slate-50/60 focus:bg-white rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCourseModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingCourse}
                className="px-5 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold"
              >
                {creatingCourse ? "Registering..." : "Register Course"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 5: PROVISION SESSION
         ══════════════════════════════════════════════════════════════════════ */}
      {showSessionModal && (
        <Modal
          badge="PROVISIONING // ACADEMIC SESSION"
          title="Provision Course Session"
          subtitle="Create a new academic session and isolated per-course Computer Vision collection."
          onClose={() => setShowSessionModal(false)}
        >
          <form onSubmit={handleCreateSession} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Select Course
              </label>
              <select
                value={sessionCourseID}
                onChange={(e) => setSessionCourseID(e.target.value)}
                required
                className="w-full border border-slate-200 bg-slate-50/60 focus:bg-white rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none"
              >
                <option value="" disabled>
                  Choose a course ({allCourses.length} available)...
                </option>
                {allCourses.map((c) => (
                  <option key={c.courseID} value={c.courseID}>
                    {c.courseID} — {c.courseName}
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
                  required
                  className="w-full border border-slate-200 bg-slate-50/60 focus:bg-white rounded-xl px-4 py-2.5 text-sm font-mono text-slate-900 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Total Expected Lectures
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={totalClasses}
                  onChange={(e) => setTotalClasses(e.target.value)}
                  required
                  className="w-full border border-slate-200 bg-slate-50/60 focus:bg-white rounded-xl px-4 py-2.5 text-sm font-mono text-slate-900 outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSessionModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingSession || allCourses.length === 0}
                className="px-5 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold disabled:bg-slate-300"
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
          <div className="text-[11px] font-mono font-semibold text-blue-600 uppercase tracking-wider mb-1">
            {badge}
          </div>
        )}
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-1 mb-6">{subtitle}</p>
        )}
        {children}
      </div>
    </div>
  );
}
