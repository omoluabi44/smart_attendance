import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import {
  Users,
  BookOpen,
  Calendar,
  UserPlus,
  KeyRound,
  Trash2,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  ArrowUpRight,
  Mail,
  X,
  Menu,
} from "lucide-react-native";
import {
  useGetAdminStatsQuery,
  useGetAdminUsersQuery,
  useCreateLecturerAccountMutation,
  useResetUserPasswordMutation,
  useAssignUserRoleMutation,
  useDeleteAdminUserMutation,
  useGetAdminSessionsQuery,
  useAssignLecturerToSessionMutation,
  useRemoveLecturerFromSessionMutation,
  useDeleteAdminSessionMutation,
  useGetAllCoursesQuery,
  useCreateCourseMutation,
  useCreateCourseSessionMutation,
} from "@/lib/api/facepassApi";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  logout,
  clearAuthSessionFromStorage,
} from "@/lib/features/user/userSlice";
import AppDrawer from "@/components/navigation/AppDrawer";
import KpiCard from "@/components/ui/KpiCard";
import ModalSheet from "@/components/ui/ModalSheet";

function generateClientPassword(len = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "Fp#";
  for (let i = 0; i < len - 3; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentUser, token, hydrated } = useAppSelector(
    (state) => state.user
  );

  // Admin Guard
  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.replace("/(auth)/login");
      return;
    }
    if (currentUser?.must_change_password) {
      router.replace("/(auth)/change-password");
      return;
    }
    if (currentUser && currentUser.role !== "admin") {
      router.replace("/(lecturer)");
    }
  }, [hydrated, token, currentUser, router]);

  const [activeTab, setActiveTab] = useState<"users" | "sessions">("users");
  const [roleFilter, setRoleFilter] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [sessionSearch, setSessionSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Queries
  const { data: statsData, refetch: refetchStats } = useGetAdminStatsQuery(
    undefined,
    { skip: !token }
  );
  const {
    data: usersData,
    isLoading: loadingUsers,
    refetch: refetchUsers,
  } = useGetAdminUsersQuery(roleFilter || undefined, { skip: !token });
  const {
    data: sessionsData,
    isLoading: loadingSessions,
    refetch: refetchSessions,
  } = useGetAdminSessionsQuery(undefined, { skip: !token });
  const {
    data: coursesData,
    isLoading: loadingCourses,
    refetch: refetchCourses,
  } = useGetAllCoursesQuery(undefined, { skip: !token });

  // Mutations
  const [createLecturer, { isLoading: creatingLecturer }] =
    useCreateLecturerAccountMutation();
  const [resetUserPassword, { isLoading: resettingPassword }] =
    useResetUserPasswordMutation();
  const [assignUserRole] = useAssignUserRoleMutation();
  const [deleteAdminUser] = useDeleteAdminUserMutation();
  const [assignLecturerToSession, { isLoading: assigningLecturer }] =
    useAssignLecturerToSessionMutation();
  const [removeLecturerFromSession] = useRemoveLecturerFromSessionMutation();
  const [deleteAdminSession] = useDeleteAdminSessionMutation();
  const [createCourse, { isLoading: creatingCourse }] =
    useCreateCourseMutation();
  const [createCourseSession, { isLoading: creatingSession }] =
    useCreateCourseSessionMutation();

  // Provision Lecturer Modal State
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [lecName, setLecName] = useState("");
  const [lecEmail, setLecEmail] = useState("");
  const [lecMatric, setLecMatric] = useState("");
  const [lecRole, setLecRole] = useState<"lecturer" | "admin">("lecturer");
  const [lecPassword, setLecPassword] = useState(() =>
    generateClientPassword(10)
  );
  const [forceChangeOnLogin, setForceChangeOnLogin] = useState(true);
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);

  // Credential Handover Card Modal
  const [credentialCard, setCredentialCard] = useState<any | null>(null);
  const [copiedField, setCopiedField] = useState("");

  // Assign Lecturer to Session Modal
  const [assignModalSession, setAssignModalSession] = useState<any | null>(
    null
  );
  const [selectedLecturerToAssign, setSelectedLecturerToAssign] = useState("");

  // Course & Session Modals
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseID, setCourseID] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseDesc, setCourseDesc] = useState("");

  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionCourseID, setSessionCourseID] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [sessionName, setSessionName] = useState("2025/2026");
  const [totalClasses, setTotalClasses] = useState("12");

  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showBanner = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  const allUsers: any[] = usersData?.users || [];
  const allSessions: any[] = sessionsData?.sessions || [];
  const allCourses: any[] = coursesData?.courses || [];

  const filteredCourses = useMemo(() => {
    const q = courseSearch.trim().toLowerCase();
    if (!q) return allCourses;
    return allCourses.filter(
      (c) =>
        (c.courseID || "").toLowerCase().includes(q) ||
        (c.courseName || "").toLowerCase().includes(q)
    );
  }, [allCourses, courseSearch]);

  const lecturersList = useMemo(
    () =>
      allUsers.filter((u) => u.role === "lecturer" || u.role === "admin"),
    [allUsers]
  );

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter(
      (u) =>
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.matric || "").toLowerCase().includes(q)
    );
  }, [allUsers, userSearch]);

  const filteredSessions = useMemo(() => {
    const q = sessionSearch.trim().toLowerCase();
    if (!q) return allSessions;
    return allSessions.filter(
      (s) =>
        (s.courseID || "").toLowerCase().includes(q) ||
        (s.course_name || "").toLowerCase().includes(q) ||
        (s.session_name || "").toLowerCase().includes(q)
    );
  }, [allSessions, sessionSearch]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await Clipboard.setStringAsync(text);
      setCopiedField(label);
      setTimeout(() => setCopiedField(""), 2000);
    } catch {
      // Ignore
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchStats(),
      refetchUsers(),
      refetchSessions(),
      refetchCourses(),
    ]);
    setRefreshing(false);
  };

  const handleProvisionSubmit = async () => {
    if (!lecName.trim() || !lecEmail.trim() || !lecPassword.trim()) {
      showBanner("error", "Please fill in Full Name, Email, and Password.");
      return;
    }
    try {
      const res = await createLecturer({
        name: lecName.trim(),
        email: lecEmail.trim(),
        matric: lecMatric.trim() || undefined,
        password: lecPassword.trim(),
        role: lecRole,
        must_change_password: forceChangeOnLogin,
        send_email: sendWelcomeEmail,
      }).unwrap();

      setShowProvisionModal(false);
      setCredentialCard({
        title: "Lecturer Account Provisioned",
        name: res.user?.name || lecName,
        email: res.user?.email || lecEmail,
        matric: res.user?.matric,
        role: res.user?.role || lecRole,
        temporary_password: res.temporary_password,
        email_sent: res.email_sent,
      });

      setLecName("");
      setLecEmail("");
      setLecMatric("");
      setLecPassword(generateClientPassword(10));
      showBanner(
        "success",
        `Provisioned ${res.user?.name} (${res.user?.email}).`
      );
    } catch (err: any) {
      showBanner(
        "error",
        err?.data?.error || "Failed to provision lecturer account."
      );
    }
  };

  const handleResetPassword = (u: any) => {
    Alert.alert(
      "Reset Temporary Password",
      `Generate a new temporary password for ${u.name} (${u.email})? They will be required to change it on their next login.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset Password",
          onPress: async () => {
            const newTempPassword = generateClientPassword(10);
            try {
              const res = await resetUserPassword({
                userId: u.id,
                password: newTempPassword,
                send_email: true,
              }).unwrap();

              setCredentialCard({
                title: "Temporary Password Reset",
                name: u.name,
                email: u.email,
                matric: u.matric,
                role: u.role,
                temporary_password: res.temporary_password,
                email_sent: res.email_sent,
              });
              showBanner("success", `Password reset for ${u.email}.`);
            } catch (err: any) {
              showBanner(
                "error",
                err?.data?.error || "Failed to reset password."
              );
            }
          },
        },
      ]
    );
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await assignUserRole({ user_id: userId, role: newRole }).unwrap();
      showBanner("success", `Updated user role to ${newRole.toUpperCase()}.`);
    } catch (err: any) {
      showBanner("error", err?.data?.error || "Failed to update role.");
    }
  };

  const handleDeleteUser = (u: any) => {
    Alert.alert(
      "Delete Account",
      `Permanently delete ${u.name} (${u.email})? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAdminUser(u.id).unwrap();
              showBanner("success", `Deleted user ${u.email}.`);
            } catch (err: any) {
              showBanner("error", err?.data?.error || "Failed to delete user.");
            }
          },
        },
      ]
    );
  };

  const handleAssignLecturerToSession = async () => {
    if (!assignModalSession || !selectedLecturerToAssign) return;
    try {
      const res = await assignLecturerToSession({
        sessionId: assignModalSession.id,
        lecturer_id: selectedLecturerToAssign,
      }).unwrap();
      showBanner("success", res.message || "Lecturer assigned to session.");
      setAssignModalSession(null);
      setSelectedLecturerToAssign("");
    } catch (err: any) {
      showBanner(
        "error",
        err?.data?.error || "Failed to assign lecturer to session."
      );
    }
  };

  const handleRemoveLecturerFromSession = async (
    sessionId: string,
    lecturerId: string,
    lecturerName: string
  ) => {
    try {
      await removeLecturerFromSession({ sessionId, lecturerId }).unwrap();
      showBanner("success", `Removed ${lecturerName} from session.`);
    } catch (err: any) {
      showBanner(
        "error",
        err?.data?.error || "Failed to remove lecturer from session."
      );
    }
  };

  const handleDeleteSession = (s: any) => {
    Alert.alert(
      "Delete Academic Session",
      `Delete session ${s.courseID} (${s.session_name}) and its attendance logs?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAdminSession(s.id).unwrap();
              showBanner(
                "success",
                `Deleted session ${s.courseID} (${s.session_name}).`
              );
            } catch (err: any) {
              showBanner(
                "error",
                err?.data?.error || "Failed to delete session."
              );
            }
          },
        },
      ]
    );
  };

  const handleCreateCourse = async () => {
    if (!courseID.trim() || !courseName.trim()) {
      showBanner("error", "Please enter both Course Code and Course Title.");
      return;
    }
    try {
      const res = await createCourse({
        courseID: courseID.trim().toUpperCase(),
        courseName: courseName.trim(),
        description: courseDesc.trim(),
      }).unwrap();
      setCourseID("");
      setCourseName("");
      setCourseDesc("");
      setShowCourseModal(false);
      setSessionCourseID(res.courseID);
      showBanner("success", `Registered course ${res.courseID}.`);
    } catch (err: any) {
      showBanner("error", err?.data?.error || "Failed to create course.");
    }
  };

  const handleCreateSession = async () => {
    if (!sessionCourseID) {
      showBanner("error", "Please select a course first.");
      return;
    }
    try {
      const res = await createCourseSession({
        courseID: sessionCourseID,
        session_name: sessionName.trim(),
        total_expected_classes: Number(totalClasses) || 12,
      }).unwrap();
      setShowSessionModal(false);
      showBanner(
        "success",
        `Provisioned session ${res.courseID} (${res.session_name}).`
      );
    } catch (err: any) {
      showBanner("error", err?.data?.error || "Failed to provision session.");
    }
  };

  const handleLogout = async () => {
    await clearAuthSessionFromStorage();
    dispatch(logout());
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA]">
      <AppDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={currentUser}
        role="admin"
        activeTab={activeTab}
        setActiveTab={(t) => setActiveTab(t as any)}
        onProvisionClick={() => {
          setLecPassword(generateClientPassword(10));
          setShowProvisionModal(true);
        }}
        onCreateCourseClick={() => setShowCourseModal(true)}
        onCreateSessionClick={() => {
          if (!sessionCourseID && allCourses.length > 0) {
            setSessionCourseID(allCourses[0].courseID);
          }
          setShowSessionModal(true);
        }}
        onLogout={handleLogout}
        badges={{
          usersCount: statsData?.total_users ?? allUsers.length,
          sessionsCount: statsData?.total_sessions ?? allSessions.length,
        }}
      />

      {/* Top Sticky Header */}
      <View className="px-4 py-3.5 bg-white border-b border-slate-200/80 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3 flex-1 pr-2">
          <TouchableOpacity
            onPress={() => setDrawerOpen(true)}
            className="p-2 rounded-xl border border-slate-200 bg-white"
          >
            <Menu size={18} color="#334155" />
          </TouchableOpacity>
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                ADMIN COMMAND CENTER
              </Text>
              <View className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                <Text className="text-[9px] font-bold text-emerald-700">
                  SUPER ADMIN
                </Text>
              </View>
            </View>
            <Text
              className="text-sm font-bold text-slate-900"
              numberOfLines={1}
            >
              {activeTab === "users"
                ? "Faculty & Access Governance"
                : "Courses & Sessions Governance"}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => {
              setLecPassword(generateClientPassword(10));
              setShowProvisionModal(true);
            }}
            className="flex-row items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500"
          >
            <UserPlus size={14} color="#FFFFFF" />
            <Text className="text-xs font-semibold text-white">
              Provision Lecturer
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#007BFF"
          />
        }
      >
        {/* Toast Banner */}
        {toast && (
          <View
            className={`mb-4 p-3.5 rounded-2xl border flex-row items-center justify-between ${
              toast.type === "error"
                ? "bg-rose-50 border-rose-200"
                : "bg-emerald-50 border-emerald-200"
            }`}
          >
            <View className="flex-row items-center gap-2 flex-1 pr-2">
              {toast.type === "error" ? (
                <AlertTriangle size={16} color="#E11D48" />
              ) : (
                <CheckCircle2 size={16} color="#059669" />
              )}
              <Text
                className={`text-xs font-medium flex-1 ${
                  toast.type === "error" ? "text-rose-800" : "text-emerald-800"
                }`}
              >
                {toast.text}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setToast(null)}>
              <X size={15} color="#64748B" />
            </TouchableOpacity>
          </View>
        )}

        {/* 4 KPI Cards */}
        <View className="flex-row flex-wrap gap-3 mb-5">
          <KpiCard
            label="Faculty & Admins"
            value={
              (statsData?.total_lecturers || 0) + (statsData?.total_admins || 0)
            }
            sublabel={`${statsData?.total_lecturers || 0} Lecturers • ${
              statsData?.total_admins || 0
            } Admins`}
          />
          <KpiCard
            label="Pending Resets"
            value={statsData?.pending_password_changes || 0}
            sublabel="Awaiting first-login password change"
            valueColorClass="text-amber-600"
          />
          <KpiCard
            label="Courses & Sessions"
            value={`${statsData?.total_courses || 0} / ${
              statsData?.total_sessions || 0
            }`}
            sublabel="Registered courses / Active sessions"
            valueColorClass="text-blue-600"
          />
          <KpiCard
            label="Students & Scans"
            value={`${statsData?.total_students || 0} / ${
              statsData?.total_attendance_logs || 0
            }`}
            sublabel="CoursePass roster / Rekognition logs"
            valueColorClass="text-emerald-600"
          />
        </View>

        {/* Primary Tab Switcher */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row gap-2 flex-1">
            <TouchableOpacity
              onPress={() => setActiveTab("users")}
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border ${
                activeTab === "users"
                  ? "bg-blue-500 border-blue-500"
                  : "bg-white border-slate-200"
              }`}
            >
              <Users
                size={14}
                color={activeTab === "users" ? "#FFFFFF" : "#64748B"}
              />
              <Text
                className={`text-xs font-semibold ${
                  activeTab === "users" ? "text-white" : "text-slate-600"
                }`}
              >
                Users ({allUsers.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("sessions")}
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border ${
                activeTab === "sessions"
                  ? "bg-blue-500 border-blue-500"
                  : "bg-white border-slate-200"
              }`}
            >
              <Calendar
                size={14}
                color={activeTab === "sessions" ? "#FFFFFF" : "#64748B"}
              />
              <Text
                className={`text-xs font-semibold ${
                  activeTab === "sessions" ? "text-white" : "text-slate-600"
                }`}
              >
                Sessions ({allSessions.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            TAB 1: LECTURERS & USERS MANAGEMENT
           ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "users" && (
          <View className="pb-12">
            {/* Filter & Search Bar */}
            <View className="bg-white p-4 rounded-2xl border border-slate-200/90 mb-4 space-y-3">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row items-center gap-2 mb-2.5">
                  {[
                    { key: "", label: "All Roles" },
                    { key: "lecturer", label: "Lecturers" },
                    { key: "admin", label: "Admins" },
                    { key: "student", label: "Students (CoursePass)" },
                  ].map((r) => (
                    <TouchableOpacity
                      key={r.key}
                      onPress={() => setRoleFilter(r.key)}
                      className={`px-3 py-1.5 rounded-lg border ${
                        roleFilter === r.key
                          ? "bg-obsidian-950 border-obsidian-950"
                          : "bg-slate-100 border-slate-200"
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          roleFilter === r.key ? "text-white" : "text-slate-600"
                        }`}
                      >
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View className="relative justify-center">
                <View className="absolute left-3.5 z-10">
                  <Search size={15} color="#94A3B8" />
                </View>
                <TextInput
                  value={userSearch}
                  onChangeText={setUserSearch}
                  placeholder="Search name, email, or staff ID..."
                  placeholderTextColor="#94A3B8"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </View>
            </View>

            {/* Users List */}
            {loadingUsers ? (
              <View className="p-12 bg-white rounded-2xl border border-slate-200 items-center">
                <ActivityIndicator size="small" color="#007BFF" />
                <Text className="text-xs text-slate-400 mt-2">
                  LOADING ACCOUNTS...
                </Text>
              </View>
            ) : filteredUsers.length === 0 ? (
              <View className="p-10 bg-white rounded-2xl border border-slate-200 items-center">
                <Text className="text-xs text-slate-500">
                  No users matching filter criteria.
                </Text>
              </View>
            ) : (
              <View className="space-y-3">
                {filteredUsers.map((u) => (
                  <View
                    key={u.id}
                    className="bg-white rounded-2xl border border-slate-200/90 p-4 mb-3"
                  >
                    <View className="flex-row items-start justify-between gap-2">
                      <View className="flex-1">
                        <Text className="text-sm font-bold text-slate-900">
                          {u.name}
                        </Text>
                        <Text className="text-xs text-slate-500 mt-0.5">
                          {u.email}
                        </Text>
                        <Text className="text-[11px] text-slate-400 mt-0.5">
                          ID: {u.matric || "—"}
                        </Text>
                      </View>

                      {u.must_change_password ? (
                        <View className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200">
                          <Text className="text-[10px] font-bold text-amber-700">
                            TEMP PWD
                          </Text>
                        </View>
                      ) : (
                        <View className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                          <Text className="text-[10px] font-bold text-emerald-700">
                            ACTIVE
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Role Assignment Pills */}
                    <View className="mt-3 pt-3 border-t border-slate-100 flex-row items-center justify-between flex-wrap gap-2">
                      <View className="flex-row items-center gap-1.5">
                        {(["lecturer", "admin", "student"] as const).map(
                          (r) => {
                            const selected = u.role === r;
                            return (
                              <TouchableOpacity
                                key={r}
                                onPress={() => handleRoleChange(u.id, r)}
                                className={`px-2.5 py-1 rounded-lg border ${
                                  selected
                                    ? r === "admin"
                                      ? "bg-obsidian-950 border-obsidian-950"
                                      : r === "lecturer"
                                      ? "bg-blue-500 border-blue-500"
                                      : "bg-slate-700 border-slate-700"
                                    : "bg-slate-50 border-slate-200"
                                }`}
                              >
                                <Text
                                  className={`text-[10px] font-bold uppercase ${
                                    selected ? "text-white" : "text-slate-600"
                                  }`}
                                >
                                  {r}
                                </Text>
                              </TouchableOpacity>
                            );
                          }
                        )}
                      </View>

                      <View className="flex-row items-center gap-2">
                        <TouchableOpacity
                          onPress={() => handleResetPassword(u)}
                          disabled={resettingPassword}
                          className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50"
                        >
                          <KeyRound size={12} color="#334155" />
                          <Text className="text-[11px] font-semibold text-slate-700">
                            Reset Pwd
                          </Text>
                        </TouchableOpacity>

                        {u.id !== currentUser?.id && (
                          <TouchableOpacity
                            onPress={() => handleDeleteUser(u)}
                            className="p-1.5 rounded-lg border border-rose-200 bg-rose-50"
                          >
                            <Trash2 size={13} color="#E11D48" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 2: COURSES & ACADEMIC SESSIONS GOVERNANCE
           ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "sessions" && (
          <View className="pb-12 space-y-5">
            {/* Quick Course & Session Creation Row */}
            <View className="flex-row gap-2.5 mb-3">
              <TouchableOpacity
                onPress={() => setShowCourseModal(true)}
                className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white border border-slate-200"
              >
                <BookOpen size={14} color="#334155" />
                <Text className="text-xs font-semibold text-slate-700">
                  + Register Course
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  if (!sessionCourseID && allCourses.length > 0) {
                    setSessionCourseID(allCourses[0].courseID);
                  }
                  setShowSessionModal(true);
                }}
                className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl bg-obsidian-950"
              >
                <Plus size={14} color="#FFFFFF" />
                <Text className="text-xs font-semibold text-white">
                  Provision Session
                </Text>
              </TouchableOpacity>
            </View>

            {/* Search Sessions */}
            <View className="bg-white p-4 rounded-2xl border border-slate-200/90 mb-4">
              <Text className="text-sm font-bold text-slate-900">
                University-Wide Academic Sessions ({filteredSessions.length})
              </Text>
              <Text className="text-xs text-slate-500 mt-0.5 mb-3">
                Assign or remove lecturers on any session, or open its live
                Biometric Control Room.
              </Text>
              <View className="relative justify-center">
                <View className="absolute left-3.5 z-10">
                  <Search size={15} color="#94A3B8" />
                </View>
                <TextInput
                  value={sessionSearch}
                  onChangeText={setSessionSearch}
                  placeholder="Filter sessions by course code..."
                  placeholderTextColor="#94A3B8"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </View>
            </View>

            {loadingSessions ? (
              <View className="p-10 bg-white rounded-2xl border border-slate-200 items-center">
                <ActivityIndicator size="small" color="#007BFF" />
                <Text className="text-xs text-slate-400 mt-2">
                  LOADING SESSIONS...
                </Text>
              </View>
            ) : filteredSessions.length === 0 ? (
              <View className="p-10 bg-white rounded-2xl border border-slate-200 items-center">
                <Calendar size={32} color="#CBD5E1" />
                <Text className="text-sm font-bold text-slate-800 mt-2 mb-1">
                  No Academic Sessions Found
                </Text>
                <Text className="text-xs text-slate-500">
                  Register a course and provision a session to begin.
                </Text>
              </View>
            ) : (
              <View className="space-y-3">
                {filteredSessions.map((s) => (
                  <View
                    key={s.id}
                    className="bg-white rounded-2xl border border-slate-200/90 p-4 mb-3"
                  >
                    <View className="flex-row items-center justify-between mb-1.5">
                      <View className="flex-row items-center gap-2">
                        <View className="px-2 py-0.5 rounded bg-blue-500">
                          <Text className="text-white text-xs font-bold">
                            {s.courseID}
                          </Text>
                        </View>
                        <View className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          <Text className="text-[11px] font-semibold text-slate-700">
                            {s.session_name}
                          </Text>
                        </View>
                        <Text className="text-[11px] text-slate-400">
                          {s.total_expected_classes} lectures
                        </Text>
                      </View>
                    </View>

                    <Text className="text-sm font-bold text-slate-900 mb-2">
                      {s.course_name}
                    </Text>

                    {/* Assigned Faculty Pills */}
                    <View className="flex-row flex-wrap items-center gap-1.5 mb-3">
                      {s.lecturers && s.lecturers.length > 0 ? (
                        s.lecturers.map((lec: any) => (
                          <View
                            key={lec.id}
                            className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200"
                          >
                            <Text className="text-xs font-medium text-slate-800">
                              {lec.name}
                            </Text>
                            <TouchableOpacity
                              onPress={() =>
                                handleRemoveLecturerFromSession(
                                  s.id,
                                  lec.id,
                                  lec.name
                                )
                              }
                            >
                              <X size={12} color="#94A3B8" />
                            </TouchableOpacity>
                          </View>
                        ))
                      ) : (
                        <Text className="text-[11px] font-semibold text-amber-600">
                          UNASSIGNED
                        </Text>
                      )}

                      <TouchableOpacity
                        onPress={() => {
                          setAssignModalSession(s);
                          setSelectedLecturerToAssign("");
                        }}
                        className="flex-row items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-blue-300 bg-blue-50/40"
                      >
                        <Plus size={12} color="#0069D9" />
                        <Text className="text-[11px] font-semibold text-blue-600">
                          Assign Lecturer
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View className="pt-3 border-t border-slate-100 flex-row items-center justify-between">
                      <View>
                        <Text className="text-xs font-bold text-slate-900">
                          {s.enrolled_students || 0} Students
                        </Text>
                        <Text className="text-[11px] text-slate-500">
                          {s.attendance_logs_count || 0} Attendance Scans
                        </Text>
                      </View>

                      <View className="flex-row items-center gap-2">
                        <TouchableOpacity
                          onPress={() => router.push(`/(lecturer)/${s.id}`)}
                          className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg bg-obsidian-950"
                        >
                          <Text className="text-xs font-semibold text-white">
                            Control Room
                          </Text>
                          <ArrowUpRight size={13} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteSession(s)}
                          className="p-2 rounded-lg border border-rose-200 bg-rose-50"
                        >
                          <Trash2 size={14} color="#E11D48" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* CoursePass Central Hub Catalog */}
            <View className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden mt-4">
              <View className="p-4 bg-slate-50 border-b border-slate-200/80">
                <View className="flex-row items-center gap-2 mb-2">
                  <Text className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    COURSEPASS CENTRAL HUB CATALOG ({allCourses.length})
                  </Text>
                  <View className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                    <Text className="text-[10px] font-bold text-blue-600">
                      SYNCED
                    </Text>
                  </View>
                </View>
                <View className="relative justify-center">
                  <View className="absolute left-3 z-10">
                    <Search size={14} color="#94A3B8" />
                  </View>
                  <TextInput
                    value={courseSearch}
                    onChangeText={setCourseSearch}
                    placeholder="Search CoursePass catalog..."
                    placeholderTextColor="#94A3B8"
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </View>
              </View>

              {loadingCourses ? (
                <View className="p-6 items-center">
                  <Text className="text-xs text-slate-400">
                    LOADING COURSEPASS CATALOG...
                  </Text>
                </View>
              ) : filteredCourses.length === 0 ? (
                <View className="p-6 items-center">
                  <Text className="text-xs text-slate-500">
                    No courses matching search query.
                  </Text>
                </View>
              ) : (
                filteredCourses.slice(0, 40).map((c) => (
                  <View
                    key={c.courseID || c.id}
                    className="px-4 py-3 border-b border-slate-100 flex-row items-center justify-between"
                  >
                    <View className="flex-1 pr-2">
                      <Text className="text-xs font-bold text-slate-900">
                        {c.courseID}
                      </Text>
                      <Text
                        className="text-xs text-slate-600"
                        numberOfLines={1}
                      >
                        {c.courseName}
                      </Text>
                    </View>
                    <View className="px-2 py-0.5 rounded bg-slate-100">
                      <Text className="text-[10px] text-slate-600 font-medium">
                        {c.session_count || 0} Sessions
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 1: PROVISION LECTURER / ADMIN ACCOUNT
         ══════════════════════════════════════════════════════════════════ */}
      <ModalSheet
        visible={showProvisionModal}
        badge="ADMINISTRATION // ACCOUNT PROVISIONING"
        title="Provision Lecturer or Admin Account"
        subtitle="Create a verified institutional account with a temporary password and force password rotation on first login."
        onClose={() => setShowProvisionModal(false)}
      >
        <View className="space-y-4">
          <View className="mb-3">
            <Text className="text-xs font-semibold text-slate-700 mb-1 uppercase">
              Full Name
            </Text>
            <TextInput
              value={lecName}
              onChangeText={setLecName}
              placeholder="e.g. Dr. Adaeze Okafor"
              placeholderTextColor="#94A3B8"
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3.5 py-2.5 text-sm text-slate-900"
            />
          </View>

          <View className="mb-3">
            <Text className="text-xs font-semibold text-slate-700 mb-1 uppercase">
              Institutional Email
            </Text>
            <TextInput
              value={lecEmail}
              onChangeText={setLecEmail}
              placeholder="lecturer@university.edu"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3.5 py-2.5 text-sm text-slate-900"
            />
          </View>

          <View className="flex-row gap-3 mb-3">
            <View className="flex-1">
              <Text className="text-xs font-semibold text-slate-700 mb-1 uppercase">
                Staff ID (Optional)
              </Text>
              <TextInput
                value={lecMatric}
                onChangeText={setLecMatric}
                placeholder="Auto (e.g. LEC-4821)"
                placeholderTextColor="#94A3B8"
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3.5 py-2.5 text-sm text-slate-900"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-slate-700 mb-1 uppercase">
                Platform Role
              </Text>
              <View className="flex-row gap-1.5">
                {(["lecturer", "admin"] as const).map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setLecRole(r)}
                    className={`flex-1 py-2.5 rounded-xl border items-center ${
                      lecRole === r
                        ? "bg-blue-500 border-blue-500"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold uppercase ${
                        lecRole === r ? "text-white" : "text-slate-700"
                      }`}
                    >
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Temporary Password Field with Generator */}
          <View className="mb-3">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-xs font-semibold text-slate-700 uppercase">
                Temporary Password
              </Text>
              <TouchableOpacity
                onPress={() => setLecPassword(generateClientPassword(10))}
                className="flex-row items-center gap-1"
              >
                <RefreshCw size={12} color="#0069D9" />
                <Text className="text-xs font-semibold text-blue-600">
                  Auto-Generate
                </Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center gap-2">
              <TextInput
                value={lecPassword}
                onChangeText={setLecPassword}
                className="flex-1 border border-slate-200 bg-slate-50 rounded-xl px-3.5 py-2.5 text-sm text-slate-900"
              />
              <TouchableOpacity
                onPress={() =>
                  copyToClipboard(lecPassword, "Temporary password")
                }
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white flex-row items-center gap-1.5"
              >
                <Copy size={14} color="#334155" />
                <Text className="text-xs font-semibold text-slate-700">
                  Copy
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Security Toggles */}
          <View className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 mb-4 space-y-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-xs font-semibold text-slate-900">
                  Force password change on first login
                </Text>
                <Text className="text-[11px] text-slate-500">
                  Redirects lecturer to /change-password on initial sign-in.
                </Text>
              </View>
              <Switch
                value={forceChangeOnLogin}
                onValueChange={setForceChangeOnLogin}
              />
            </View>

            <View className="flex-row items-center justify-between pt-2 border-t border-slate-200/60">
              <View className="flex-1 pr-3">
                <Text className="text-xs font-semibold text-slate-900">
                  Send welcome email via SMTP
                </Text>
                <Text className="text-[11px] text-slate-500">
                  Also displays a copyable credential card on screen.
                </Text>
              </View>
              <Switch
                value={sendWelcomeEmail}
                onValueChange={setSendWelcomeEmail}
              />
            </View>
          </View>

          <View className="flex-row justify-end gap-2">
            <TouchableOpacity
              onPress={() => setShowProvisionModal(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200"
            >
              <Text className="text-xs font-semibold text-slate-600">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleProvisionSubmit}
              disabled={creatingLecturer}
              className="px-5 py-2.5 rounded-xl bg-blue-500"
            >
              <Text className="text-xs font-semibold text-white">
                {creatingLecturer
                  ? "Provisioning..."
                  : "Create & View Credentials"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ModalSheet>

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 2: CREDENTIAL HANDOVER CARD
         ══════════════════════════════════════════════════════════════════ */}
      <ModalSheet
        visible={!!credentialCard}
        badge="SECURITY HANDOVER // TEMPORARY CREDENTIALS"
        title={credentialCard?.title || "Credentials"}
        subtitle="Share these credentials with the faculty member. They will be prompted to set a personal password upon first sign-in."
        onClose={() => setCredentialCard(null)}
      >
        {credentialCard && (
          <View className="space-y-4">
            <View className="p-4 rounded-2xl bg-obsidian-950 border border-slate-800 space-y-3">
              <View className="flex-row items-center justify-between border-b border-slate-800 pb-2.5 mb-2">
                <View>
                  <Text className="text-xs font-bold text-white">
                    {credentialCard.name}
                  </Text>
                  <Text className="text-[11px] text-slate-400">
                    {credentialCard.role?.toUpperCase()} •{" "}
                    {credentialCard.matric || "STAFF"}
                  </Text>
                </View>
                <View className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40">
                  <Text className="text-amber-300 text-[10px] font-bold">
                    MUST CHANGE ON LOGIN
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between bg-slate-900 px-3 py-2.5 rounded-xl border border-slate-800 mb-2">
                <View className="flex-1 pr-2">
                  <Text className="text-[10px] text-slate-400">
                    LOGIN EMAIL
                  </Text>
                  <Text className="text-xs text-slate-100 font-semibold">
                    {credentialCard.email}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    copyToClipboard(credentialCard.email, "Email")
                  }
                  className="p-1.5 rounded-lg bg-slate-800"
                >
                  {copiedField === "Email" ? (
                    <Check size={14} color="#34D399" />
                  ) : (
                    <Copy size={14} color="#CBD5E1" />
                  )}
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center justify-between bg-slate-900 px-3 py-2.5 rounded-xl border border-slate-800">
                <View className="flex-1 pr-2">
                  <Text className="text-[10px] text-slate-400">
                    TEMPORARY PASSWORD
                  </Text>
                  <Text className="text-sm text-emerald-400 font-bold">
                    {credentialCard.temporary_password}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    copyToClipboard(
                      credentialCard.temporary_password,
                      "Temporary Password"
                    )
                  }
                  className="p-1.5 rounded-lg bg-slate-800"
                >
                  {copiedField === "Temporary Password" ? (
                    <Check size={14} color="#34D399" />
                  ) : (
                    <Copy size={14} color="#CBD5E1" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View className="flex-row items-center gap-1.5 px-1 my-2">
              <Mail size={14} color="#94A3B8" />
              <Text className="text-xs text-slate-500">
                {credentialCard.email_sent
                  ? "Welcome email dispatched via SMTP."
                  : "Copy credentials below to share directly with lecturer."}
              </Text>
            </View>

            <View className="flex-row justify-end gap-2 pt-2">
              <TouchableOpacity
                onPress={() => {
                  const summary = `FacePass Institutional Credentials\nName: ${credentialCard.name}\nLogin Email: ${credentialCard.email}\nTemporary Password: ${credentialCard.temporary_password}\nNote: You will be prompted to set a new personal password on your first login.`;
                  copyToClipboard(summary, "Full Summary");
                }}
                className="flex-row items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-500"
              >
                <Copy size={14} color="#FFFFFF" />
                <Text className="text-xs font-semibold text-white">
                  {copiedField === "Full Summary"
                    ? "Copied Summary!"
                    : "Copy Full Summary"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setCredentialCard(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200"
              >
                <Text className="text-xs font-semibold text-slate-700">
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ModalSheet>

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 3: ASSIGN LECTURER TO SESSION
         ══════════════════════════════════════════════════════════════════ */}
      <ModalSheet
        visible={!!assignModalSession}
        badge="SESSION GOVERNANCE // FACULTY ASSIGNMENT"
        title={`Assign Lecturer to ${assignModalSession?.courseID || ""}`}
        subtitle={`Session ${assignModalSession?.session_name || ""} — ${
          assignModalSession?.course_name || ""
        }`}
        onClose={() => setAssignModalSession(null)}
      >
        <View className="space-y-4">
          <Text className="text-xs font-semibold text-slate-700 uppercase mb-2">
            Select Institutional Lecturer ({lecturersList.length} available)
          </Text>
          <ScrollView className="max-h-52 border border-slate-200 rounded-xl bg-slate-50 p-1.5 mb-4">
            {lecturersList.map((lec) => {
              const selected = selectedLecturerToAssign === lec.id;
              return (
                <TouchableOpacity
                  key={lec.id}
                  onPress={() => setSelectedLecturerToAssign(lec.id)}
                  className={`p-3 rounded-lg mb-1 flex-row items-center justify-between ${
                    selected ? "bg-blue-500" : "bg-white"
                  }`}
                >
                  <View className="flex-1 pr-2">
                    <Text
                      className={`text-xs font-bold ${
                        selected ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {lec.name}
                    </Text>
                    <Text
                      className={`text-[11px] ${
                        selected ? "text-blue-100" : "text-slate-500"
                      }`}
                    >
                      {lec.email} • {lec.role?.toUpperCase()}
                    </Text>
                  </View>
                  {selected && <CheckCircle2 size={15} color="#FFFFFF" />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View className="flex-row justify-end gap-2">
            <TouchableOpacity
              onPress={() => setAssignModalSession(null)}
              className="px-4 py-2.5 rounded-xl border border-slate-200"
            >
              <Text className="text-xs font-semibold text-slate-600">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAssignLecturerToSession}
              disabled={assigningLecturer || !selectedLecturerToAssign}
              className={`px-5 py-2.5 rounded-xl ${
                assigningLecturer || !selectedLecturerToAssign
                  ? "bg-slate-300"
                  : "bg-blue-500"
              }`}
            >
              <Text className="text-xs font-semibold text-white">
                {assigningLecturer ? "Assigning..." : "Assign to Session"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ModalSheet>

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 4: REGISTER COURSE
         ══════════════════════════════════════════════════════════════════ */}
      <ModalSheet
        visible={showCourseModal}
        badge="CATALOG // NEW COURSE"
        title="Register Academic Course"
        subtitle="Add a course code to the catalog before provisioning an academic session."
        onClose={() => setShowCourseModal(false)}
      >
        <View className="space-y-4">
          <View className="mb-3">
            <Text className="text-xs font-semibold text-slate-700 mb-1.5 uppercase">
              Course Code
            </Text>
            <TextInput
              value={courseID}
              onChangeText={setCourseID}
              placeholder="e.g. CSC401"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm text-slate-900"
            />
          </View>

          <View className="mb-3">
            <Text className="text-xs font-semibold text-slate-700 mb-1.5 uppercase">
              Course Title
            </Text>
            <TextInput
              value={courseName}
              onChangeText={setCourseName}
              placeholder="e.g. Computer Vision & Biometrics"
              placeholderTextColor="#94A3B8"
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm text-slate-900"
            />
          </View>

          <View className="mb-4">
            <Text className="text-xs font-semibold text-slate-700 mb-1.5 uppercase">
              Description (Optional)
            </Text>
            <TextInput
              value={courseDesc}
              onChangeText={setCourseDesc}
              multiline
              numberOfLines={2}
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm text-slate-900"
            />
          </View>

          <View className="flex-row justify-end gap-2">
            <TouchableOpacity
              onPress={() => setShowCourseModal(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200"
            >
              <Text className="text-xs font-semibold text-slate-600">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCreateCourse}
              disabled={creatingCourse}
              className="px-5 py-2.5 rounded-xl bg-blue-500"
            >
              <Text className="text-xs font-semibold text-white">
                {creatingCourse ? "Registering..." : "Register Course"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ModalSheet>

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 5: PROVISION SESSION
         ══════════════════════════════════════════════════════════════════ */}
      <ModalSheet
        visible={showSessionModal}
        badge="PROVISIONING // ACADEMIC SESSION"
        title="Provision Course Session"
        subtitle="Create a new academic session and isolated per-course Computer Vision collection."
        onClose={() => setShowSessionModal(false)}
      >
        <View className="space-y-4">
          <View className="mb-3">
            <Text className="text-xs font-semibold text-slate-700 mb-1.5 uppercase">
              Select Course (CoursePass Central Hub)
            </Text>
            <ScrollView className="max-h-40 border border-slate-200 rounded-xl bg-slate-50 p-1.5">
              {filteredCourses.map((c) => {
                const selected = sessionCourseID === c.courseID;
                return (
                  <TouchableOpacity
                    key={c.courseID}
                    onPress={() => setSessionCourseID(c.courseID)}
                    className={`px-3 py-2 rounded-lg mb-1 flex-row items-center justify-between ${
                      selected ? "bg-blue-500" : "bg-white"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold flex-1 ${
                        selected ? "text-white" : "text-slate-800"
                      }`}
                      numberOfLines={1}
                    >
                      {c.courseID} — {c.courseName}
                    </Text>
                    {selected && <CheckCircle2 size={14} color="#FFFFFF" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                Academic Session
              </Text>
              <TextInput
                value={sessionName}
                onChangeText={setSessionName}
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3.5 py-2.5 text-sm text-slate-900"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                Expected Lectures
              </Text>
              <TextInput
                value={totalClasses}
                onChangeText={setTotalClasses}
                keyboardType="numeric"
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3.5 py-2.5 text-sm text-slate-900"
              />
            </View>
          </View>

          <View className="flex-row justify-end gap-2">
            <TouchableOpacity
              onPress={() => setShowSessionModal(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200"
            >
              <Text className="text-xs font-semibold text-slate-600">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCreateSession}
              disabled={creatingSession || allCourses.length === 0}
              className="px-5 py-2.5 rounded-xl bg-blue-500"
            >
              <Text className="text-xs font-semibold text-white">
                {creatingSession ? "Provisioning..." : "Provision Session"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ModalSheet>
    </SafeAreaView>
  );
}
