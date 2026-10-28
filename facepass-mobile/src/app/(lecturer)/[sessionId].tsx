import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Camera,
  Download,
  Users,
  CheckCircle2,
  AlertTriangle,
  Search,
  Settings,
  UserPlus,
  Calendar,
  BookOpen,
  Award,
  ShieldAlert,
  Building2,
} from "lucide-react-native";
import {
  useGetSessionDetailQuery,
  useUpdateCourseSessionMutation,
  useAddCoLecturerMutation,
  useOverrideAttendanceLogMutation,
  useLazyGetAttendancePresignedUrlQuery,
  useProcessImageAttendanceMutation,
  useProcessVideoAttendanceMutation,
  useLazyGetVideoAttendanceStatusQuery,
} from "@/lib/api/facepassApi";
import { useAppSelector } from "@/lib/store";
import VisionScannerModal from "@/components/lecturer/VisionScannerModal";
import StudentAuditSheet from "@/components/lecturer/StudentAuditSheet";
import AttendanceProgressBanner, {
  AttendanceTaskState,
} from "@/components/lecturer/AttendanceProgressBanner";
import {
  CourseMaterialsPanel,
  QuizzesAndGradesPanel,
} from "@/components/lecturer/SessionResourcesTabs";
import KpiCard from "@/components/ui/KpiCard";
import ModalSheet from "@/components/ui/ModalSheet";
import {
  EphemeralMediaFile,
  uploadMediaToPresignedUrlAndPurge,
} from "@/utils/ephemeralMedia";
import { exportAndShareSessionReport } from "@/utils/fileExport";

