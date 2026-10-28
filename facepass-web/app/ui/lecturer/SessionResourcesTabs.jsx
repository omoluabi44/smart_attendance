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
            ASSESSMENT & GRADEBOOK TELEMETRY
          </span>
          <h3 className="text-base font-bold text-slate-900">
            Scheduled Quizzes & CoursePass Grades ({quizzes.length})
          </h3>
          <p className="text-xs text-slate-500">
            Schedule timed assessments and inspect student performance synced via CoursePass webhooks.
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
              COMPUTING GRADEBOOK TELEMETRY...
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
                    WEBHOOK ACTIVE
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
