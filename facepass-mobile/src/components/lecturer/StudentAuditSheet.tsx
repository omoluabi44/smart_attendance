import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Award,
  Download,
} from "lucide-react-native";
import { useGetStudentAuditQuery } from "@/lib/api/facepassApi";
import { shareCsvString } from "@/utils/fileExport";

export interface StudentAuditSheetProps {
  visible: boolean;
  sessionId: string;
  studentId: string | null;
  onClose: () => void;
}

export default function StudentAuditSheet({
  visible,
  sessionId,
  studentId,
  onClose,
}: StudentAuditSheetProps) {
  const { data, isLoading, error } = useGetStudentAuditQuery(
    { sessionId, studentId: studentId || "" },
    { skip: !visible || !studentId }
  );

  const student = data?.student;
  const metrics = data?.attendance_metrics;
  const logs: any[] = data?.attendance_logs || [];
  const quizzes: any[] = data?.quiz_results || [];

  const handleExportStudentCSV = async () => {
    if (!student || !metrics) return;
    try {
      const headers = [
        "Date / Time",
        "Status",
        "Confidence Score",
        "Marked By / Source",
      ];
      const rows = logs.map((l) => [
        l.timestamp ? new Date(l.timestamp).toLocaleString() : "N/A",
        (l.status || "present").toUpperCase(),
        l.confidence_score ? `${Number(l.confidence_score).toFixed(1)}%` : "N/A",
        l.marked_by || "Computer Vision Engine",
      ]);

      const summaryRows = [
        ["Student Name", student.name],
        ["Matric Number", student.matric],
        ["Department", student.department || "General"],
        ["Classes Attended", metrics.attended],
        ["Classes Excused", metrics.excused],
        ["Classes Missed", metrics.missed],
        ["Total Expected Classes", metrics.total_expected_classes],
        ["Attendance Percentage", `${metrics.percentage}%`],
        ["75% Threshold Eligible", metrics.eligible_75 ? "YES" : "NO"],
        [],
        headers,
        ...rows,
      ];

      const csvContent = summaryRows
        .map((r) =>
          r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");

      await shareCsvString({
        csvContent,
        filename: `student_record_${student.matric || student.id}.csv`,
      });
    } catch (err: any) {
      Alert.alert("Export Error", err?.message || "Failed to export attendance record.");
    }
  };

  return (
    <Modal
      visible={visible && !!studentId}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-obsidian-950/75 justify-end">
        <View className="bg-white rounded-t-3xl h-[88%] overflow-hidden">
          {/* Header */}
          <View className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex-row items-center justify-between">
            <View>
              <Text className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
                STUDENT ATTENDANCE RECORD
              </Text>
              <Text className="text-base font-bold text-slate-900">
                Individual Attendance & Quiz Audit
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="flex-row items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200"
            >
              <X size={16} color="#475569" />
              <Text className="text-xs font-semibold text-slate-600">
                Close
              </Text>
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView className="flex-1 px-6 py-5">
            {isLoading ? (
              <View className="py-16 items-center">
                <ActivityIndicator size="small" color="#007BFF" />
                <Text className="mt-3 text-xs text-slate-400 font-semibold">
                  LOADING ATTENDANCE RECORD...
                </Text>
              </View>
            ) : error ? (
              <View className="p-4 rounded-xl bg-rose-50 border border-rose-200">
                <Text className="text-xs text-rose-700 font-medium">
                  Unable to load student audit history.
                </Text>
              </View>
            ) : (
              student && (
                <View className="space-y-6 pb-10">
                  {/* Profile Card */}
                  <View className="flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    {student.profile_image ? (
                      <Image
                        source={{ uri: student.profile_image }}
                        className="w-14 h-14 rounded-2xl border border-slate-200"
                      />
                    ) : (
                      <View className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 items-center justify-center">
                        <Text className="text-blue-600 font-bold text-lg">
                          {(student.name || "S")[0]}
                        </Text>
                      </View>
                    )}

                    <View className="flex-1">
                      <Text
                        className="text-base font-bold text-slate-900"
                        numberOfLines={1}
                      >
                        {student.name}
                      </Text>
                      <Text className="text-xs text-slate-500 mt-0.5">
                        {student.matric} • {student.department}
                      </Text>
                      <Text
                        className="text-xs text-slate-400 mt-0.5"
                        numberOfLines={1}
                      >
                        {student.email}
                      </Text>
                    </View>

                    {metrics?.eligible_75 ? (
                      <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                        <CheckCircle2 size={13} color="#059669" />
                        <Text className="text-[10px] font-bold text-emerald-700">
                          ELIGIBLE
                        </Text>
                      </View>
                    ) : (
                      <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200">
                        <AlertTriangle size={13} color="#E11D48" />
                        <Text className="text-[10px] font-bold text-rose-700">
                          AT RISK
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* 75% Attendance Progress Card */}
                  {metrics && (
                    <View className="p-5 rounded-2xl bg-white border border-slate-200 mt-4">
                      <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          75% Eligibility Progress
                        </Text>
                        <Text className="text-xl font-bold text-slate-900">
                          {metrics.percentage}%
                        </Text>
                      </View>

                      <View className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-4">
                        <View
                          style={{
                            width: `${Math.min(100, metrics.percentage)}%`,
                          }}
                          className={`h-full rounded-full ${
                            metrics.eligible_75
                              ? "bg-emerald-500"
                              : metrics.percentage >= 60
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                        />
                      </View>

                      <View className="flex-row gap-2.5">
                        <View className="flex-1 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60 items-center">
                          <Text className="text-lg font-bold text-emerald-700">
                            {metrics.attended}
                          </Text>
                          <Text className="text-[10px] text-emerald-600 uppercase font-semibold">
                            Present
                          </Text>
                        </View>
                        <View className="flex-1 p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 items-center">
                          <Text className="text-lg font-bold text-amber-700">
                            {metrics.excused}
                          </Text>
                          <Text className="text-[10px] text-amber-600 uppercase font-semibold">
                            Excused
                          </Text>
                        </View>
                        <View className="flex-1 p-3 rounded-xl bg-rose-50/70 border border-rose-200/60 items-center">
                          <Text className="text-lg font-bold text-rose-700">
                            {metrics.missed}
                          </Text>
                          <Text className="text-[10px] text-rose-600 uppercase font-semibold">
                            Missed
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Chronological Attendance Log */}
                  <View className="mt-5">
                    <View className="flex-row items-center gap-1.5 mb-3">
                      <Calendar size={14} color="#334155" />
                      <Text className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Attendance Log ({logs.length})
                      </Text>
                    </View>
                    {logs.length === 0 ? (
                      <View className="p-6 text-center rounded-2xl border border-slate-200 bg-slate-50/50 items-center">
                        <Text className="text-xs text-slate-500">
                          No attendance scans recorded for this student yet.
                        </Text>
                      </View>
                    ) : (
                      <View className="space-y-2">
                        {logs.map((l) => (
                          <View
                            key={l.id}
                            className="flex-row items-center justify-between p-3 rounded-xl bg-white border border-slate-200 mb-2"
                          >
                            <View className="flex-1 pr-2">
                              <Text className="text-xs font-semibold text-slate-900">
                                {l.timestamp
                                  ? new Date(l.timestamp).toLocaleString()
                                  : "Recorded"}
                              </Text>
                              <Text className="text-[11px] text-slate-500 mt-0.5">
                                {l.confidence_score
                                  ? `Confidence: ${Number(
                                      l.confidence_score
                                    ).toFixed(1)}%`
                                  : "Manual Override"}
                              </Text>
                            </View>
                            <View
                              className={`px-2.5 py-1 rounded-full ${
                                l.status === "present"
                                  ? "bg-emerald-50 border border-emerald-200"
                                  : l.status === "excused"
                                  ? "bg-amber-50 border border-amber-200"
                                  : "bg-rose-50 border border-rose-200"
                              }`}
                            >
                              <Text
                                className={`text-[10px] uppercase font-bold ${
                                  l.status === "present"
                                    ? "text-emerald-700"
                                    : l.status === "excused"
                                    ? "text-amber-700"
                                    : "text-rose-700"
                                }`}
                              >
                                {l.status}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* CoursePass Quiz Scores */}
                  <View className="mt-5">
                    <View className="flex-row items-center gap-1.5 mb-3">
                      <Award size={14} color="#334155" />
                      <Text className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        CoursePass Quiz Performance ({quizzes.length})
                      </Text>
                    </View>
                    {quizzes.length === 0 ? (
                      <View className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 items-center">
                        <Text className="text-xs text-slate-500">
                          No quiz submissions synced from CoursePass yet.
                        </Text>
                      </View>
                    ) : (
                      <View className="space-y-2">
                        {quizzes.map((q) => (
                          <View
                            key={q.id}
                            className="flex-row items-center justify-between p-3 rounded-xl bg-white border border-slate-200 mb-2"
                          >
                            <View className="flex-1 pr-2">
                              <Text className="text-xs font-semibold text-slate-900">
                                {q.quiz_title}
                              </Text>
                              <Text className="text-[11px] text-slate-400">
                                {q.submitted_at
                                  ? new Date(
                                      q.submitted_at
                                    ).toLocaleDateString()
                                  : ""}
                              </Text>
                            </View>
                            <Text className="text-sm font-bold text-blue-600">
                              {q.score} / {q.max_score}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              )
            )}
          </ScrollView>

          {/* Footer Export Action */}
          {student && (
            <View className="p-4 border-t border-slate-200 bg-slate-50 flex-row items-center justify-between">
              <Text className="text-[11px] text-slate-500">
                ID: {(student.id || "").slice(0, 8)}
              </Text>
              <TouchableOpacity
                onPress={handleExportStudentCSV}
                className="flex-row items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200"
              >
                <Download size={14} color="#334155" />
                <Text className="text-xs font-semibold text-slate-700">
                  Export Attendance Record (CSV)
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