export default function SessionControlRoomScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const token = useAppSelector((state) => state.user.token);

  const {
    data,
    isLoading,
    refetch,
  } = useGetSessionDetailQuery(sessionId || "", {
    skip: !sessionId,
  });

  const [updateSession, { isLoading: updatingSession }] =
    useUpdateCourseSessionMutation();
  const [addCoLecturer, { isLoading: addingCoLecturer }] =
    useAddCoLecturerMutation();
  const [overrideLog] = useOverrideAttendanceLogMutation();

  const [getPresignedUrl] = useLazyGetAttendancePresignedUrlQuery();
  const [processImageAttendance] = useProcessImageAttendanceMutation();
  const [processVideoAttendance] = useProcessVideoAttendanceMutation();
  const [checkVideoStatus] = useLazyGetVideoAttendanceStatusQuery();

  const [activeTab, setActiveTab] = useState<
    "roster" | "history" | "at_risk" | "materials" | "quizzes"
  >("roster");
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [showScanner, setShowScanner] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null
  );
  const [refreshing, setRefreshing] = useState(false);

  // Co-Lecturer Modal
  const [showCoLecturerModal, setShowCoLecturerModal] = useState(false);
  const [coLecturerEmail, setCoLecturerEmail] = useState("");
  const [coLecturerFeedback, setCoLecturerFeedback] = useState("");

  // Session Settings Modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editTotalClasses, setEditTotalClasses] = useState("");
  const [editSessionName, setEditSessionName] = useState("");

  // Intruder Alert Banner
  const [intruderAlertCount, setIntruderAlertCount] = useState(0);

  // Background Attendance Task
  const [attendanceTask, setAttendanceTask] =
    useState<AttendanceTaskState | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const session = data?.session;
  const students: any[] = data?.students || [];
  const attendanceByDate: any[] = data?.attendance_by_date || [];

  const departments = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.department) set.add(s.department);
    });
    return ["ALL", ...Array.from(set)];
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesDept =
        departmentFilter === "ALL" || s.department === departmentFilter;
      const matchesQuery =
        !searchQuery ||
        (s.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.matric || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.email || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDept && matchesQuery;
    });
  }, [students, departmentFilter, searchQuery]);

  const studentsByDepartment = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredStudents.forEach((s) => {
      const dept = s.department || "General";
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(s);
    });
    return groups;
  }, [filteredStudents]);

  const atRiskStudents = useMemo(() => {
    return students.filter((s) => !s.eligible_75);
  }, [students]);

  const avgAttendance = useMemo(() => {
    if (students.length === 0) return 0;
    const sum = students.reduce(
      (acc, s) => acc + (s.attendance_percentage || 0),
      0
    );
    return (sum / students.length).toFixed(1);
  }, [students]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // BACKGROUND S3 PRESIGNED UPLOAD + REKOGNITION ATTENDANCE PIPELINE
  // ══════════════════════════════════════════════════════════════════════════
  const handleStartBackgroundScan = async ({
    mode,
    files,
  }: {
    mode: "photo" | "camera" | "video";
    files: EphemeralMediaFile[];
  }) => {
    if (!files || files.length === 0 || !sessionId) return;
    setShowScanner(false);

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    const totalFiles = files.length;

    setAttendanceTask({
      status: "uploading",
      mode,
      progress: 5,
      title:
        mode === "video"
          ? "Uploading Walkthrough Video..."
          : totalFiles > 1
          ? `Uploading ${totalFiles} Classroom Snapshots...`
          : "Uploading Classroom Image...",
      detail: "Requesting secure S3 presigned upload URL...",
    });

    try {
      if (mode === "video") {
        const videoFile = files[0];
        const presignRes = await getPresignedUrl({
          sessionId,
          fileName: videoFile.fileName,
          fileType: videoFile.mimeType || "video/mp4",
        }).unwrap();

        await uploadMediaToPresignedUrlAndPurge({
          presignedUrl: presignRes.presigned_url,
          file: videoFile,
          onProgress: (pct) => {
            setAttendanceTask((prev) =>
              prev
                ? {
                    ...prev,
                    progress: Math.min(45, Math.max(8, Math.round(pct * 0.45))),
                    detail: `Streaming video to cloud storage (${pct}%)...`,
                  }
                : prev
            );
          },
        });

        setAttendanceTask({
          status: "analyzing",
          mode: "video",
          progress: 50,
          title: "Starting Multi-Frame Face Tracking...",
          detail: `Initializing AWS Rekognition video job across CV-${
            session?.courseID || "COURSE"
          }...`,
        });

        const videoJob = await processVideoAttendance({
          sessionId,
          s3_key: presignRes.s3_key,
        }).unwrap();

        const jobId = videoJob.job_id;
        let pollAttempts = 0;

        setAttendanceTask({
          status: "polling",
          mode: "video",
          progress: 60,
          title: "Tracking Faces Across Video Frames...",
          detail: "Scanning video stream in the background...",
        });

        pollIntervalRef.current = setInterval(async () => {
          pollAttempts += 1;
          try {
            const statusRes = await checkVideoStatus({
              sessionId,
              jobId,
            }).unwrap();

            if (statusRes.status === "complete") {
              if (pollIntervalRef.current)
                clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;

              setAttendanceTask({
                status: "complete",
                mode: "video",
                progress: 100,
                title: "Video Attendance Complete",
                detail: `Verified ${
                  statusRes.marked_present_count || 0
                } students from walkthrough video.`,
                result: statusRes,
              });
              refetch();
            } else if (statusRes.status === "failed") {
              if (pollIntervalRef.current)
                clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;

              setAttendanceTask({
                status: "error",
                mode: "video",
                progress: 100,
                title: "Video Analysis Failed",
                detail:
                  statusRes.message ||
                  "Rekognition could not process the video.",
              });
            } else {
              setAttendanceTask((prev) =>
                prev
                  ? {
                      ...prev,
                      progress: Math.min(92, 60 + pollAttempts * 4),
                      detail: `Analyzing classroom video frames (check #${pollAttempts})...`,
                    }
                  : prev
              );
            }
          } catch {
            // Keep polling on transient network hiccup
          }
        }, 5000);
      } else {
        // Photo or multi-snapshot mode
        let combinedMarkedPresent = 0;
        let combinedAlreadyMarked = 0;
        let combinedUnmatched = 0;
        const allPresentStudentsMap = new Map<string, any>();

        for (let i = 0; i < files.length; i++) {
          const imgFile = files[i];
          const stepLabel =
            totalFiles > 1 ? ` (Photo ${i + 1} of ${totalFiles})` : "";

          const presignRes = await getPresignedUrl({
            sessionId,
            fileName: imgFile.fileName,
            fileType: imgFile.mimeType || "image/jpeg",
          }).unwrap();

          await uploadMediaToPresignedUrlAndPurge({
            presignedUrl: presignRes.presigned_url,
            file: imgFile,
            onProgress: (pct) => {
              const baseProgress = Math.round((i / totalFiles) * 80);
              const fileShare = Math.round((pct / 100) * (40 / totalFiles));
              setAttendanceTask((prev) =>
                prev
                  ? {
                      ...prev,
                      status: "uploading",
                      progress: Math.min(
                        85,
                        Math.max(10, baseProgress + fileShare)
                      ),
                      title: `Uploading Classroom Image${stepLabel}...`,
                      detail: `Streaming image to S3 (${pct}%) — local cache auto-purged...`,
                    }
                  : prev
              );
            },
          });

          setAttendanceTask((prev) =>
            prev
              ? {
                  ...prev,
                  status: "analyzing",
                  progress: Math.min(
                    95,
                    Math.round(((i + 0.7) / totalFiles) * 90)
                  ),
                  title: `Matching Faces in CV-${
                    session?.courseID || "COURSE"
                  }${stepLabel}...`,
                  detail:
                    "Isolating faces and matching against enrolled student biometrics...",
                }
              : prev
          );

          const scanRes = await processImageAttendance({
            sessionId,
            s3_key: presignRes.s3_key,
          }).unwrap();

          combinedMarkedPresent += Number(scanRes.marked_present_count || 0);
          combinedAlreadyMarked += Number(
            scanRes.already_marked_today_count || 0
          );
          combinedUnmatched += Number(scanRes.unmatched_faces_count || 0);

          if (Array.isArray(scanRes.present_students)) {
            scanRes.present_students.forEach((st: any) => {
              allPresentStudentsMap.set(st.student_id || st.matric, st);
            });
          }
        }

        if (combinedUnmatched > 0) {
          setIntruderAlertCount(combinedUnmatched);
        }

        const aggregatedResult = {
          marked_present_count: combinedMarkedPresent,
          already_marked_today_count: combinedAlreadyMarked,
          unmatched_faces_count: combinedUnmatched,
          present_students: Array.from(allPresentStudentsMap.values()),
        };

        setAttendanceTask({
          status: "complete",
          mode,
          progress: 100,
          title: "Classroom Attendance Recorded",
          detail:
            combinedMarkedPresent > 0
              ? `Marked ${combinedMarkedPresent} student(s) present${
                  combinedAlreadyMarked > 0
                    ? ` (${combinedAlreadyMarked} already logged today)`
                    : ""
                }.`
              : combinedAlreadyMarked > 0
              ? `All ${combinedAlreadyMarked} matched student(s) were already marked present today.`
              : "Scan finished. No new enrolled faces matched above 90% confidence.",
          result: aggregatedResult,
        });

        refetch();
      }
    } catch (err: any) {
      setAttendanceTask({
        status: "error",
        mode,
        progress: 100,
        title: "Attendance Scan Failed",
        detail:
          err?.data?.error ||
          err?.message ||
          "An unexpected error occurred during attendance processing.",
      });
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // EXPORTS & SETTINGS HANDLERS
  // ══════════════════════════════════════════════════════════════════════════
  const handleExportExcel = async () => {
    if (!sessionId) return;
    try {
      await exportAndShareSessionReport({
        endpointPath: `lecturer/sessions/${sessionId}/export`,
        filename: `attendance_${session?.courseID || "course"}_${
          session?.session_name || "session"
        }.xlsx`,
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        token,
      });
    } catch (err: any) {
      Alert.alert("Export Error", err?.message || "Unable to export Excel.");
    }
  };

  const handleExportCSV = async () => {
    if (!sessionId) return;
    try {
      await exportAndShareSessionReport({
        endpointPath: `lecturer/sessions/${sessionId}/export-csv`,
        filename: `attendance_${session?.courseID || "course"}_${
          session?.session_name || "session"
        }.csv`,
        mimeType: "text/csv",
        token,
      });
    } catch (err: any) {
      Alert.alert("Export Error", err?.message || "Unable to export CSV.");
    }
  };

  const handleExportDateExcel = async (dateStr: string) => {
    if (!sessionId) return;
    try {
      await exportAndShareSessionReport({
        endpointPath: `lecturer/sessions/${sessionId}/export-date/${dateStr}`,
        filename: `attendance_${session?.courseID || "course"}_${dateStr}.xlsx`,
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        token,
      });
    } catch (err: any) {
      Alert.alert(
        "Export Error",
        err?.message || "Unable to export date attendance sheet."
      );
    }
  };

  const handleAddCoLecturer = async () => {
    if (!coLecturerEmail.trim() || !sessionId) return;
    setCoLecturerFeedback("");
    try {
      const res = await addCoLecturer({
        sessionId,
        email: coLecturerEmail.trim(),
      }).unwrap();
      setCoLecturerFeedback(res.message || "Co-lecturer added!");
      setCoLecturerEmail("");
      setTimeout(() => {
        setShowCoLecturerModal(false);
        setCoLecturerFeedback("");
      }, 1000);
    } catch (err: any) {
      setCoLecturerFeedback(err?.data?.error || "Failed to add co-lecturer.");
    }
  };

  const handleSaveSettings = async () => {
    if (!sessionId) return;
    try {
      await updateSession({
        sessionId,
        total_expected_classes: Number(editTotalClasses),
        session_name: editSessionName,
      }).unwrap();
      setShowSettingsModal(false);
    } catch (err: any) {
      Alert.alert("Update Error", err?.data?.error || "Failed to save settings.");
    }
  };

  const handleOverrideStatus = async (logId: string, newStatus: string) => {
    if (!sessionId) return;
    try {
      await overrideLog({
        sessionId,
        logId,
        status: newStatus,
      }).unwrap();
    } catch (err: any) {
      Alert.alert(
        "Override Error",
        err?.data?.error || "Failed to override attendance status."
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA]">
      {/* Top Session Control Room Header */}
      <View className="px-4 py-3.5 bg-white border-b border-slate-200/80">
        <View className="flex-row items-center justify-between mb-2.5">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center gap-1.5 py-1 pr-2"
          >
            <ArrowLeft size={16} color="#475569" />
            <Text className="text-xs font-semibold text-slate-600">
              All Sessions
            </Text>
          </TouchableOpacity>

          {/* Primary Launch Scanner CTA */}
          <TouchableOpacity
            onPress={() => setShowScanner(true)}
            className="flex-row items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500 shadow-sm"
          >
            <Camera size={14} color="#FFFFFF" />
            <Text className="text-xs font-bold text-white">
              Launch Vision Scanner
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center gap-2 mb-1">
          <View className="px-2 py-0.5 rounded-md bg-blue-500">
            <Text className="text-white text-xs font-bold">
              {session?.courseID || "..."}
            </Text>
          </View>
          <View className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
            <Text className="text-[11px] font-semibold text-slate-700">
              {session?.session_name || "..."}
            </Text>
          </View>
          <View className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200">
            <Text className="text-[10px] font-bold text-emerald-700">
              75% REQ: {session?.required_classes_75 || 0}/
              {session?.total_expected_classes || 0}
            </Text>
          </View>
        </View>

        <Text className="text-base font-bold text-slate-900" numberOfLines={1}>
          {session?.course_name || "Loading Session..."}
        </Text>

        {/* Assigned Faculty Pills */}
        {session?.lecturers && session.lecturers.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-2"
          >
            <View className="flex-row items-center gap-1.5">
              <Text className="text-[10px] font-bold uppercase text-slate-400 mr-1">
                Faculty:
              </Text>
              {session.lecturers.map((lec: any) => (
                <View
                  key={lec.id}
                  className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200"
                >
                  <Text className="text-[11px] font-medium text-slate-700">
                    {lec.name}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        {/* Quick Actions Toolbar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3 pt-2.5 border-t border-slate-100"
        >
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => setShowCoLecturerModal(true)}
              className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200"
            >
              <UserPlus size={13} color="#334155" />
              <Text className="text-xs font-semibold text-slate-700">
                Co-Lecturer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setEditTotalClasses(
                  String(session?.total_expected_classes || 12)
                );
                setEditSessionName(session?.session_name || "2025/2026");
                setShowSettingsModal(true);
              }}
              className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200"
            >
              <Settings size={13} color="#334155" />
              <Text className="text-xs font-semibold text-slate-700">
                Settings
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleExportExcel}
              className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200"
            >
              <Download size={13} color="#334155" />
              <Text className="text-xs font-semibold text-slate-700">
                Export Excel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleExportCSV}
              className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200"
            >
              <Download size={13} color="#334155" />
              <Text className="text-xs font-semibold text-slate-700">
                Export CSV
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
        {/* Intruder / Biometric Anomaly Banner */}
        {intruderAlertCount > 0 && (
          <View className="mb-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex-row items-start justify-between gap-3">
            <View className="flex-row items-start gap-2.5 flex-1">
              <ShieldAlert size={18} color="#D97706" />
              <View className="flex-1">
                <Text className="text-xs font-bold text-amber-900">
                  Biometric Anomaly Detected: {intruderAlertCount} Unrecognized
                  Face(s)
                </Text>
                <Text className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                  {intruderAlertCount} detected face(s) in the last classroom
                  scan did not match any student enrolled in {session?.courseID}{" "}
                  on CoursePass.
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setIntruderAlertCount(0)}>
              <Text className="text-xs font-bold text-amber-800">Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 4 KPI Cards */}
        <View className="flex-row flex-wrap gap-3 mb-5">
          <KpiCard
            label="Enrolled Roster"
            value={students.length}
            sublabel="Synced from CoursePass"
          />
          <KpiCard
            label="Mean Attendance"
            value={`${avgAttendance}%`}
            sublabel={`Across ${session?.total_expected_classes || 0} classes`}
            valueColorClass="text-blue-600"
          />
          <KpiCard
            label="Exam Eligible (>=75%)"
            value={students.length - atRiskStudents.length}
            sublabel="Qualifies for final exam"
            valueColorClass="text-emerald-600"
          />
          <KpiCard
            label="At-Risk Watchlist (<75%)"
            value={atRiskStudents.length}
            sublabel="Below 75% threshold"
            valueColorClass="text-rose-600"
          />
        </View>

        {/* 5-Tab Navigation Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
        >
          <View className="flex-row items-center gap-2">
            {[
              {
                key: "roster",
                label: `Class Register (${students.length})`,
                icon: Users,
              },
              {
                key: "history",
                label: `Attendance History (${attendanceByDate.length})`,
                icon: Calendar,
              },
              {
                key: "at_risk",
                label: `At-Risk Watchlist (${atRiskStudents.length})`,
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
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key as any)}
                  className={`flex-row items-center gap-1.5 px-3.5 py-2.5 rounded-xl border ${
                    active
                      ? "bg-blue-500 border-blue-500"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <Icon size={14} color={active ? "#FFFFFF" : "#64748B"} />
                  <Text
                    className={`text-xs font-semibold ${
                      active ? "text-white" : "text-slate-600"
                    }`}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* ══════════════════════════════════════════════════════════════════
            TAB 1: CLASS REGISTER (GROUPED BY DEPARTMENT)
           ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "roster" && (
          <View className="pb-24">
            {/* Search & Department Filter */}
            <View className="bg-white p-4 rounded-2xl border border-slate-200/90 mb-4 space-y-3">
              <View className="relative justify-center mb-2.5">
                <View className="absolute left-3.5 z-10">
                  <Search size={15} color="#94A3B8" />
                </View>
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search student by name, matric, or email..."
                  placeholderTextColor="#94A3B8"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row items-center gap-2">
                  {departments.map((d) => (
                    <TouchableOpacity
                      key={d}
                      onPress={() => setDepartmentFilter(d)}
                      className={`px-3 py-1.5 rounded-lg border ${
                        departmentFilter === d
                          ? "bg-obsidian-950 border-obsidian-950"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <Text
                        className={`text-[11px] font-semibold ${
                          departmentFilter === d
                            ? "text-white"
                            : "text-slate-600"
                        }`}
                      >
                        {d === "ALL" ? "All Departments" : d}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {isLoading ? (
              <View className="p-12 bg-white rounded-2xl border border-slate-200 items-center">
                <ActivityIndicator size="small" color="#007BFF" />
                <Text className="text-xs text-slate-400 mt-2">
                  SYNCHRONIZING CLASS REGISTER...
                </Text>
              </View>
            ) : Object.keys(studentsByDepartment).length === 0 ? (
              <View className="p-10 bg-white rounded-2xl border border-slate-200 items-center">
                <Users size={32} color="#CBD5E1" />
                <Text className="text-sm font-bold text-slate-800 mt-2 mb-1">
                  No Students Found
                </Text>
                <Text className="text-xs text-slate-500 text-center">
                  Students enrolled in {session?.courseID} on CoursePass will
                  automatically appear here.
                </Text>
              </View>
            ) : (
              Object.entries(studentsByDepartment).map(([dept, deptStudents]) => (
                <View
                  key={dept}
                  className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden mb-4"
                >
                  <View className="px-4 py-3 bg-slate-50 border-b border-slate-200/80 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Building2 size={14} color="#007BFF" />
                      <Text className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        {dept}
                      </Text>
                    </View>
                    <Text className="text-[11px] text-slate-500 font-semibold">
                      {deptStudents.length} Students
                    </Text>
                  </View>

                  {deptStudents.map((st) => (
                    <TouchableOpacity
                      key={st.id}
                      onPress={() => setSelectedStudentId(st.id)}
                      activeOpacity={0.75}
                      className="p-4 border-b border-slate-100"
                    >
                      <View className="flex-row items-center justify-between gap-3">
                        <View className="flex-row items-center gap-3 flex-1">
                          {st.profile_image ? (
                            <Image
                              source={{ uri: st.profile_image }}
                              className="w-10 h-10 rounded-xl border border-slate-200"
                            />
                          ) : (
                            <View className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 items-center justify-center">
                              <Text className="text-blue-600 font-bold text-xs">
                                {(st.name || "S")[0]}
                              </Text>
                            </View>
                          )}
                          <View className="flex-1">
                            <Text
                              className="text-sm font-bold text-slate-900"
                              numberOfLines={1}
                            >
                              {st.name}
                            </Text>
                            <Text className="text-[11px] text-slate-500">
                              {st.matric} • {st.attended_classes}/
                              {st.total_expected_classes} attended
                              {st.excused_classes > 0
                                ? ` (+${st.excused_classes} exc)`
                                : ""}
                            </Text>
                          </View>
                        </View>

                        {st.eligible_75 ? (
                          <View className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 flex-row items-center gap-1">
                            <CheckCircle2 size={11} color="#059669" />
                            <Text className="text-[10px] font-bold text-emerald-700">
                              ELIGIBLE
                            </Text>
                          </View>
                        ) : (
                          <View className="px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 flex-row items-center gap-1">
                            <AlertTriangle size={11} color="#E11D48" />
                            <Text className="text-[10px] font-bold text-rose-700">
                              {st.attendance_percentage >= 60
                                ? "WARNING"
                                : "INELIGIBLE"}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* 75% Progress Bar */}
                      <View className="mt-3 flex-row items-center gap-2.5">
                        <View className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <View
                            style={{
                              width: `${Math.min(
                                100,
                                st.attendance_percentage || 0
                              )}%`,
                            }}
                            className={`h-full rounded-full ${
                              st.eligible_75
                                ? "bg-emerald-500"
                                : st.attendance_percentage >= 60
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            }`}
                          />
                        </View>
                        <Text className="text-xs font-bold text-slate-800 w-12 text-right">
                          {st.attendance_percentage}%
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ))
            )}
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 2: ATTENDANCE HISTORY & LECTURER OVERRIDES
           ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "history" && (
          <View className="pb-24 space-y-4">
            {attendanceByDate.length === 0 ? (
              <View className="p-10 bg-white rounded-2xl border border-slate-200 items-center">
                <Calendar size={32} color="#CBD5E1" />
                <Text className="text-sm font-bold text-slate-800 mt-2 mb-1">
                  No Attendance Scans Recorded Yet
                </Text>
                <Text className="text-xs text-slate-500 text-center">
                  Launch the Vision Scanner to capture a classroom group photo,
                  live snapshot, or walkthrough video.
                </Text>
              </View>
            ) : (
              attendanceByDate.map((day) => (
                <View
                  key={day.date}
                  className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden mb-4"
                >
                  <View className="px-4 py-3.5 bg-slate-50 border-b border-slate-200/80 flex-row items-center justify-between">
                    <View>
                      <View className="flex-row items-center gap-1.5">
                        <Calendar size={14} color="#007BFF" />
                        <Text className="text-xs font-bold text-slate-900">
                          {day.date}
                        </Text>
                      </View>
                      <Text className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                        {day.total_present} / {day.total_records} Present
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleExportDateExcel(day.date)}
                      className="flex-row items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200"
                    >
                      <Download size={12} color="#334155" />
                      <Text className="text-[11px] font-semibold text-slate-700">
                        Date Excel
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {(day.records || []).map((rec: any) => (
                    <View
                      key={rec.id}
                      className="p-4 border-b border-slate-100"
                    >
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-1 pr-2">
                          <Text className="text-sm font-bold text-slate-900">
                            {rec.student_name}
                          </Text>
                          <Text className="text-[11px] text-slate-500">
                            {rec.matric} • {rec.department} •{" "}
                            {rec.confidence_score
                              ? `${Number(rec.confidence_score).toFixed(1)}%`
                              : "Manual"}
                          </Text>
                        </View>
                        <Text className="text-[11px] text-slate-400">
                          {rec.timestamp
                            ? new Date(rec.timestamp).toLocaleTimeString()
                            : ""}
                        </Text>
                      </View>

                      {/* Lecturer Status Override Pills */}
                      <View className="flex-row items-center gap-2 mt-1">
                        <Text className="text-[10px] font-semibold uppercase text-slate-400 mr-1">
                          Override:
                        </Text>
                        {[
                          { key: "present", label: "Present" },
                          { key: "excused", label: "Excused" },
                          { key: "absent", label: "Absent" },
                        ].map((opt) => {
                          const selected = rec.status === opt.key;
                          return (
                            <TouchableOpacity
                              key={opt.key}
                              onPress={() =>
                                handleOverrideStatus(rec.id, opt.key)
                              }
                              className={`px-2.5 py-1 rounded-lg border ${
                                selected
                                  ? opt.key === "present"
                                    ? "bg-emerald-500 border-emerald-500"
                                    : opt.key === "excused"
                                    ? "bg-amber-500 border-amber-500"
                                    : "bg-rose-500 border-rose-500"
                                  : "bg-slate-50 border-slate-200"
                              }`}
                            >
                              <Text
                                className={`text-[10px] font-bold uppercase ${
                                  selected ? "text-white" : "text-slate-600"
                                }`}
                              >
                                {opt.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </View>
              ))
            )}
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 3: AT-RISK WATCHLIST (<75% ATTENDANCE)
           ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "at_risk" && (
          <View className="pb-24">
            <View className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden">
              <View className="px-4 py-3.5 bg-rose-50/70 border-b border-rose-200/60">
                <Text className="text-xs font-bold uppercase tracking-wider text-rose-800">
                  Students Below 75% Attendance Threshold (
                  {atRiskStudents.length})
                </Text>
                <Text className="text-[11px] text-rose-600 mt-0.5">
                  Requires at least {session?.required_classes_75} of{" "}
                  {session?.total_expected_classes} lectures.
                </Text>
              </View>

              {atRiskStudents.length === 0 ? (
                <View className="p-10 items-center">
                  <CheckCircle2 size={32} color="#10B981" />
                  <Text className="text-sm font-bold text-slate-900 mt-2">
                    100% Roster Compliance
                  </Text>
                  <Text className="text-xs text-slate-500 mt-1 text-center">
                    All enrolled students currently meet or exceed the 75%
                    attendance threshold.
                  </Text>
                </View>
              ) : (
                atRiskStudents.map((st) => {
                  const needed = Math.max(
                    0,
                    (session?.required_classes_75 || 0) -
                      (st.attended_classes + st.excused_classes)
                  );
                  return (
                    <View
                      key={st.id}
                      className="p-4 border-b border-slate-100 flex-row items-center justify-between gap-3"
                    >
                      <View className="flex-1">
                        <Text className="text-sm font-bold text-slate-900">
                          {st.name}
                        </Text>
                        <Text className="text-xs text-slate-500 mt-0.5">
                          {st.matric} • {st.department}
                        </Text>
                        <View className="flex-row items-center gap-2 mt-1.5">
                          <Text className="text-xs font-bold text-rose-600">
                            {st.attendance_percentage}% (
                            {st.attended_classes + st.excused_classes}/
                            {st.total_expected_classes})
                          </Text>
                          <View className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200">
                            <Text className="text-[10px] font-bold text-amber-700">
                              +{needed} lectures needed
                            </Text>
                          </View>
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={() => setSelectedStudentId(st.id)}
                        className="px-3 py-2 rounded-xl bg-slate-100"
                      >
                        <Text className="text-xs font-semibold text-blue-600">
                          View Record
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 4: COURSE MATERIALS
           ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "materials" && sessionId && (
          <View className="pb-24">
            <CourseMaterialsPanel sessionId={sessionId} />
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 5: QUIZZES & GRADES
           ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "quizzes" && sessionId && (
          <View className="pb-24">
            <QuizzesAndGradesPanel sessionId={sessionId} />
          </View>
        )}
      </ScrollView>

      {/* VISION SCANNER MODAL */}
      <VisionScannerModal
        visible={showScanner}
        session={session}
        onClose={() => setShowScanner(false)}
        onStartBackgroundScan={handleStartBackgroundScan}
      />

      {/* FLOATING BACKGROUND ATTENDANCE PROGRESS BANNER */}
      <AttendanceProgressBanner
        task={attendanceTask}
        onDismiss={() => setAttendanceTask(null)}
      />

      {/* STUDENT AUDIT SHEET */}
      {sessionId && (
        <StudentAuditSheet
          visible={!!selectedStudentId}
          sessionId={sessionId}
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
        />
      )}

      {/* CO-LECTURER MODAL */}
      <ModalSheet
        visible={showCoLecturerModal}
        badge="COLLABORATION // CO-LECTURER"
        title="Add Co-Lecturer to Session"
        subtitle="Grant another institutional lecturer access to scan attendance and audit rosters for this session."
        onClose={() => setShowCoLecturerModal(false)}
      >
        <View className="space-y-4">
          {coLecturerFeedback ? (
            <View className="p-3 rounded-xl bg-blue-50 border border-blue-200 mb-3">
              <Text className="text-xs text-blue-700 font-medium">
                {coLecturerFeedback}
              </Text>
            </View>
          ) : null}

          <View className="mb-4">
            <Text className="text-xs font-semibold text-slate-700 mb-1.5 uppercase">
              Co-Lecturer Email
            </Text>
            <TextInput
              value={coLecturerEmail}
              onChangeText={setCoLecturerEmail}
              placeholder="colleague@university.edu"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm text-slate-900"
            />
          </View>

          <View className="flex-row justify-end gap-2">
            <TouchableOpacity
              onPress={() => setShowCoLecturerModal(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200"
            >
              <Text className="text-xs font-semibold text-slate-600">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAddCoLecturer}
              disabled={addingCoLecturer}
              className="px-5 py-2.5 rounded-xl bg-blue-500"
            >
              <Text className="text-xs font-semibold text-white">
                {addingCoLecturer ? "Adding..." : "Grant Access"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ModalSheet>

      {/* SESSION SETTINGS MODAL */}
      <ModalSheet
        visible={showSettingsModal}
        badge="CONFIGURATION // SESSION THRESHOLD"
        title="Session Parameters"
        subtitle="Update academic session label or total expected lectures for the 75% threshold calculation."
        onClose={() => setShowSettingsModal(false)}
      >
        <View className="space-y-4">
          <View className="mb-3">
            <Text className="text-xs font-semibold text-slate-700 mb-1.5 uppercase">
              Session Name
            </Text>
            <TextInput
              value={editSessionName}
              onChangeText={setEditSessionName}
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm text-slate-900"
            />
          </View>

          <View className="mb-3">
            <Text className="text-xs font-semibold text-slate-700 mb-1.5 uppercase">
              Total Expected Lectures
            </Text>
            <TextInput
              value={editTotalClasses}
              onChangeText={setEditTotalClasses}
              keyboardType="numeric"
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm text-slate-900"
            />
            <Text className="text-[11px] text-slate-500 mt-1.5">
              New 75% requirement:{" "}
              <Text className="font-bold text-slate-800">
                {Math.ceil((Number(editTotalClasses) || 1) * 0.75)} classes
              </Text>
            </Text>
          </View>

          <View className="flex-row justify-end gap-2 mt-2">
            <TouchableOpacity
              onPress={() => setShowSettingsModal(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200"
            >
              <Text className="text-xs font-semibold text-slate-600">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveSettings}
              disabled={updatingSession}
              className="px-5 py-2.5 rounded-xl bg-blue-500"
            >
              <Text className="text-xs font-semibold text-white">
                {updatingSession ? "Saving..." : "Save Settings"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ModalSheet>
    </SafeAreaView>
  );
}
