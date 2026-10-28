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
} from "react-native";
import { useRouter } from "expo-router";
import {
  Plus,
  BookOpen,
  Calendar,
  ArrowUpRight,
  Layers,
  Search,
  AlertCircle,
  CheckCircle2,
  Menu,
} from "lucide-react-native";
import {
  useGetAllCoursesQuery,
  useCreateCourseMutation,
  useGetLecturerSessionsQuery,
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

export default function LecturerDashboardScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentUser, token, hydrated } = useAppSelector(
    (state) => state.user
  );

  // Auth Guard
  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.replace("/(auth)/login");
      return;
    }
    if (currentUser?.must_change_password) {
      router.replace("/(auth)/change-password");
    }
  }, [hydrated, token, currentUser, router]);

  const {
    data: coursesData,
    isLoading: loadingCourses,
    refetch: refetchCourses,
  } = useGetAllCoursesQuery(undefined, { skip: !token });
  const {
    data: sessionsData,
    isLoading: loadingSessions,
    refetch: refetchSessions,
  } = useGetLecturerSessionsQuery(undefined, { skip: !token });

  const [createCourse, { isLoading: creatingCourse }] =
    useCreateCourseMutation();
  const [createCourseSession, { isLoading: creatingSession }] =
    useCreateCourseSessionMutation();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Course Modal State
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseID, setCourseID] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseDesc, setCourseDesc] = useState("");

  // Session Modal State
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionCourseID, setSessionCourseID] = useState("");
  const [courseDropdownSearch, setCourseDropdownSearch] = useState("");
  const [sessionName, setSessionName] = useState("2025/2026");
  const [totalClasses, setTotalClasses] = useState("12");

  const courses: any[] = coursesData?.courses || [];
  const sessions: any[] = sessionsData?.sessions || [];

  const filteredModalCourses = useMemo(() => {
    const q = courseDropdownSearch.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) =>
        (c.courseID || "").toLowerCase().includes(q) ||
        (c.courseName || "").toLowerCase().includes(q)
    );
  }, [courses, courseDropdownSearch]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchesCourse =
        selectedCourseFilter === "ALL" || s.courseID === selectedCourseFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (s.courseID || "").toLowerCase().includes(q) ||
        (s.course_name || "").toLowerCase().includes(q) ||
        (s.session_name || "").toLowerCase().includes(q);
      return matchesCourse && matchesSearch;
    });
  }, [sessions, selectedCourseFilter, searchQuery]);

  const totalEnrolledAcrossSessions = useMemo(() => {
    return sessions.reduce(
      (acc, s) => acc + (Number(s.enrolled_students) || 0),
      0
    );
  }, [sessions]);

  const uniqueActiveCoursesCount = useMemo(() => {
    return new Set(sessions.map((s) => s.courseID)).size;
  }, [sessions]);

  const showBanner = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchCourses(), refetchSessions()]);
    setRefreshing(false);
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
      showBanner(
        "success",
        `Course ${res.courseID} (${res.courseName}) registered.`
      );
    } catch (err: any) {
      showBanner("error", err?.data?.error || "Failed to register course.");
    }
  };

  const handleCreateSession = async () => {
    if (!sessionCourseID) {
      showBanner("error", "Please select a course from the CoursePass catalog.");
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
        `Session ${res.courseID} (${res.session_name}) provisioned with Rekognition scope.`
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
        role="lecturer"
        onCreateCourseClick={() => setShowCourseModal(true)}
        onCreateSessionClick={() => {
          if (!sessionCourseID && courses.length > 0) {
            setSessionCourseID(courses[0].courseID);
          }
          setShowSessionModal(true);
        }}
        onLogout={handleLogout}
      />

      {/* Top Header */}
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
                LECTURER CONSOLE
              </Text>
              <View className="flex-row items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <Text className="text-[9px] font-bold text-emerald-700">
                  CV READY
                </Text>
              </View>
            </View>
            <Text
              className="text-sm font-bold text-slate-900"
              numberOfLines={1}
            >
              Courses, Sessions &amp; Rosters
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => setShowCourseModal(true)}
            className="flex-row items-center gap-1 px-3 py-2 rounded-xl bg-white border border-slate-200"
          >
            <BookOpen size={14} color="#334155" />
            <Text className="text-xs font-semibold text-slate-700">
              + Course
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (!sessionCourseID && courses.length > 0) {
                setSessionCourseID(courses[0].courseID);
              }
              setShowSessionModal(true);
            }}
            className="flex-row items-center gap-1 px-3.5 py-2 rounded-xl bg-blue-500"
          >
            <Plus size={14} color="#FFFFFF" />
            <Text className="text-xs font-semibold text-white">Session</Text>
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
        {/* Toast Feedback */}
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
                <AlertCircle size={16} color="#E11D48" />
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
              <Text className="text-xs font-bold text-slate-500">✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Executive KPI Grid (2x2) */}
        <View className="flex-row flex-wrap gap-3 mb-5">
          <KpiCard
            label="Active Sessions"
            value={sessions.length}
            sublabel="Assigned to your account"
          />
          <KpiCard
            label="CoursePass Catalog"
            value={courses.length}
            sublabel="Synced university courses"
          />
          <KpiCard
            label="Enrolled Students"
            value={totalEnrolledAcrossSessions}
            sublabel="Across active sessions"
          />
          <KpiCard
            label="CV Face Collections"
            value={uniqueActiveCoursesCount}
            sublabel="Isolated per-course scopes"
            variant="obsidian"
          />
        </View>

        {/* Course Registry Filter Pills & Search */}
        <View className="bg-white rounded-2xl border border-slate-200/90 p-4 mb-5">
          <View className="mb-3">
            <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Filter by Course Code
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={() => setSelectedCourseFilter("ALL")}
                  className={`px-3 py-1.5 rounded-lg border ${
                    selectedCourseFilter === "ALL"
                      ? "bg-blue-500 border-blue-500"
                      : "bg-slate-100 border-slate-200"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      selectedCourseFilter === "ALL"
                        ? "text-white"
                        : "text-slate-600"
                    }`}
                  >
                    ALL SESSIONS ({sessions.length})
                  </Text>
                </TouchableOpacity>

                {Array.from(new Set(sessions.map((s) => s.courseID))).map(
                  (cid: any) => (
                    <TouchableOpacity
                      key={cid}
                      onPress={() => setSelectedCourseFilter(cid)}
                      className={`px-3 py-1.5 rounded-lg border ${
                        selectedCourseFilter === cid
                          ? "bg-blue-500 border-blue-500"
                          : "bg-slate-50 border-slate-200/90"
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          selectedCourseFilter === cid
                            ? "text-white"
                            : "text-slate-700"
                        }`}
                      >
                        {cid}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </ScrollView>
          </View>

          <View className="relative justify-center">
            <View className="absolute left-3.5 z-10">
              <Search size={15} color="#94A3B8" />
            </View>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search sessions by code or title..."
              placeholderTextColor="#94A3B8"
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
            />
          </View>
        </View>

        {/* Provisioned Course Sessions Header */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <Calendar size={16} color="#007BFF" />
            <Text className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Course Sessions ({filteredSessions.length})
            </Text>
          </View>
          <Text className="text-[11px] text-slate-500">
            Tap a session to open Control Room
          </Text>
        </View>

        {/* Session Cards List */}
        {loadingSessions || loadingCourses ? (
          <View className="py-12 bg-white rounded-2xl border border-slate-200 items-center mb-10">
            <ActivityIndicator size="small" color="#007BFF" />
            <Text className="text-xs text-slate-400 mt-2 font-semibold">
              SYNCHRONIZING LECTURER SESSIONS...
            </Text>
          </View>
        ) : filteredSessions.length === 0 ? (
          <View className="bg-white rounded-2xl border border-slate-200/90 p-8 items-center mb-10">
            <View className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 items-center justify-center mb-3">
              <Layers size={22} color="#007BFF" />
            </View>
            <Text className="text-base font-bold text-slate-900 mb-1">
              {sessions.length === 0
                ? "No Course Sessions Provisioned Yet"
                : "No Matching Sessions Found"}
            </Text>
            <Text className="text-xs text-slate-500 text-center mb-5 leading-relaxed">
              {sessions.length === 0
                ? "Create your first academic session from the CoursePass catalog to initialize an isolated Computer Vision face collection."
                : "Try clearing your search query or course filter above."}
            </Text>
            <View className="flex-row items-center gap-2.5">
              {courses.length === 0 && (
                <TouchableOpacity
                  onPress={() => setShowCourseModal(true)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <Text className="text-xs font-semibold text-slate-700">
                    1. Register Course
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => {
                  if (!sessionCourseID && courses.length > 0) {
                    setSessionCourseID(courses[0].courseID);
                  }
                  setShowSessionModal(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-500"
              >
                <Text className="text-xs font-semibold text-white">
                  Provision Course Session
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="space-y-3 pb-10">
            {filteredSessions.map((s) => {
              const required75 = Math.ceil(
                (Number(s.total_expected_classes) || 12) * 0.75
              );
              return (
                <TouchableOpacity
                  key={s.id}
                  activeOpacity={0.85}
                  onPress={() => router.push(`/(lecturer)/${s.id}`)}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 mb-3 shadow-xs"
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-2">
                      <View className="px-2.5 py-1 rounded-lg bg-blue-500">
                        <Text className="text-white text-xs font-bold">
                          {s.courseID}
                        </Text>
                      </View>
                      <View className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80">
                        <Text className="text-xs font-semibold text-slate-700">
                          {s.session_name}
                        </Text>
                      </View>
                    </View>
                    <View className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/80 items-center justify-center">
                      <ArrowUpRight size={16} color="#64748B" />
                    </View>
                  </View>

                  <Text
                    className="text-base font-bold text-slate-900 mb-1"
                    numberOfLines={1}
                  >
                    {s.course_name}
                  </Text>
                  <Text
                    className="text-[11px] text-slate-400 mb-4"
                    numberOfLines={1}
                  >
                    COURSE CODE: {s.courseID}
                  </Text>

                  <View className="pt-3.5 border-t border-slate-100 flex-row items-center justify-between">
                    <View>
                      <Text className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                        Enrolled Roster
                      </Text>
                      <Text className="text-sm font-bold text-slate-900 mt-0.5">
                        {s.enrolled_students || 0} Students
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                        {">= 75% Attendance"}
                      </Text>
                      <Text className="text-sm font-bold text-emerald-600 mt-0.5">
                        {required75} / {s.total_expected_classes} Classes
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* MODAL 1: REGISTER NEW COURSE */}
      <ModalSheet
        visible={showCourseModal}
        badge="CATALOG // NEW COURSE"
        title="Register Academic Course"
        subtitle="Add a course code to the university catalog before provisioning a session."
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
              placeholder="e.g. Artificial Intelligence & Computer Vision"
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
              placeholder="Brief course summary..."
              placeholderTextColor="#94A3B8"
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

      {/* MODAL 2: PROVISION COURSE SESSION */}
      <ModalSheet
        visible={showSessionModal}
        badge="PROVISIONING // ACADEMIC SESSION"
        title="Provision Course Session"
        subtitle="Creates a session and initializes an isolated Computer Vision face collection for this course."
        onClose={() => setShowSessionModal(false)}
      >
        <View className="space-y-4">
          <View className="mb-3">
            <Text className="text-xs font-semibold text-slate-700 mb-1.5 uppercase">
              Select Course (CoursePass Central Hub)
            </Text>
            <View className="relative justify-center mb-2">
              <View className="absolute left-3 z-10">
                <Search size={14} color="#94A3B8" />
              </View>
              <TextInput
                value={courseDropdownSearch}
                onChangeText={setCourseDropdownSearch}
                placeholder="Filter CoursePass courses by code or title..."
                placeholderTextColor="#94A3B8"
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
              />
            </View>

            <ScrollView
              className="max-h-40 border border-slate-200 rounded-xl bg-slate-50/60 p-1.5"
              nestedScrollEnabled
            >
              {filteredModalCourses.length === 0 ? (
                <Text className="text-xs text-slate-400 p-3 text-center">
                  No courses matching search.
                </Text>
              ) : (
                filteredModalCourses.map((c) => {
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
                      {selected && (
                        <CheckCircle2 size={14} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>

          <View className="flex-row gap-3 mb-3">
            <View className="flex-1">
              <Text className="text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                Academic Session
              </Text>
              <TextInput
                value={sessionName}
                onChangeText={setSessionName}
                placeholder="2025/2026"
                placeholderTextColor="#94A3B8"
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

          <View className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/70 mb-4">
            <Text className="text-xs text-slate-700 leading-relaxed">
              <Text className="font-bold text-blue-700">
                75% Attendance Threshold:
              </Text>{" "}
              Students must attend at least{" "}
              <Text className="font-bold">
                {Math.ceil((Number(totalClasses) || 12) * 0.75)} lectures
              </Text>{" "}
              out of {totalClasses || 12} to qualify for final examinations.
            </Text>
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
              disabled={creatingSession || courses.length === 0}
              className={`px-5 py-2.5 rounded-xl ${
                creatingSession || courses.length === 0
                  ? "bg-slate-300"
                  : "bg-blue-500"
              }`}
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
