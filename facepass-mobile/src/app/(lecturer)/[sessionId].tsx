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
  useLazyGetImageAttendanceStatusQuery,
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
  const [checkImageStatus] = useLazyGetImageAttendanceStatusQuery();

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
        const totalFiles = files.length;
        let jobIds: string[] = [];

        setAttendanceTask({
          status: "uploading",
          mode,
          progress: 5,
          title: "Preparing Classroom Capture...",
          detail: "Generating secure S3 presigned URLs for privacy...",
        });

        // Upload and start jobs
        for (let i = 0; i < totalFiles; i++) {
          const imgFile = files[i];
          const stepLabel = totalFiles > 1 ? ` (Photo ${i + 1} of ${totalFiles})` : "";

          const presignRes = await getPresignedUrl({
            sessionId,
            fileName: imgFile.name || `capture_${i}.jpg`,
            fileType: imgFile.type || "image/jpeg",
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
                      progress: Math.min(85, Math.max(10, baseProgress + fileShare)),
                      title: `Uploading Classroom Image${stepLabel}...`,
                      detail: `Streaming image to S3 (${pct}%) ?" local cache auto-purged...`,
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
                  progress: 85,
                  title: `Starting Background Analysis${stepLabel}...`,
                  detail: "Queueing AWS Rekognition tasks...",
                }
              : prev
          );

          const scanRes = await processImageAttendance({
            sessionId,
            s3_key: presignRes.s3_key,
          }).unwrap();

          if (scanRes.job_id) {
            jobIds.push(scanRes.job_id);
          }
        }

        setAttendanceTask({
          status: "polling",
          mode,
          progress: 90,
          title: "Analyzing Images...",
          detail: "Processing faces in the background...",
        });

        let pollAttempts = 0;
        let completedJobs = new Set<string>();
        let combinedMarkedPresent = 0;
        let combinedAlreadyMarked = 0;
        let combinedUnmatched = 0;

        pollIntervalRef.current = setInterval(async () => {
          pollAttempts += 1;
          
          try {
            for (const jobId of jobIds) {
              if (completedJobs.has(jobId)) continue;
              
              const statusRes = await checkImageStatus({ sessionId, jobId }).unwrap();
              
              if (statusRes.status === "complete") {
                completedJobs.add(jobId);
                combinedMarkedPresent += Number(statusRes.marked_present_count || 0);
                combinedAlreadyMarked += Number(statusRes.already_marked_today_count || 0);
                combinedUnmatched += Number(statusRes.unmatched_faces_count || 0);
              } else if (statusRes.status === "failed") {
                completedJobs.add(jobId);
              }
            }

            setAttendanceTask((prev) => prev ? {
              ...prev,
              progress: Math.min(99, 90 + pollAttempts),
              detail: `Processing ${completedJobs.size}/${jobIds.length} images (check #${pollAttempts})...`
            } : prev);

            if (completedJobs.size === jobIds.length) {
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;

              if (combinedUnmatched > 0) {
                setIntruderAlertCount(combinedUnmatched);
              }

              setAttendanceTask({
                status: "complete",
                mode,
                progress: 100,
                title: "Classroom Attendance Recorded",
                detail: combinedMarkedPresent > 0
                    ? `Marked ${combinedMarkedPresent} student(s) present${combinedAlreadyMarked > 0 ? ` (${combinedAlreadyMarked} already logged today)` : ""}.`
                    : `No registered students identified in the frame(s).`,
              });
              refetch();
            }
          } catch (err) {
            console.error("Polling error", err);
          }
        }, 5000);
      }
      
