"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { montserrat } from "@/app/ui/fonts";
import {
  useGetLecturerSessionsQuery,
  useLecturerCreateCourseMutation,
  useLecturerCreateSessionMutation,
} from "@/app/lib/api/facepassApi";
import {
  PlusIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

export default function LecturerDashboard() {
  const user = useSelector((state) => state.user);
  const { data: sessionsData, isLoading, refetch } = useGetLecturerSessionsQuery();
  const [createCourse, { isLoading: creatingCourse }] = useLecturerCreateCourseMutation();
  const [createSession, { isLoading: creatingSession }] = useLecturerCreateSessionMutation();

  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);

  // Course form
  const [courseID, setCourseID] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseDesc, setCourseDesc] = useState("");

  // Session form
  const [sessionCourseID, setSessionCourseID] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [totalClasses, setTotalClasses] = useState(13);

  const sessions = sessionsData?.data || [];

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      await createCourse({
        courseID: courseID.toUpperCase().trim(),
        courseName: courseName.trim(),
        description: courseDesc.trim() || "No description",
      }).unwrap();
      toast.success("Course created!");
      setShowCourseModal(false);
      setCourseID("");
      setCourseName("");
      setCourseDesc("");
    } catch (err) {
      toast.error(err?.data?.error || "Failed to create course");
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      await createSession({
        courseID: sessionCourseID.toUpperCase().trim(),
        session_name: sessionName.trim(),
        total_expected_classes: Number(totalClasses),
      }).unwrap();
      toast.success("Session created!");
      setShowSessionModal(false);
      setSessionCourseID("");
      setSessionName("");
      setTotalClasses(13);
      refetch();
    } catch (err) {
      toast.error(err?.data?.error || "Failed to create session");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* ── Top Bar ── */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className={`${montserrat.className} text-2xl font-black text-slate-900`}>
              facePass <span className="text-blue-500">Control Room</span>
            </h1>
            <p className="text-slate-500 text-xs font-semibold mt-1 uppercase tracking-widest">
              Lecturer Dashboard
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCourseModal(true)}
              className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-200 transition"
            >
              <PlusIcon className="h-4 w-4" /> New Course
            </button>
            <button
              onClick={() => setShowSessionModal(true)}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-600 transition shadow-lg shadow-blue-200"
            >
              <PlusIcon className="h-4 w-4" /> New Session
            </button>
          </div>
        </div>
      </div>

      {/* ── Sessions Grid ── */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h2 className="text-lg font-bold text-slate-800 mb-6">Your Active Sessions</h2>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse h-48 border border-slate-100" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20">
            <AcademicCapIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-500 mb-2">No Sessions Yet</h3>
            <p className="text-slate-400 mb-6">Create a course and session to get started.</p>
            <button
              onClick={() => setShowSessionModal(true)}
              className="bg-blue-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-600 transition"
            >
              Create Your First Session
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <Link
                key={session.id}
                href={`/lecturer/${session.id}`}
                className="group bg-white rounded-2xl p-6 border border-slate-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-blue-50 p-2.5 rounded-xl">
                    <AcademicCapIcon className="h-6 w-6 text-blue-500" />
                  </div>
                  <ChevronRightIcon className="h-5 w-5 text-slate-300 group-hover:text-blue-500 transition" />
                </div>

                <h3 className="font-black text-slate-900 text-lg mb-1">
                  {session.courseID}
                </h3>
                <p className="text-slate-500 text-sm font-medium mb-4">{session.course_name}</p>

                <div className="flex items-center gap-4 text-xs font-bold text-slate-400 border-t border-slate-50 pt-4">
                  <span className="flex items-center gap-1">
                    <CalendarDaysIcon className="h-3.5 w-3.5" />
                    {session.session_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <UserGroupIcon className="h-3.5 w-3.5" />
                    {session.enrolled_students} students
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Create Course Modal ── */}
      {showCourseModal && (
        <Modal title="Create New Course" onClose={() => setShowCourseModal(false)}>
          <form onSubmit={handleCreateCourse} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Course Code</label>
              <input
                type="text"
                value={courseID}
                onChange={(e) => setCourseID(e.target.value)}
                placeholder="e.g. PHY102"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Course Name</label>
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g. Applied Electricity"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Description (optional)</label>
              <textarea
                value={courseDesc}
                onChange={(e) => setCourseDesc(e.target.value)}
                placeholder="Brief course description..."
                rows={3}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={creatingCourse}
              className="w-full bg-blue-500 text-white py-3.5 rounded-xl font-bold hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 transition"
            >
              {creatingCourse ? "Creating..." : "Create Course"}
            </button>
          </form>
        </Modal>
      )}

      {/* ── Create Session Modal ── */}
      {showSessionModal && (
        <Modal title="Create New Session" onClose={() => setShowSessionModal(false)}>
          <form onSubmit={handleCreateSession} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Course Code</label>
              <input
                type="text"
                value={sessionCourseID}
                onChange={(e) => setSessionCourseID(e.target.value)}
                placeholder="e.g. PHY102"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Academic Session</label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g. 2025/2026"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Total Expected Lectures</label>
              <input
                type="number"
                value={totalClasses}
                onChange={(e) => setTotalClasses(e.target.value)}
                min={1}
                max={100}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={creatingSession}
              className="w-full bg-blue-500 text-white py-3.5 rounded-xl font-bold hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 transition"
            >
              {creatingSession ? "Creating..." : "Create Session"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-xl transition"
        >
          <XMarkIcon className="h-5 w-5 text-slate-400" />
        </button>
        <h2 className="text-xl font-black text-slate-900 mb-6">{title}</h2>
        {children}
      </div>
    </div>
  );
}
