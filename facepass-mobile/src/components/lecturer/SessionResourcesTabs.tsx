import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import {
  FileText,
  Plus,
  Trash2,
  ExternalLink,
  Award,
  Clock,
  CheckCircle2,
  BarChart3,
  BookOpen,
  Calendar,
  BellRing,
  Send,
  MapPin,
} from "lucide-react-native";
import {
  useGetSessionMaterialsQuery,
  useCreateSessionMaterialMutation,
  useDeleteSessionMaterialMutation,
  useGetSessionQuizzesQuery,
  useCreateSessionQuizMutation,
  useGetQuizAnalyticsQuery,
  useGetSessionTimetableQuery,
  useSaveSessionTimetableMutation,
  usePushLectureNotificationMutation,
} from "@/lib/api/facepassApi";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function CourseMaterialsPanel({ sessionId }: { sessionId: string }) {
  const { data, isLoading } = useGetSessionMaterialsQuery(sessionId);
  const [createMaterial, { isLoading: creating }] =
    useCreateSessionMaterialMutation();
  const [deleteMaterial] = useDeleteSessionMaterialMutation();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("pdf");
  const [fileUrl, setFileUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const materials: any[] = data?.materials || [];

  const handleSubmit = async () => {
    setErrorMsg("");
    if (!title.trim() || !fileUrl.trim()) {
      setErrorMsg("Please provide both a resource title and URL.");
      return;
    }
    try {
      await createMaterial({
        sessionId,
        title: title.trim(),
        type,
        file_url: fileUrl.trim(),
      }).unwrap();
      setTitle("");
      setFileUrl("");
      setShowForm(false);
    } catch (err: any) {
      setErrorMsg(err?.data?.error || "Failed to publish material.");
    }
  };

  const handleDelete = (materialId: string, matTitle: string) => {
    Alert.alert("Delete Material", `Remove "${matTitle}" from this session?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteMaterial({ sessionId, materialId }),
      },
    ]);
  };

  const handleOpenLink = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Alert.alert("Invalid URL", "Could not open the external resource link.");
    }
  };

  return (
    <View className="space-y-4">
      <View className="flex-row items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/90">
        <View className="flex-1 pr-3">
          <Text className="text-sm font-bold text-slate-900">
            Course Materials & Lecture Slides
          </Text>
          <Text className="text-xs text-slate-500 mt-0.5">
            Publish PDFs, slide decks, or links directly to students on
            CoursePass.
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowForm(!showForm)}
          className="flex-row items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-500"
        >
          <Plus size={15} color="#FFFFFF" />
          <Text className="text-white text-xs font-semibold">Publish</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View className="bg-white p-5 rounded-2xl border border-slate-200 mt-3 space-y-4">
          {errorMsg ? (
            <View className="p-3 rounded-xl bg-rose-50 border border-rose-200 mb-2">
              <Text className="text-xs text-rose-700">{errorMsg}</Text>
            </View>
          ) : null}

          <View className="mb-3">
            <Text className="text-xs font-semibold text-slate-700 mb-1.5 uppercase">
              Resource Title
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Week 4 — Eigenfaces & CNN Lecture Notes"
              placeholderTextColor="#94A3B8"
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm text-slate-900"
            />
          </View>

          <View className="mb-3">
            <Text className="text-xs font-semibold text-slate-700 mb-1.5 uppercase">
              Format Type
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {[
                { key: "pdf", label: "PDF Document" },
                { key: "slides", label: "Slide Deck" },
                { key: "video", label: "Video Recording" },
                { key: "link", label: "External Link" },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setType(opt.key)}
                  className={`px-3 py-1.5 rounded-xl border ${
                    type === opt.key
                      ? "bg-blue-500 border-blue-500"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      type === opt.key ? "text-white" : "text-slate-700"
                    }`}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-xs font-semibold text-slate-700 mb-1.5 uppercase">
              Resource URL (S3 / Drive / Document Link)
            </Text>
            <TextInput
              value={fileUrl}
              onChangeText={setFileUrl}
              placeholder="https://..."
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              keyboardType="url"
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm text-slate-900"
            />
          </View>

          <View className="flex-row justify-end gap-2">
            <TouchableOpacity
              onPress={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200"
            >
              <Text className="text-xs font-semibold text-slate-600">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={creating}
              className="px-5 py-2.5 rounded-xl bg-blue-500"
            >
              <Text className="text-xs font-semibold text-white">
                {creating ? "Publishing..." : "Publish Resource"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isLoading ? (
        <View className="p-10 bg-white rounded-2xl border border-slate-200 items-center mt-3">
          <ActivityIndicator size="small" color="#007BFF" />
          <Text className="text-xs text-slate-400 mt-2">
            LOADING COURSE MATERIALS...
          </Text>
        </View>
      ) : materials.length === 0 ? (
        <View className="p-10 bg-white rounded-2xl border border-slate-200 items-center mt-3">
          <BookOpen size={32} color="#CBD5E1" />
          <Text className="text-sm font-bold text-slate-800 mt-2 mb-1">
            No Course Materials Published
          </Text>
          <Text className="text-xs text-slate-500 text-center">
            Upload or link lecture slides and reading notes for enrolled
            students.
          </Text>
        </View>
      ) : (
        <View className="space-y-3 mt-3">
          {materials.map((m) => (
            <View
              key={m.id}
              className="p-4 bg-white rounded-2xl border border-slate-200 flex-row items-center justify-between gap-3 mb-2.5"
            >
              <View className="flex-row items-start gap-3 flex-1">
                <View className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/60 items-center justify-center">
                  <FileText size={18} color="#0069D9" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <View className="px-2 py-0.5 rounded bg-slate-100">
                      <Text className="text-[10px] font-bold uppercase text-slate-700">
                        {m.type}
                      </Text>
                    </View>
                    <Text className="text-[11px] text-slate-400">
                      {m.created_at
                        ? new Date(m.created_at).toLocaleDateString()
                        : ""}
                    </Text>
                  </View>
                  <Text
                    className="text-sm font-bold text-slate-900 mt-1"
                    numberOfLines={1}
                  >
                    {m.title}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleOpenLink(m.file_url)}
                    className="flex-row items-center gap-1 mt-1"
                  >
                    <Text className="text-xs text-blue-600 font-semibold">
                      Open Resource
                    </Text>
                    <ExternalLink size={12} color="#0069D9" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => handleDelete(m.id, m.title)}
                className="p-2 rounded-lg bg-rose-50"
              >
                <Trash2 size={15} color="#E11D48" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export function QuizzesAndGradesPanel({ sessionId }: { sessionId: string }) {
  const { data, isLoading } = useGetSessionQuizzesQuery(sessionId);
  const [createQuiz, { isLoading: creating }] = useCreateSessionQuizMutation();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState("graded");
  const [durationMinutes, setDurationMinutes] = useState("15");
  const [totalMarks, setTotalMarks] = useState("20");
  const [questionText, setQuestionText] = useState("");
  const [optionsText, setOptionsText] = useState("Option A, Option B, Option C");
  const [correctAnswer, setCorrectAnswer] = useState("Option A");
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);

  const quizzes: any[] = data?.quizzes || [];

  const handleCreateQuiz = async () => {
    if (!title.trim()) {
      Alert.alert("Validation", "Please provide a quiz title.");
      return;
    }
    const opts = optionsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const questions = questionText.trim()
      ? [
          {
            question: questionText.trim(),
            options: opts,
            correct_answer: correctAnswer.trim() || opts[0] || "",
            points: Number(totalMarks) || 10,
          },
        ]
      : [];

    try {
      await createQuiz({
        sessionId,
        title: title.trim(),
        mode,
        duration_minutes: Number(durationMinutes) || 15,
        total_marks: Number(totalMarks) || 20,
        questions,
      }).unwrap();
      setTitle("");
      setQuestionText("");
      setShowForm(false);
    } catch (err: any) {
      Alert.alert("Quiz Error", err?.data?.error || "Failed to schedule quiz.");
    }
  };

  return (
    <View className="space-y-4">
      <View className="flex-row items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/90">
        <View className="flex-1 pr-3">
          <Text className="text-sm font-bold text-slate-900">
            Pop Quizzes & Grade Analytics
          </Text>
          <Text className="text-xs text-slate-500 mt-0.5">
            Schedule timed assessments for CoursePass students and audit grades.
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowForm(!showForm)}
          className="flex-row items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-500"
        >
          <Plus size={15} color="#FFFFFF" />
          <Text className="text-white text-xs font-semibold">New Quiz</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View className="bg-white p-5 rounded-2xl border border-slate-200 mt-3 space-y-3">
          <View className="mb-3">
            <Text className="text-xs font-semibold text-slate-700 mb-1 uppercase">
              Quiz Title
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Pop Quiz #1 — Biometric Thresholds"
              placeholderTextColor="#94A3B8"
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3.5 py-2 text-sm text-slate-900"
            />
          </View>

          <View className="flex-row gap-2 mb-3">
            <View className="flex-1">
              <Text className="text-xs font-semibold text-slate-700 mb-1 uppercase">
                Mode
              </Text>
              <View className="flex-row gap-1.5">
                {["graded", "practice"].map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setMode(m)}
                    className={`flex-1 py-2 rounded-xl border items-center ${
                      mode === m
                        ? "bg-blue-500 border-blue-500"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold uppercase ${
                        mode === m ? "text-white" : "text-slate-700"
                      }`}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View className="flex-row gap-3 mb-3">
            <View className="flex-1">
              <Text className="text-xs font-semibold text-slate-700 mb-1 uppercase">
                Duration (Mins)
              </Text>
              <TextInput
                value={durationMinutes}
                onChangeText={setDurationMinutes}
                keyboardType="numeric"
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3.5 py-2 text-sm text-slate-900"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-slate-700 mb-1 uppercase">
                Total Marks
              </Text>
              <TextInput
                value={totalMarks}
                onChangeText={setTotalMarks}
                keyboardType="numeric"
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3.5 py-2 text-sm text-slate-900"
              />
            </View>
          </View>

          <View className="mb-3">
            <Text className="text-xs font-semibold text-slate-700 mb-1 uppercase">
              Sample Question Prompt
            </Text>
            <TextInput
              value={questionText}
              onChangeText={setQuestionText}
              placeholder="What is the minimum attendance threshold required?"
              placeholderTextColor="#94A3B8"
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3.5 py-2 text-sm text-slate-900"
            />
          </View>

          <View className="mb-3">
            <Text className="text-xs font-semibold text-slate-700 mb-1 uppercase">
              Options (Comma Separated)
            </Text>
            <TextInput
              value={optionsText}
              onChangeText={setOptionsText}
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3.5 py-2 text-sm text-slate-900"
            />
          </View>

          <View className="mb-4">
            <Text className="text-xs font-semibold text-slate-700 mb-1 uppercase">
              Correct Option
            </Text>
            <TextInput
              value={correctAnswer}
              onChangeText={setCorrectAnswer}
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3.5 py-2 text-sm text-slate-900"
            />
          </View>

          <View className="flex-row justify-end gap-2">
            <TouchableOpacity
              onPress={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl border border-slate-200"
            >
              <Text className="text-xs font-semibold text-slate-600">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCreateQuiz}
              disabled={creating}
              className="px-5 py-2 rounded-xl bg-blue-500"
            >
              <Text className="text-xs font-semibold text-white">
                {creating ? "Publishing..." : "Publish Quiz"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isLoading ? (
        <View className="p-10 bg-white rounded-2xl border border-slate-200 items-center mt-3">
          <ActivityIndicator size="small" color="#007BFF" />
          <Text className="text-xs text-slate-400 mt-2">
            LOADING QUIZZES...
          </Text>
        </View>
      ) : quizzes.length === 0 ? (
        <View className="p-10 bg-white rounded-2xl border border-slate-200 items-center mt-3">
          <Award size={32} color="#CBD5E1" />
          <Text className="text-sm font-bold text-slate-800 mt-2 mb-1">
            No Quizzes Scheduled
          </Text>
          <Text className="text-xs text-slate-500 text-center">
            Create a timed quiz to test classroom comprehension and view synced
            scores.
          </Text>
        </View>
      ) : (
        <View className="space-y-3 mt-3">
          {quizzes.map((q) => (
            <View
              key={q.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 mb-2.5"
            >
              <View className="flex-row items-center justify-between gap-3">
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-1">
                    <View
                      className={`px-2 py-0.5 rounded ${
                        q.mode === "graded"
                          ? "bg-blue-50 border border-blue-200"
                          : "bg-slate-100"
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold uppercase ${
                          q.mode === "graded"
                            ? "text-blue-700"
                            : "text-slate-600"
                        }`}
                      >
                        {q.mode}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Clock size={12} color="#64748B" />
                      <Text className="text-xs text-slate-500">
                        {q.duration_minutes} mins
                      </Text>
                    </View>
                    <Text className="text-xs text-slate-500">
                      {q.total_marks} pts
                    </Text>
                  </View>
                  <Text className="text-sm font-bold text-slate-900">
                    {q.title}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    setSelectedQuizId(selectedQuizId === q.id ? null : q.id)
                  }
                  className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100"
                >
                  <BarChart3 size={14} color="#334155" />
                  <Text className="text-xs font-semibold text-slate-700">
                    {q.submissions_count || 0} Subs
                  </Text>
                </TouchableOpacity>
              </View>

              {selectedQuizId === q.id && (
                <QuizAnalyticsInline sessionId={sessionId} quizId={q.id} />
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function QuizAnalyticsInline({
  sessionId,
  quizId,
}: {
  sessionId: string;
  quizId: string;
}) {
  const { data, isLoading } = useGetQuizAnalyticsQuery({ sessionId, quizId });

  if (isLoading) {
    return (
      <View className="mt-3 pt-3 border-t border-slate-100">
        <Text className="text-xs text-slate-400">
          Loading grade distribution...
        </Text>
      </View>
    );
  }

  const metrics = data?.metrics;
  const results: any[] = data?.results || [];

  return (
    <View className="mt-4 pt-4 border-t border-slate-100 space-y-3">
      {metrics && (
        <View className="flex-row flex-wrap gap-2">
          <View className="flex-1 min-w-[45%] p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
            <Text className="text-[10px] text-slate-400 uppercase">
              Submissions
            </Text>
            <Text className="text-base font-bold text-slate-900">
              {metrics.submissions_count}
            </Text>
          </View>
          <View className="flex-1 min-w-[45%] p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
            <Text className="text-[10px] text-slate-400 uppercase">
              Mean Score
            </Text>
            <Text className="text-base font-bold text-blue-600">
              {metrics.average_score}
            </Text>
          </View>
          <View className="flex-1 min-w-[45%] p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
            <Text className="text-[10px] text-slate-400 uppercase">
              Highest
            </Text>
            <Text className="text-base font-bold text-emerald-600">
              {metrics.highest_score}
            </Text>
          </View>
          <View className="flex-1 min-w-[45%] p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
            <Text className="text-[10px] text-slate-400 uppercase">
              Lowest
            </Text>
            <Text className="text-base font-bold text-rose-600">
              {metrics.lowest_score}
            </Text>
          </View>
        </View>
      )}

      {results.length > 0 && (
        <View className="space-y-1.5 mt-2">
          {results.map((r) => (
            <View
              key={r.id}
              className="flex-row items-center justify-between py-2 px-3 rounded-lg bg-slate-50"
            >
              <Text className="text-xs font-medium text-slate-800">
                {r.student_name}{" "}
                <Text className="text-slate-400">({r.matric})</Text>
              </Text>
              <View className="flex-row items-center gap-1">
                <CheckCircle2 size={13} color="#10B981" />
                <Text className="text-xs font-bold text-emerald-700">
                  {r.score} / {r.max_score}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export function TimetableAndNotificationsPanel({
  sessionId,
  session,
}: {
  sessionId: string;
  session?: any;
}) {
  const { data: timetableRes, isLoading } = useGetSessionTimetableQuery(
    sessionId,
    { skip: !sessionId }
  );
  const [saveTimetable, { isLoading: savingTimetable }] =
    useSaveSessionTimetableMutation();
  const [pushNotification, { isLoading: pushingAlert }] =
    usePushLectureNotificationMutation();

  const [slots, setSlots] = useState<any[]>([
    {
      id: "slot-1",
      day: "Monday",
      start_time: "09:00",
      end_time: "11:00",
      venue: "",
      reminders: ["2h", "1h", "30m"],
    },
  ]);
  const [notifyMobileOnSave, setNotifyMobileOnSave] = useState(true);

  // Manual push notification state
  const [updateType, setUpdateType] = useState("lecture_update");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    const serverSlots = timetableRes?.data?.timetable || session?.timetable;
    if (Array.isArray(serverSlots) && serverSlots.length > 0) {
      setSlots(
        serverSlots.map((s: any, idx: number) => ({
          id: s.id || `slot-${idx + 1}`,
          day: s.day || "Monday",
          start_time: s.start_time || "09:00",
          end_time: s.end_time || "11:00",
          venue: s.venue || "",
          reminders: ["2h", "1h", "30m"],
        }))
      );
    }
  }, [timetableRes, session?.timetable]);

  const handleSetFrequency = (count: number) => {
    if (count === 1) {
      setSlots((prev) => [
        prev[0] || {
          id: "slot-1",
          day: "Monday",
          start_time: "09:00",
          end_time: "11:00",
          venue: "",
          reminders: ["2h", "1h", "30m"],
        },
      ]);
    } else if (count === 2) {
      setSlots((prev) => [
        prev[0] || {
          id: "slot-1",
          day: "Monday",
          start_time: "09:00",
          end_time: "11:00",
          venue: "",
          reminders: ["2h", "1h", "30m"],
        },
        prev[1] || {
          id: "slot-2",
          day: "Wednesday",
          start_time: "14:00",
          end_time: "16:00",
          venue: "",
          reminders: ["2h", "1h", "30m"],
        },
      ]);
    }
  };

  const handleAddSlot = () => {
    const usedDays = new Set(slots.map((s) => s.day));
    const nextDay = DAYS_OF_WEEK.find((d) => !usedDays.has(d)) || "Friday";
    setSlots((prev) => [
      ...prev,
      {
        id: `slot-${prev.length + 1}-${Date.now()}`,
        day: nextDay,
        start_time: "10:00",
        end_time: "12:00",
        venue: "",
        reminders: ["2h", "1h", "30m"],
      },
    ]);
  };

  const handleRemoveSlot = (index: number) => {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSlotChange = (index: number, field: string, value: string) => {
    setSlots((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot))
    );
  };

  const handleSaveTimetable = async () => {
    try {
      await saveTimetable({
        sessionId,
        timetable: slots,
        notify_mobile: notifyMobileOnSave,
      }).unwrap();
      Alert.alert(
        "Timetable Saved",
        notifyMobileOnSave
          ? "Course timetable saved & push notification sent to enrolled mobile users!"
          : "Course timetable saved! Automatic 2h, 1h & 30m reminders are active."
      );
    } catch (err: any) {
      Alert.alert(
        "Timetable Error",
        err?.data?.error || "Failed to save course timetable."
      );
    }
  };

  const handleQuickTemplate = (preset: {
    type: string;
    title: string;
    message: string;
  }) => {
    setUpdateType(preset.type);
    setAlertTitle(preset.title);
    setAlertMessage(preset.message);
  };

  const handlePushUpdate = async () => {
    if (!alertMessage.trim()) {
      Alert.alert("Validation", "Please enter a lecture update message.");
      return;
    }
    try {
      await pushNotification({
        sessionId,
        title:
          alertTitle.trim() ||
          `Lecture Update: ${session?.courseID || "Course"}`,
        message: alertMessage.trim(),
        update_type: updateType,
        slot: slots[0] || null,
      }).unwrap();
      Alert.alert(
        "Push Notification Dispatched",
        "All enrolled mobile users have been notified in real time."
      );
      setAlertMessage("");
      setAlertTitle("");
    } catch (err: any) {
      Alert.alert(
        "Notification Error",
        err?.data?.error || "Failed to push lecture notification."
      );
    }
  };

  return (
    <View className="space-y-4">
      {/* 1. Weekly Lecture Timetable Card */}
      <View className="bg-white rounded-2xl border border-slate-200/90 p-4 mb-3">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1 pr-2">
            <View className="flex-row items-center gap-1.5 mb-0.5">
              <Calendar size={15} color="#007BFF" />
              <Text className="text-sm font-bold text-slate-900">
                Weekly Lecture Timetable
              </Text>
            </View>
            <Text className="text-xs text-slate-500">
              Set the day(s) of the week and lecture times (once, twice, or
              multiple times per week).
            </Text>
          </View>
        </View>

        {/* Quick Frequency Presets */}
        <View className="flex-row items-center gap-2 mb-4">
          <TouchableOpacity
            onPress={() => handleSetFrequency(1)}
            className={`px-3 py-2 rounded-xl border ${
              slots.length === 1
                ? "bg-blue-500 border-blue-500"
                : "bg-slate-100 border-slate-200"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                slots.length === 1 ? "text-white" : "text-slate-700"
              }`}
            >
              Once / Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleSetFrequency(2)}
            className={`px-3 py-2 rounded-xl border ${
              slots.length === 2
                ? "bg-blue-500 border-blue-500"
                : "bg-slate-100 border-slate-200"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                slots.length === 2 ? "text-white" : "text-slate-700"
              }`}
            >
              Twice / Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAddSlot}
            className="flex-row items-center gap-1 px-3 py-2 rounded-xl bg-blue-50 border border-blue-200"
          >
            <Plus size={13} color="#0069D9" />
            <Text className="text-xs font-semibold text-blue-700">
              Add Slot
            </Text>
          </TouchableOpacity>
        </View>

        {/* Automatic Reminder Schedule Banner */}
        <View className="p-3.5 rounded-xl bg-obsidian-950 border border-slate-800 mb-4">
          <View className="flex-row items-center justify-between mb-1.5">
            <View className="flex-row items-center gap-1.5">
              <BellRing size={14} color="#60A5FA" />
              <Text className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                AUTOMATIC LECTURE REMINDERS ACTIVE
              </Text>
            </View>
          </View>
          <Text className="text-xs text-slate-300 leading-relaxed mb-2.5">
            Push notifications are automatically sent to mobile users &amp;
            lecturer before every scheduled lecture:
          </Text>
          <View className="flex-row items-center gap-2">
            {[
              { label: "2 HRS BEFORE" },
              { label: "1 HR BEFORE" },
              { label: "30 MINS BEFORE" },
            ].map((b) => (
              <View
                key={b.label}
                className="px-2.5 py-1 rounded-lg bg-blue-500/20 border border-blue-400/40"
              >
                <Text className="text-[10px] font-bold text-blue-200">
                  {b.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {isLoading ? (
          <View className="py-6 items-center">
            <ActivityIndicator size="small" color="#007BFF" />
          </View>
        ) : (
          <View className="space-y-3">
            {slots.map((slot, idx) => (
              <View
                key={slot.id || idx}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-3"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-[11px] font-bold uppercase text-blue-600">
                    Lecture Slot #{idx + 1}
                  </Text>
                  {slots.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleRemoveSlot(idx)}
                      className="p-1.5 rounded-lg bg-rose-50"
                    >
                      <Trash2 size={14} color="#E11D48" />
                    </TouchableOpacity>
                  )}
                </View>

                <Text className="text-[10px] font-semibold uppercase text-slate-500 mb-1.5">
                  Day of the Week
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mb-3"
                >
                  <View className="flex-row items-center gap-1.5">
                    {DAYS_OF_WEEK.map((d) => {
                      const active = slot.day === d;
                      return (
                        <TouchableOpacity
                          key={d}
                          onPress={() => handleSlotChange(idx, "day", d)}
                          className={`px-3 py-1.5 rounded-lg border ${
                            active
                              ? "bg-blue-500 border-blue-500"
                              : "bg-white border-slate-200"
                          }`}
                        >
                          <Text
                            className={`text-xs font-semibold ${
                              active ? "text-white" : "text-slate-700"
                            }`}
                          >
                            {d}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>

                <View className="flex-row gap-2.5 mb-2.5">
                  <View className="flex-1">
                    <Text className="text-[10px] font-semibold uppercase text-slate-500 mb-1">
                      Start Time (24h HH:MM)
                    </Text>
                    <TextInput
                      value={slot.start_time}
                      onChangeText={(v) =>
                        handleSlotChange(idx, "start_time", v)
                      }
                      placeholder="09:00"
                      placeholderTextColor="#94A3B8"
                      className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[10px] font-semibold uppercase text-slate-500 mb-1">
                      End Time (Optional)
                    </Text>
                    <TextInput
                      value={slot.end_time || ""}
                      onChangeText={(v) => handleSlotChange(idx, "end_time", v)}
                      placeholder="11:00"
                      placeholderTextColor="#94A3B8"
                      className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                    />
                  </View>
                </View>

                <View>
                  <Text className="text-[10px] font-semibold uppercase text-slate-500 mb-1">
                    Lecture Venue / Hall (Optional)
                  </Text>
                  <TextInput
                    value={slot.venue || ""}
                    onChangeText={(v) => handleSlotChange(idx, "venue", v)}
                    placeholder="e.g. ETF Hall 2 / Room 304"
                    placeholderTextColor="#94A3B8"
                    className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </View>
              </View>
            ))}

            <TouchableOpacity
              onPress={() => setNotifyMobileOnSave(!notifyMobileOnSave)}
              className="flex-row items-center gap-2 py-2"
            >
              <View
                className={`w-4 h-4 rounded border items-center justify-center ${
                  notifyMobileOnSave
                    ? "bg-blue-500 border-blue-500"
                    : "bg-white border-slate-300"
                }`}
              >
                {notifyMobileOnSave && (
                  <CheckCircle2 size={12} color="#FFFFFF" />
                )}
              </View>
              <Text className="text-xs text-slate-600 flex-1">
                Push timetable update notification to mobile users on save
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSaveTimetable}
              disabled={savingTimetable}
              className="w-full py-3 rounded-xl bg-blue-500 items-center justify-center mt-1"
            >
              <Text className="text-xs font-bold text-white">
                {savingTimetable
                  ? "Saving Timetable..."
                  : "Save Weekly Timetable"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 2. Instant Lecture Update Push Broadcast Card */}
      <View className="bg-white rounded-2xl border border-slate-200/90 p-4">
        <View className="flex-row items-center gap-1.5 mb-1">
          <Send size={15} color="#007BFF" />
          <Text className="text-sm font-bold text-slate-900">
            Push Lecture Update to Mobile Users
          </Text>
        </View>
        <Text className="text-xs text-slate-500 mb-3">
          Send an immediate push notification about venue changes, time
          reschedules, or announcements to all enrolled students.
        </Text>

        {/* Quick Templates */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-3"
        >
          <View className="flex-row items-center gap-2">
            {[
              {
                type: "starting_soon",
                label: "Starting Soon",
                title: `Lecture Starting Soon: ${
                  session?.courseID || "Course"
                }`,
                message: `Our ${
                  session?.courseID || "course"
                } lecture is starting shortly${
                  slots[0]?.venue ? ` at ${slots[0].venue}` : ""
                }. Please be seated for attendance.`,
              },
              {
                type: "venue_change",
                label: "Venue Changed",
                title: `Venue Change: ${session?.courseID || "Course"}`,
                message: `Today's ${
                  session?.courseID || "course"
                } lecture venue has been moved to `,
              },
              {
                type: "time_rescheduled",
                label: "Time Rescheduled",
                title: `Time Rescheduled: ${session?.courseID || "Course"}`,
                message: `Please note that today's ${
                  session?.courseID || "course"
                } lecture has been rescheduled to `,
              },
              {
                type: "cancelled",
                label: "Postponed",
                title: `Lecture Postponed: ${session?.courseID || "Course"}`,
                message: `Today's ${
                  session?.courseID || "course"
                } lecture has been postponed. New date/time will be communicated.`,
              },
            ].map((preset) => (
              <TouchableOpacity
                key={preset.type}
                onPress={() => handleQuickTemplate(preset)}
                className={`px-3 py-1.5 rounded-lg border ${
                  updateType === preset.type
                    ? "bg-blue-500 border-blue-500"
                    : "bg-slate-100 border-slate-200"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    updateType === preset.type ? "text-white" : "text-slate-700"
                  }`}
                >
                  {preset.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View className="mb-3">
          <Text className="text-[10px] font-semibold uppercase text-slate-500 mb-1">
            Notification Title
          </Text>
          <TextInput
            value={alertTitle}
            onChangeText={setAlertTitle}
            placeholder={`Lecture Update: ${session?.courseID || "Course"}`}
            placeholderTextColor="#94A3B8"
            className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
          />
        </View>

        <View className="mb-3">
          <Text className="text-[10px] font-semibold uppercase text-slate-500 mb-1">
            Update Message to Mobile Users
          </Text>
          <TextInput
            value={alertMessage}
            onChangeText={setAlertMessage}
            placeholder="Type your lecture update (e.g. Lecture holds at ETF Hall by 2:00 PM today)..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
            className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
          />
        </View>

        <TouchableOpacity
          onPress={handlePushUpdate}
          disabled={pushingAlert}
          className="w-full py-3 rounded-xl bg-blue-500 flex-row items-center justify-center gap-2"
        >
          <Send size={14} color="#FFFFFF" />
          <Text className="text-xs font-bold text-white">
            {pushingAlert
              ? "Pushing Notification..."
              : "Push Notification to Mobile Users"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
