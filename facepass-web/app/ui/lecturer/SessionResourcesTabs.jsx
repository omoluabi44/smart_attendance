"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FileText,
  Plus,
  Trash2,
  ExternalLink,
  BookOpen,
  Award,
  BarChart3,
  Clock,
  CheckCircle2,
  Link as LinkIcon,
  Video,
  FileCode,
  X,
  Calendar,
  Bell,
  Send,
  MapPin,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function CourseMaterialsPanel({ sessionId, accessToken }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [materialType, setMaterialType] = useState("pdf");
  const [fileUrl, setFileUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_URL}lecturer/sessions/${sessionId}/materials`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setMaterials(Array.isArray(res.data) ? res.data : []);
    } catch {
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  }, [sessionId, accessToken]);

  useEffect(() => {
    if (sessionId && accessToken) {
      fetchMaterials();
    }
  }, [sessionId, accessToken, fetchMaterials]);

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await axios.post(
        `${API_URL}lecturer/sessions/${sessionId}/materials`,
        {
          title: title.trim(),
          description: description.trim(),
          material_type: materialType,
          file_url: fileUrl.trim(),
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      toast.success("Course material published to CoursePass roster.");
      setShowAddModal(false);
      setTitle("");
      setDescription("");
      setMaterialType("pdf");
      setFileUrl("");
      fetchMaterials();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to publish material");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (materialId) => {
    try {
      await axios.delete(
        `${API_URL}lecturer/sessions/${sessionId}/materials/${materialId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      toast.success("Material removed");
      setMaterials((prev) => prev.filter((m) => m.id !== materialId));
    } catch {
      toast.error("Failed to delete material");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90">
        <div>
          <span className="text-[11px] font-sans text-blue-600 font-semibold uppercase tracking-wider">
            COURSEPASS RESOURCE SYNC
          </span>
          <h3 className="text-base font-bold text-slate-900">
            Lecture Notes & Course Materials ({materials.length})
          </h3>
          <p className="text-xs text-slate-500">
            Publish slides, reading links, and syllabi for enrolled students.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[42px] w-full sm:w-auto rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold transition shrink-0 shadow-md shadow-blue-500/20"
        >
          <Plus className="w-3.5 h-3.5 text-white" />
          Publish Material
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center text-xs font-sans text-slate-400 animate-pulse">
          LOADING COURSE MATERIALS...
        </div>
      ) : materials.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-800 mb-1">
            No Course Materials Published Yet
          </h4>
          <p className="text-xs text-slate-500 mb-4 max-w-md mx-auto">
            Upload lecture slides, PDF handouts, or reference URLs so enrolled students can access them directly in CoursePass.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 transition shadow-md shadow-blue-500/20"
          >
            + Publish First Material
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {materials.map((mat) => (
            <div
              key={mat.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 flex flex-col justify-between hover:border-blue-500/40 transition"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 font-sans text-[10px] uppercase font-bold text-blue-700">
                    {mat.material_type || "DOCUMENT"}
                  </span>
                  <button
                    onClick={() => handleDelete(mat.id)}
                    title="Delete Material"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  {mat.title}
                </h4>
                {mat.description && (
                  <p className="text-xs text-slate-500 mb-4 line-clamp-2">
                    {mat.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-sans text-[11px] text-slate-400">
                  {mat.created_at
                    ? new Date(mat.created_at).toLocaleDateString()
                    : "Synced"}
                </span>
                {mat.file_url ? (
                  <a
                    href={mat.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Open Resource
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="text-slate-400 text-[11px] font-sans">
                    CATALOG ITEM
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-obsidian-950/60 backdrop-blur-xs p-0 sm:p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl border border-slate-200 w-full max-w-md max-h-[92dvh] overflow-y-auto p-5 sm:p-7 pb-safe shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 sm:top-5 right-4 sm:right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-[11px] font-sans text-blue-600 font-semibold uppercase mb-1 pr-8">
              COURSE MATERIALS // UPLOAD
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-5 pr-8">
              Publish Course Material
            </h3>

            <form onSubmit={handleAddMaterial} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Material Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Week 4 Lecture Slides — Eigenfaces & CNNs"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white px-3.5 py-2.5 text-base sm:text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Format Type
                </label>
                <select
                  value={materialType}
                  onChange={(e) => setMaterialType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white px-3.5 py-2.5 text-base sm:text-sm outline-none focus:border-blue-500"
                >
                  <option value="pdf">PDF Document / Lecture Note</option>
                  <option value="slides">Presentation Slides (PPTX)</option>
                  <option value="video">Recorded Lecture Video Link</option>
                  <option value="link">External Reading / Repository Link</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Resource URL / Document Link
                </label>
                <input
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white px-3.5 py-2.5 text-base sm:text-sm font-sans outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Notes / Instructions
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Required reading prior to next week's assessment..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white px-3.5 py-2.5 text-base sm:text-sm outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 min-h-[42px] rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 min-h-[42px] rounded-xl bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 disabled:bg-slate-300 shadow-md shadow-blue-500/20"
                >
                  {submitting ? "Publishing..." : "Publish Material"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function QuizzesAndGradesPanel({ sessionId, accessToken }) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [title, setTitle] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [scheduledAt, setScheduledAt] = useState("");
  const [isGraded, setIsGraded] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedQuizAnalytics, setSelectedQuizAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const fetchQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_URL}lecturer/sessions/${sessionId}/quizzes`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setQuizzes(Array.isArray(res.data) ? res.data : []);
    } catch {
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  }, [sessionId, accessToken]);

  useEffect(() => {
    if (sessionId && accessToken) {
      fetchQuizzes();
    }
  }, [sessionId, accessToken, fetchQuizzes]);

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await axios.post(
        `${API_URL}lecturer/sessions/${sessionId}/quizzes`,
        {
          title: title.trim(),
          duration_minutes: Number(durationMinutes) || 30,
          is_graded: isGraded,
          scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      toast.success("Quiz scheduled and synced with CoursePass.");
      setShowCreateModal(false);
      setTitle("");
      setDurationMinutes(30);
      setScheduledAt("");
      fetchQuizzes();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to schedule quiz");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInspectAnalytics = async (quizId) => {
    try {
      setLoadingAnalytics(true);
      const res = await axios.get(
        `${API_URL}lecturer/sessions/${sessionId}/quizzes/${quizId}/analytics`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setSelectedQuizAnalytics(res.data);
    } catch {
      toast.error("Unable to load quiz analytics");
    } finally {
      setLoadingAnalytics(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90">
        <div>
          <span className="text-[11px] font-sans text-emerald-600 font-semibold uppercase tracking-wider">
            ASSESSMENTS & GRADEBOOK
          </span>
          <h3 className="text-base font-bold text-slate-900">
            Scheduled Quizzes & CoursePass Grades ({quizzes.length})
          </h3>
          <p className="text-xs text-slate-500">
            Schedule timed assessments and view student performance synced directly with CoursePass.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[42px] w-full sm:w-auto rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold transition shrink-0 shadow-md shadow-blue-500/20"
        >
          <Plus className="w-3.5 h-3.5 text-white" />
          Schedule Quiz
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center text-xs font-sans text-slate-400 animate-pulse">
          LOADING ASSESSMENT SCHEDULE...
        </div>
      ) : quizzes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center">
          <Award className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-800 mb-1">
            No Quizzes Scheduled for This Session
          </h4>
          <p className="text-xs text-slate-500 mb-4 max-w-md mx-auto">
            Create a timed quiz to track student comprehension alongside their biometric attendance records.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 transition shadow-md shadow-blue-500/20"
          >
            + Schedule First Quiz
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 flex flex-col justify-between hover:border-blue-500/40 transition"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 font-sans text-[10px] uppercase font-bold">
                    {quiz.status || "SCHEDULED"}
                  </span>
                  <span className="text-xs font-sans text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {quiz.duration_minutes || 30} mins
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  {quiz.title}
                </h4>
                <p className="text-xs font-sans text-slate-400 mb-4">
                  {quiz.scheduled_at
                    ? `Scheduled: ${new Date(quiz.scheduled_at).toLocaleString()}`
                    : "Flexible window • Graded via CoursePass"}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-sans text-slate-500">
                  {quiz.is_graded ? "GRADED ASSESSMENT" : "PRACTICE QUIZ"}
                </span>
                <button
                  onClick={() => handleInspectAnalytics(quiz.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-500 text-slate-700 hover:text-white text-xs font-semibold transition"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  View Analytics
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Analytics Drawer/Card if selected */}
      {(loadingAnalytics || selectedQuizAnalytics) && (
        <div className="bg-obsidian-950 text-white rounded-2xl border border-slate-800 p-4 sm:p-6 relative">
          <button
            onClick={() => setSelectedQuizAnalytics(null)}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
          {loadingAnalytics ? (
            <div className="py-6 text-center text-xs font-sans text-blue-400 animate-pulse">
              LOADING GRADEBOOK...
            </div>
          ) : (
            <div>
              <span className="text-[10px] font-sans text-blue-400 uppercase tracking-wider">
                QUIZ ANALYTICS // COURSEPASS SYNC
              </span>
              <h4 className="text-base sm:text-lg font-bold text-white mt-0.5 mb-4 pr-8">
                {selectedQuizAnalytics.quiz_title}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-2">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="block text-[10px] font-sans text-slate-400">
                    TOTAL SUBMISSIONS
                  </span>
                  <span className="text-xl font-sans font-bold text-white">
                    {selectedQuizAnalytics.total_submissions}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="block text-[10px] font-sans text-slate-400">
                    AVERAGE SCORE
                  </span>
                  <span className="text-xl font-sans font-bold text-emerald-400">
                    {Number(selectedQuizAnalytics.average_score || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="block text-[10px] font-sans text-slate-400">
                    SYNC CHANNEL
                  </span>
                  <span className="text-sm font-sans font-bold text-blue-400">
                    SYNC ACTIVE
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Schedule Quiz Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-obsidian-950/60 backdrop-blur-xs p-0 sm:p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl border border-slate-200 w-full max-w-md max-h-[92dvh] overflow-y-auto p-5 sm:p-7 pb-safe shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 sm:top-5 right-4 sm:right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-[11px] font-sans text-blue-600 font-semibold uppercase mb-1 pr-8">
              ASSESSMENT // SCHEDULE QUIZ
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-5 pr-8">
              Schedule Session Quiz
            </h3>

            <form onSubmit={handleCreateQuiz} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Assessment Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mid-Semester Biometrics & Vision Quiz"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white px-3.5 py-2.5 text-base sm:text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    required
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white px-3.5 py-2.5 text-base sm:text-sm font-sans outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Grading Mode
                  </label>
                  <select
                    value={isGraded ? "graded" : "practice"}
                    onChange={(e) => setIsGraded(e.target.value === "graded")}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white px-3.5 py-2.5 text-base sm:text-sm outline-none focus:border-blue-500"
                  >
                    <option value="graded">Graded Assessment</option>
                    <option value="practice">Unscored Practice</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Scheduled Date & Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white px-3.5 py-2.5 text-base sm:text-sm font-sans outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 min-h-[42px] rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 min-h-[42px] rounded-xl bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 disabled:bg-slate-300 shadow-md shadow-blue-500/20"
                >
                  {submitting ? "Scheduling..." : "Schedule Quiz"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function TimetableAndNotificationsPanel({
  sessionId,
  accessToken,
  courseID,
  courseName,
  initialTimetable = [],
  onTimetableSaved,
}) {
  const [slots, setSlots] = useState(() =>
    Array.isArray(initialTimetable) && initialTimetable.length > 0
      ? initialTimetable
      : [{ id: "slot-1", day: "Monday", start_time: "09:00", end_time: "11:00", venue: "" }]
  );
  const [notifyOnSave, setNotifyOnSave] = useState(true);
  const [savingTimetable, setSavingTimetable] = useState(false);

  // Push Notification Broadcast state
  const [updateType, setUpdateType] = useState("lecture_update");
  const [pushTitle, setPushTitle] = useState("");
  const [pushMessage, setPushMessage] = useState("");
  const [pushVenue, setPushVenue] = useState("");
  const [pushTime, setPushTime] = useState("");
  const [sendingPush, setSendingPush] = useState(false);

  const fetchTimetable = useCallback(async () => {
    try {
      const res = await axios.get(
        `${API_URL}lecturer/sessions/${sessionId}/timetable`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (Array.isArray(res.data?.timetable) && res.data.timetable.length > 0) {
        setSlots(res.data.timetable);
      }
    } catch {
      // fallback to initialTimetable
    }
  }, [sessionId, accessToken]);

  useEffect(() => {
    if (sessionId && accessToken) {
      fetchTimetable();
    }
  }, [sessionId, accessToken, fetchTimetable]);

  const handleSetFrequencyPreset = (count) => {
    if (count === 1) {
      setSlots((prev) => [
        prev[0] || { id: "slot-1", day: "Monday", start_time: "09:00", end_time: "11:00", venue: "" },
      ]);
    } else if (count === 2) {
      setSlots((prev) => [
        prev[0] || { id: "slot-1", day: "Monday", start_time: "09:00", end_time: "11:00", venue: "" },
        prev[1] || { id: "slot-2", day: "Thursday", start_time: "14:00", end_time: "16:00", venue: "" },
      ]);
    }
  };

  const handleAddSlot = () => {
    setSlots((prev) => [
      ...prev,
      {
        id: `slot-${Date.now()}`,
        day: prev.length === 1 ? "Thursday" : "Wednesday",
        start_time: "10:00",
        end_time: "12:00",
        venue: "",
      },
    ]);
  };

  const handleRemoveSlot = (index) => {
    setSlots((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSlotChange = (index, field, value) => {
    setSlots((prev) =>
      prev.map((slot, idx) => (idx === index ? { ...slot, [field]: value } : slot))
    );
  };

  const handleSaveTimetable = async (e) => {
    e.preventDefault();
    try {
      setSavingTimetable(true);
      const res = await axios.put(
        `${API_URL}lecturer/sessions/${sessionId}/timetable`,
        {
          timetable: slots,
          notify_students: notifyOnSave,
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (Array.isArray(res.data?.timetable)) {
        setSlots(res.data.timetable);
      }
      toast.success(
        notifyOnSave
          ? "Timetable saved & pushed to CoursePass mobile users!"
          : "Course timetable saved!"
      );
      if (onTimetableSaved) onTimetableSaved();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to save course timetable");
    } finally {
      setSavingTimetable(false);
    }
  };

  const handleSendPushUpdate = async (e) => {
    e.preventDefault();
    if (!pushMessage.trim()) {
      toast.error("Please enter a notification message for mobile users.");
      return;
    }
    try {
      setSendingPush(true);
      await axios.post(
        `${API_URL}lecturer/sessions/${sessionId}/notify`,
        {
          title:
            pushTitle.trim() ||
            `📢 ${courseID || "Course"} Lecture Update`,
          message: pushMessage.trim(),
          update_type: updateType,
          slot: {
            venue: pushVenue.trim() || undefined,
            start_time: pushTime.trim() || undefined,
          },
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      toast.success("Push notification sent to enrolled mobile users!");
      setPushTitle("");
      setPushMessage("");
      setPushVenue("");
      setPushTime("");
    } catch (err) {
      toast.error(
        err?.response?.data?.error || "Failed to push lecture notification"
      );
    } finally {
      setSendingPush(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-12 gap-5">
      {/* Left Column: Course Weekly Timetable Builder (7 cols) */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 space-y-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[11px] font-sans text-blue-600 font-semibold uppercase tracking-wider">
              WEEKLY LECTURE TIMETABLE // AUTO-REMINDERS
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              {courseID} Weekly Schedule Setup
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure the day(s) of the week and time for this course. If the lecture holds twice a week, select <strong>Twice a Week</strong> or add multiple slots.
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => handleSetFrequencyPreset(1)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                slots.length === 1
                  ? "bg-blue-500 text-white border-blue-500 shadow-xs"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              Once / Week
            </button>
            <button
              type="button"
              onClick={() => handleSetFrequencyPreset(2)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                slots.length === 2
                  ? "bg-blue-500 text-white border-blue-500 shadow-xs"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              Twice / Week
            </button>
          </div>
        </div>

        {/* Automatic Reminder Banner */}
        <div className="rounded-xl bg-obsidian-950 text-white p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-400 shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-sans uppercase tracking-wider text-blue-400 font-bold">
                AUTOMATIC LECTURE REMINDERS ACTIVE
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Push notifications are automatically sent to you and enrolled mobile users before each scheduled class:
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-2.5 py-1 rounded-md bg-blue-500/20 border border-blue-400/30 text-[11px] font-sans font-bold text-blue-300">
              2 HRS
            </span>
            <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 border border-emerald-400/30 text-[11px] font-sans font-bold text-emerald-300">
              1 HR
            </span>
            <span className="px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-400/30 text-[11px] font-sans font-bold text-amber-300">
              30 MINS
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveTimetable} className="space-y-4">
          <div className="space-y-3">
            {slots.map((slot, index) => (
              <div
                key={slot.id || index}
                className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-sans font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    Lecture Slot #{index + 1}
                  </span>
                  {slots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSlot(index)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
                      Day of Week
                    </label>
                    <select
                      value={slot.day || "Monday"}
                      onChange={(e) =>
                        handleSlotChange(index, "day", e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-blue-500"
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      required
                      value={slot.start_time || "09:00"}
                      onChange={(e) =>
                        handleSlotChange(index, "start_time", e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={slot.end_time || ""}
                      onChange={(e) =>
                        handleSlotChange(index, "end_time", e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
                      Venue / Hall
                    </label>
                    <input
                      type="text"
                      value={slot.venue || ""}
                      onChange={(e) =>
                        handleSlotChange(index, "venue", e.target.value)
                      }
                      placeholder="e.g. LT 1 / ETF Hall"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleAddSlot}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-dashed border-blue-400 bg-blue-50/50 hover:bg-blue-50 text-blue-700 text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Another Weekly Lecture Slot
            </button>

            <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyOnSave}
                onChange={(e) => setNotifyOnSave(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Push timetable update to mobile users on save</span>
            </label>
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={savingTimetable}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[42px] rounded-xl bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              {savingTimetable ? "Saving Schedule..." : "Save Course Timetable"}
            </button>
          </div>
        </form>
      </div>

      {/* Right Column: Instant Lecture Update Push Notification to Mobile Users (5 cols) */}
      <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 space-y-4 shadow-2xs flex flex-col justify-between">
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-[11px] font-sans text-emerald-600 font-semibold uppercase tracking-wider">
              MOBILE PUSH BROADCAST // COURSEPASS
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Push Lecture Update to Mobile Users
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Send an immediate push notification to all enrolled students on the CoursePass mobile app about venue changes, time reschedules, or class starting now.
            </p>
          </div>

          <form onSubmit={handleSendPushUpdate} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Update Category
              </label>
              <select
                value={updateType}
                onChange={(e) => {
                  const val = e.target.value;
                  setUpdateType(val);
                  if (val === "venue_change" && !pushTitle) {
                    setPushTitle(`📍 ${courseID} Venue Change`);
                  } else if (val === "rescheduled" && !pushTitle) {
                    setPushTitle(`⏰ ${courseID} Lecture Rescheduled`);
                  } else if (val === "starting_soon" && !pushTitle) {
                    setPushTitle(`🔔 ${courseID} Lecture Starting Now`);
                  } else if (val === "cancelled" && !pushTitle) {
                    setPushTitle(`⚠️ ${courseID} Lecture Cancelled`);
                  }
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
              >
                <option value="lecture_update">General Lecture Update</option>
                <option value="venue_change">Venue / Lecture Hall Change</option>
                <option value="rescheduled">Time Rescheduled</option>
                <option value="starting_soon">Lecture Starting Soon / Live</option>
                <option value="cancelled">Lecture Cancelled / Postponed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Notification Headline
              </label>
              <input
                type="text"
                value={pushTitle}
                onChange={(e) => setPushTitle(e.target.value)}
                placeholder={`📢 ${courseID || "Course"} Lecture Update`}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white px-3.5 py-2.5 text-xs outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">
                  Updated Time (Optional)
                </label>
                <input
                  type="time"
                  value={pushTime}
                  onChange={(e) => setPushTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">
                  Venue (Optional)
                </label>
                <input
                  type="text"
                  value={pushVenue}
                  onChange={(e) => setPushVenue(e.target.value)}
                  placeholder="e.g. ETF Hall"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Message to Enrolled Students
              </label>
              <textarea
                rows={4}
                required
                value={pushMessage}
                onChange={(e) => setPushMessage(e.target.value)}
                placeholder={`e.g. Today's ${courseID || ""} lecture will hold at ETF Hall by 10:00 AM. Please be seated 10 minutes early for biometric attendance.`}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white px-3.5 py-2.5 text-xs outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={sendingPush}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[42px] rounded-xl bg-obsidian-950 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-semibold transition shadow-md"
            >
              <Send className="w-3.5 h-3.5 text-blue-400" />
              {sendingPush
                ? "Pushing to Mobile Users..."
                : "Push Notification to Mobile Users"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
