"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useAppSelector } from "@/app/lib/hooks";
import FacePassLogo from "@/app/ui/CPLogo";
import { montserrat, jetbrainsMono } from "@/app/ui/fonts";
import {
  CameraIcon,
  ShieldCheckIcon,
  CpuChipIcon,
  ChartBarIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
  ArrowsRightLeftIcon,
  LockClosedIcon,
  VideoCameraIcon,
  UserGroupIcon,
  SparklesIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  CloudArrowUpIcon,
  ClockIcon,
  BellAlertIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";

const SIMULATED_DETECTIONS = [
  {
    id: "FP-9041",
    name: "Adebayo T. Oluwaseun",
    matric: "210401014",
    dept: "Computer Engineering",
    confidence: "99.4%",
    attendanceRate: "92%",
    status: "VERIFIED",
    box: { top: "14%", left: "10%", width: "24%", height: "35%" },
  },
  {
    id: "FP-9088",
    name: "Chukwuemeka K. Nnadi",
    matric: "210401049",
    dept: "Mechanical Engineering",
    confidence: "98.8%",
    attendanceRate: "84%",
    status: "VERIFIED",
    box: { top: "18%", left: "40%", width: "23%", height: "34%" },
  },
  {
    id: "FP-9102",
    name: "Zainab M. Ibrahim",
    matric: "210401082",
    dept: "Electrical Engineering",
    confidence: "99.1%",
    attendanceRate: "71%",
    status: "AT_RISK",
    box: { top: "15%", left: "69%", width: "22%", height: "34%" },
  },
];

const SIMULATED_MATERIALS = [
  {
    id: "MAT-01",
    title: "GET201_Thermodynamics_Laws_Week4.pdf",
    type: "PDF • 4.2 MB",
    delivered: "142 / 142 Students",
    time: "Published 10m ago",
  },
  {
    id: "MAT-02",
    title: "Carnot_Cycle_Solved_Problems.docx",
    type: "DOCX • 1.8 MB",
    delivered: "142 / 142 Students",
    time: "Published 2d ago",
  },
  {
    id: "MAT-03",
    title: "Lab_Safety_&_Steam_Tables_Reference.pdf",
    type: "PDF • 6.5 MB",
    delivered: "142 / 142 Students",
    time: "Published 1w ago",
  },
];

const SIMULATED_QUIZZES = [
  {
    id: "QZ-104",
    title: "Mid-Semester Continuous Assessment (CA 1)",
    duration: "20 Mins • 15 Questions",
    submissions: "134 / 142 Submitted",
    avgScore: "82.4%",
    status: "ACTIVE WINDOW",
  },
  {
    id: "QZ-101",
    title: "Week 2 Pop Quiz: Zeroth & First Law",
    duration: "10 Mins • 10 Questions",
    submissions: "140 / 142 Graded",
    avgScore: "78.9%",
    status: "COMPLETED",
  },
];

export default function FacePassLanding() {
  const isLoggedIn = useAppSelector((state) => state?.user?.isLoggedIn);
  const [activeHeroFeature, setActiveHeroFeature] = useState("attendance"); // 'attendance' | 'materials' | 'quizzes'
  const [scanMode, setScanMode] = useState("classroom"); // 'classroom' | 'intruder'

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 selection:bg-blue-500/20 selection:text-blue-900">
      {/* Sticky Precision Glass Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/85 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
          <Link href="/" className="focus:outline-none">
            <FacePassLogo theme="light" size="md" />
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-500 transition-colors">
              Platform Suite
            </a>
            <a href="#engagement" className="hover:text-blue-500 transition-colors">
              Materials & Quizzes
            </a>
            <a href="#workflow" className="hover:text-blue-500 transition-colors">
              Lecturer Workflow
            </a>
            <a href="#privacy" className="hover:text-blue-500 transition-colors">
              Biometric Privacy
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200/80">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span
                className={`${jetbrainsMono.className} text-[11px] font-medium text-blue-700`}
              >
                CV ENGINE • ONLINE
              </span>
            </div>

            {isLoggedIn ? (
              <Link
                href="/lecturer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-all shadow-md shadow-blue-500/25"
              >
                Lecturer Command Center
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-all shadow-md shadow-blue-500/25"
              >
                Lecturer Sign In
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION: Full Lecturer OS + Interactive 3-Mode Simulator */}
      <section className="relative overflow-hidden bg-vision-grid pt-12 pb-24 lg:pt-20 lg:pb-28 border-b border-slate-200/80">
        {/* Ambient Brand Blue Glow */}
        <div className="pointer-events-none absolute -top-24 left-1/4 w-[620px] h-[420px] bg-blue-400/15 rounded-full blur-[130px]" />
        <div className="pointer-events-none absolute top-36 right-10 w-[480px] h-[420px] bg-blue-500/10 rounded-full blur-[120px]" />

        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            {/* Left Column: Complete Lecturer Value Proposition */}
            <div className="lg:col-span-6 space-y-7">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-blue-500" />
                <span
                  className={`${jetbrainsMono.className} text-xs font-semibold uppercase tracking-wider text-blue-700`}
                >
                  AI Attendance • Course Materials • Live Quizzes
                </span>
              </div>

              <h1
                className={`${montserrat.className} text-4xl sm:text-5xl lg:text-[3.45rem] font-extrabold text-slate-950 tracking-tight leading-[1.08]`}
              >
                The Complete AI Command Center for{" "}
                <span className="text-blue-500">University Lecturers.</span>
              </h1>

              <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                More than just attendance. Verify{" "}
                <span className="font-semibold text-slate-900">100+ students in seconds</span> via our{" "}
                <span className="font-semibold text-blue-600">1:N Computer Vision Engine</span>,{" "}
                <span className="font-semibold text-slate-900">
                  distribute lecture materials & PDFs
                </span>{" "}
                directly to enrolled students,{" "}
                <span className="font-semibold text-slate-900">schedule timed quizzes</span> with
                auto-grading, and audit <span className="font-semibold text-slate-900">75% exam eligibility</span>.
              </p>

              {/* Quick Capability Pills */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { icon: CameraIcon, label: "1:N Computer Vision Attendance" },
                  { icon: DocumentTextIcon, label: "Instant Material & Slide Sharing" },
                  { icon: ClipboardDocumentCheckIcon, label: "Scheduled Quizzes & Auto-Grading" },
                  { icon: ChartBarIcon, label: "75% Exam Eligibility Audit" },
                ].map((pill, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200/90 text-xs font-semibold text-slate-700 shadow-sm"
                  >
                    <pill.icon className="w-3.5 h-3.5 text-blue-500" />
                    {pill.label}
                  </span>
                ))}
              </div>

              {/* Action CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <Link
                  href={isLoggedIn ? "/lecturer" : "/login"}
                  className="inline-flex items-center justify-center gap-3 px-7 py-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-base transition-all shadow-lg shadow-blue-500/25 group"
                >
                  <span>{isLoggedIn ? "Open Lecturer Dashboard" : "Sign In to Lecturer Workspace"}</span>
                  <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <a
                  href="#engagement"
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white hover:bg-blue-50/50 text-slate-800 border border-slate-200/90 hover:border-blue-300 font-semibold text-base transition-all shadow-sm"
                >
                  Explore Materials & Quizzes
                </a>
              </div>

              {/* Key Telemetry Metrics Bar */}
              <div className="pt-5 border-t border-slate-200/80 grid grid-cols-3 gap-6 max-w-lg">
                <div>
                  <p
                    className={`${jetbrainsMono.className} text-2xl font-bold text-slate-950`}
                  >
                    &lt;1.8s
                  </p>
                  <p className="text-xs font-medium text-slate-500 mt-1">
                    1:N Computer Vision Scan
                  </p>
                </div>
                <div>
                  <p
                    className={`${jetbrainsMono.className} text-2xl font-bold text-blue-500`}
                  >
                    Instant
                  </p>
                  <p className="text-xs font-medium text-slate-500 mt-1">
                    Notes & Quiz Broadcast
                  </p>
                </div>
                <div>
                  <p
                    className={`${jetbrainsMono.className} text-2xl font-bold text-emerald-600`}
                  >
                    75.0%
                  </p>
                  <p className="text-xs font-medium text-slate-500 mt-1">
                    Auto Eligibility Audit
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive 3-Tab Lecturer Command HUD */}
            <div className="lg:col-span-6">
              <div className="relative rounded-2xl bg-obsidian-950 border border-obsidian-700 shadow-[0_28px_70px_-15px_rgba(0,41,87,0.5)] overflow-hidden text-slate-100">
                {/* Top HUD Bar */}
                <div className="px-4 py-3 bg-obsidian-900 border-b border-obsidian-700 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                    <span
                      className={`${jetbrainsMono.className} ml-2 text-[11px] text-blue-300 tracking-wider`}
                    >
                      SESSION: GET201_2026_SEM1 // 142 ENROLLED
                    </span>
                  </div>

                  {/* Interactive 3-Module Switcher */}
                  <div className="flex items-center bg-obsidian-950 p-1 rounded-lg border border-obsidian-700 text-[11px] font-sans">
                    <button
                      type="button"
                      onClick={() => setActiveHeroFeature("attendance")}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        activeHeroFeature === "attendance"
                          ? "bg-blue-500 text-white font-semibold shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      1:N Vision Scan
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveHeroFeature("materials")}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        activeHeroFeature === "materials"
                          ? "bg-blue-500 text-white font-semibold shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Course Materials
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveHeroFeature("quizzes")}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        activeHeroFeature === "quizzes"
                          ? "bg-blue-500 text-white font-semibold shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Live Quizzes
                    </button>
                  </div>
                </div>

                {/* TAB 1: COMPUTER VISION ATTENDANCE */}
                {activeHeroFeature === "attendance" && (
                  <>
                    <div className="relative h-[305px] bg-vision-grid-dark overflow-hidden p-5 flex flex-col justify-between">
                      {/* Animated Laser Scanline */}
                      <div className="pointer-events-none absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_16px_#3395FF] animate-scanline z-20" />

                      {/* Sub-Header Telemetry & Intruder Toggle */}
                      <div className="relative z-10 flex items-center justify-between text-[11px] font-sans text-slate-400">
                        <span className="inline-flex items-center gap-1.5 text-blue-400">
                          <CpuChipIcon className="w-4 h-4" />
                          CV_ENGINE: MULTI-FACE VECTOR MATCH
                        </span>
                        <div className="flex items-center gap-1 bg-obsidian-900/90 border border-obsidian-700 rounded-md p-0.5">
                          <button
                            type="button"
                            onClick={() => setScanMode("classroom")}
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              scanMode === "classroom"
                                ? "bg-blue-500/25 text-blue-300 border border-blue-400/40"
                                : "text-slate-400 hover:text-white"
                            }`}
                          >
                            Roster Match
                          </button>
                          <button
                            type="button"
                            onClick={() => setScanMode("intruder")}
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              scanMode === "intruder"
                                ? "bg-rose-500/25 text-rose-300 border border-rose-400/40"
                                : "text-slate-400 hover:text-white"
                            }`}
                          >
                            Intruder Alert
                          </button>
                        </div>
                      </div>

                      {/* Bounding Box Detection Simulation */}
                      <div className="relative my-auto h-[185px] w-full">
                        {SIMULATED_DETECTIONS.map((det) => (
                          <div
                            key={det.id}
                            style={det.box}
                            className={`absolute rounded-xl border ${
                              det.status === "AT_RISK"
                                ? "border-amber-400/80 bg-amber-500/10"
                                : "border-emerald-400/80 bg-emerald-500/10"
                            } p-2.5 flex flex-col justify-between backdrop-blur-[2px] transition-all duration-300`}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`${jetbrainsMono.className} text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  det.status === "AT_RISK"
                                    ? "bg-amber-400/20 text-amber-300"
                                    : "bg-emerald-400/20 text-emerald-300"
                                }`}
                              >
                                {det.confidence}
                              </span>
                              <span
                                className={`${jetbrainsMono.className} text-[10px] text-slate-300`}
                              >
                                {det.matric}
                              </span>
                            </div>

                            <div className="my-auto flex items-center justify-center">
                              <div className="w-9 h-9 rounded-full border border-dashed border-blue-400/50 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                              </div>
                            </div>

                            <div>
                              <p className="text-[11px] font-semibold text-white truncate">
                                {det.name}
                              </p>
                              <div className="flex items-center justify-between text-[10px] font-sans mt-0.5">
                                <span className="text-slate-400">ATT: {det.attendanceRate}</span>
                                <span
                                  className={
                                    det.status === "AT_RISK"
                                      ? "text-amber-300"
                                      : "text-emerald-300"
                                  }
                                >
                                  {det.status === "AT_RISK" ? "<75% RISK" : "ELIGIBLE"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}

                        {scanMode === "intruder" && (
                          <div
                            style={{ top: "54%", left: "31%", width: "38%", height: "42%" }}
                            className="absolute rounded-xl border-2 border-rose-500 bg-rose-950/75 p-2.5 flex flex-col justify-between shadow-[0_0_25px_rgba(244,63,94,0.35)] animate-pulse"
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`${jetbrainsMono.className} text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-200`}
                              >
                                UNREGISTERED FACE
                              </span>
                              <span
                                className={`${jetbrainsMono.className} text-[10px] text-rose-300`}
                              >
                                NO MATCH
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-rose-100">
                              Excluded from GET201 Register
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Bottom Viewfinder Telemetry */}
                      <div className="relative z-10 flex items-center justify-between text-[11px] font-sans text-slate-400 pt-2 border-t border-obsidian-700/80">
                        <span>COLLECTION: facepass_course_get201</span>
                        <span className="text-emerald-400">
                          COURSEPASS WEBHOOK: DISPATCHED (200 OK)
                        </span>
                      </div>
                    </div>

                    {/* Bottom Live Roster Strip */}
                    <div className="p-4 bg-obsidian-900 border-t border-obsidian-700 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={`${jetbrainsMono.className} text-slate-400 uppercase tracking-wider text-[11px]`}
                        >
                          Live Computer Vision Verification Log
                        </span>
                        <span
                          className={`${jetbrainsMono.className} text-blue-400 text-[11px]`}
                        >
                          3 Enrolled Matched • {scanMode === "intruder" ? "1 Excluded" : "0 Excluded"}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {SIMULATED_DETECTIONS.map((student) => (
                          <div
                            key={student.id}
                            className="px-3 py-2 rounded-lg bg-obsidian-950 border border-obsidian-700 flex items-center justify-between"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-white truncate">
                                {student.name}
                              </p>
                              <p
                                className={`${jetbrainsMono.className} text-[10px] text-slate-400`}
                              >
                                {student.matric}
                              </p>
                            </div>
                            <span
                              className={`${jetbrainsMono.className} text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                student.status === "AT_RISK"
                                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                  : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                              }`}
                            >
                              {student.attendanceRate}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* TAB 2: COURSE MATERIALS & LECTURE NOTES HUB */}
                {activeHeroFeature === "materials" && (
                  <div className="p-5 bg-vision-grid-dark min-h-[415px] flex flex-col justify-between space-y-4">
                    <div className="flex items-center justify-between border-b border-obsidian-700 pb-3">
                      <div>
                        <span
                          className={`${jetbrainsMono.className} text-[11px] text-blue-400 uppercase tracking-wider`}
                        >
                          DIRECT STUDENT MATERIAL BROADCAST
                        </span>
                        <h3 className="text-base font-bold text-white mt-0.5">
                          Share Lecture Slides, PDFs & Study Guides
                        </h3>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-sans">
                        142 Enrolled Synced
                      </span>
                    </div>

                    {/* Simulated Upload Dropzone */}
                    <div className="rounded-xl bg-obsidian-900/90 border border-dashed border-blue-400/40 p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                          <CloudArrowUpIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">
                            Publish New Course Material to GET201 Students
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Supports PDF, PPTX, DOCX • Instant notification to enrolled students
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-semibold">
                        + Upload Material
                      </span>
                    </div>

                    {/* Published Materials List */}
                    <div className="space-y-2.5">
                      {SIMULATED_MATERIALS.map((mat) => (
                        <div
                          key={mat.id}
                          className="p-3.5 rounded-xl bg-obsidian-900 border border-obsidian-700 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-blue-500/15 border border-blue-400/25 flex items-center justify-center text-blue-400 shrink-0">
                              <DocumentTextIcon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-white truncate">
                                {mat.title}
                              </p>
                              <p
                                className={`${jetbrainsMono.className} text-[10px] text-slate-400 mt-0.5`}
                              >
                                {mat.type} • {mat.time}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`${jetbrainsMono.className} text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0`}
                          >
                            {mat.delivered}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-obsidian-700 flex items-center justify-between text-[11px] font-sans text-slate-400">
                      <span>STORAGE: ENCRYPTED CLOUD VAULT</span>
                      <span className="text-blue-400">STUDENT PORTAL SYNC: REAL-TIME</span>
                    </div>
                  </div>
                )}

                {/* TAB 3: SCHEDULED QUIZZES & AUTOMATED GRADING */}
                {activeHeroFeature === "quizzes" && (
                  <div className="p-5 bg-vision-grid-dark min-h-[415px] flex flex-col justify-between space-y-4">
                    <div className="flex items-center justify-between border-b border-obsidian-700 pb-3">
                      <div>
                        <span
                          className={`${jetbrainsMono.className} text-[11px] text-blue-400 uppercase tracking-wider`}
                        >
                          TIMED ASSESSMENTS & AUTO-GRADING
                        </span>
                        <h3 className="text-base font-bold text-white mt-0.5">
                          Schedule Quizzes & Track Live Class Performance
                        </h3>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-sans">
                        Auto-Graded
                      </span>
                    </div>

                    {/* Active Scheduled Quiz Card */}
                    <div className="space-y-3">
                      {SIMULATED_QUIZZES.map((qz) => (
                        <div
                          key={qz.id}
                          className="p-4 rounded-xl bg-obsidian-900 border border-obsidian-700 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span
                                className={`${jetbrainsMono.className} text-[10px] px-2 py-0.5 rounded font-semibold ${
                                  qz.status === "ACTIVE WINDOW"
                                    ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                                }`}
                              >
                                {qz.status}
                              </span>
                              <h4 className="text-sm font-bold text-white mt-1.5">{qz.title}</h4>
                              <p
                                className={`${jetbrainsMono.className} text-[11px] text-slate-400 mt-0.5`}
                              >
                                {qz.duration}
                              </p>
                            </div>
                            <div className="text-right">
                              <p
                                className={`${jetbrainsMono.className} text-lg font-bold text-blue-400`}
                              >
                                {qz.avgScore}
                              </p>
                              <p className="text-[10px] text-slate-400">Class Mean</p>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-sans">
                              <span className="text-slate-400">Student Submissions</span>
                              <span className="text-white">{qz.submissions}</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-obsidian-950 overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{
                                  width: qz.status === "ACTIVE WINDOW" ? "94%" : "98.5%",
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-obsidian-700 flex items-center justify-between text-[11px] font-sans text-slate-400">
                      <span>GRADING: INSTANT SCORE MATRIX</span>
                      <span className="text-emerald-400">CSV / EXCEL GRADE EXPORT READY</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: COMPLETE ACADEMIC OPERATIONS BENTO GRID */}
      <section id="features" className="py-24 px-6 lg:px-10 max-w-7xl mx-auto">
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 mb-4">
            <SparklesIcon className="w-4 h-4 text-blue-500" />
            <span
              className={`${jetbrainsMono.className} text-xs font-semibold uppercase tracking-wider text-blue-700`}
            >
              Complete Lecturer & Classroom Suite
            </span>
          </div>
          <h2
            className={`${montserrat.className} text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight`}
          >
            Built for Attendance, Student Communication, Course Materials & Assessments.
          </h2>
          <p className="text-slate-600 mt-4 text-base leading-relaxed">
            FacePass unifies your entire lecture room workflow—combining our precision 1:N Computer
            Vision Engine with direct material distribution, scheduled quizzes, and automated 75%
            exam eligibility auditing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Card 1: 1:N Computer Vision Attendance (7 cols) */}
          <div className="md:col-span-7 rounded-2xl bg-white border border-slate-200/90 p-8 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-11 h-11 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-sm shadow-blue-500/25">
                  <CameraIcon className="w-6 h-6" />
                </div>
                <span
                  className={`${jetbrainsMono.className} text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200`}
                >
                  1:N COMPUTER VISION ENGINE
                </span>
              </div>
              <h3 className={`${montserrat.className} text-2xl font-bold text-slate-950 mb-3`}>
                Instant Group Photo, Video & Live Camera Attendance
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Capture a single classroom photo, upload a lecture walk-through video, or snap a
                live frame. Our compartmentalized per-course Computer Vision Engine matches 100+
                enrolled faces simultaneously while automatically rejecting unregistered intruders.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { code: "GROUP PHOTO", desc: "100+ faces per frame" },
                { code: "CLASS VIDEO", desc: "Async frame deduplication" },
                { code: "INTRUDER SHIELD", desc: "Blocks proxy sign-ins" },
              ].map((item) => (
                <div
                  key={item.code}
                  className="p-3 rounded-xl bg-blue-50/50 border border-blue-100"
                >
                  <p
                    className={`${jetbrainsMono.className} text-xs font-bold text-blue-600`}
                  >
                    {item.code}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Course Materials & Lecture Notes Sharing (5 cols) */}
          <div className="md:col-span-5 rounded-2xl bg-obsidian-950 text-white border border-obsidian-700 p-8 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="pointer-events-none absolute -right-12 -bottom-12 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl" />
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-11 h-11 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-400 flex items-center justify-center">
                  <DocumentTextIcon className="w-6 h-6" />
                </div>
                <span
                  className={`${jetbrainsMono.className} text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-500/15 text-blue-300 border border-blue-400/30`}
                >
                  STUDENT COMMUNICATION
                </span>
              </div>
              <h3 className={`${montserrat.className} text-2xl font-bold text-white mb-3`}>
                Send Course Materials & Slides Directly to Enrolled Students
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Upload lecture notes, PDFs, past questions, and lab manuals straight to your course
                session. Every enrolled student immediately receives the material in their student
                portal—no messy group chats required.
              </p>
            </div>

            <div className="mt-8 p-4 rounded-xl bg-obsidian-900 border border-obsidian-700 space-y-2">
              <div className="flex items-center justify-between text-xs font-sans">
                <span className="text-blue-400">BROADCAST CHANNEL</span>
                <span className="text-emerald-400">100% DELIVERED</span>
              </div>
              <p className="text-xs text-slate-300">
                Supports PDF, DOCX, PPTX & reference links scoped per course session.
              </p>
            </div>
          </div>

          {/* Card 3: Scheduled Quizzes & Auto-Grading (6 cols) */}
          <div className="md:col-span-6 rounded-2xl bg-white border border-slate-200/90 p-8 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                  <ClipboardDocumentCheckIcon className="w-6 h-6" />
                </div>
                <span
                  className={`${jetbrainsMono.className} text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200`}
                >
                  ASSESSMENTS & GRADING
                </span>
              </div>
              <h3 className={`${montserrat.className} text-xl font-bold text-slate-950 mb-2`}>
                Schedule Timed Quizzes & Continuous Assessments
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Design multiple-choice quizzes, configure start/end time windows and duration
                limits, and publish them to your class. FacePass automatically grades submissions
                and compiles class score distributions.
              </p>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs font-sans text-slate-600">
              <span className="inline-flex items-center gap-1.5 text-blue-600 font-semibold">
                <ClockIcon className="w-4 h-4" /> Timed Quiz Windows
              </span>
              <span>Instant Score Breakdown</span>
            </div>
          </div>

          {/* Card 4: 75% Eligibility & Co-Lecturer Auditing (6 cols) */}
          <div className="md:col-span-6 rounded-2xl bg-white border border-slate-200/90 p-8 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                  <ChartBarIcon className="w-6 h-6" />
                </div>
                <span
                  className={`${jetbrainsMono.className} text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200`}
                >
                  75% EXAM ELIGIBILITY
                </span>
              </div>
              <h3 className={`${montserrat.className} text-xl font-bold text-slate-950 mb-2`}>
                Automated 75% Attendance Threshold & Excel Exports
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Continuously calculates each student&apos;s attendance against total lectures held,
                isolates at-risk students below 75%, supports co-lecturer collaboration, and
                exports Senate-ready CSV/Excel sheets in one click.
              </p>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs font-sans text-slate-600">
              <span className="text-emerald-600 font-semibold">ELIGIBLE &ge; 75%</span>
              <span className="text-amber-600 font-semibold">AT-RISK &lt; 75%</span>
              <span className="text-blue-600 font-semibold">1-CLICK XLSX/CSV</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: LECTURER-TO-STUDENT ENGAGEMENT & REAL-TIME SYNC SHOWCASE */}
      <section
        id="engagement"
        className="py-24 bg-white border-y border-slate-200/80 px-6 lg:px-10"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200">
                <ArrowsRightLeftIcon className="w-4 h-4 text-blue-500" />
                <span
                  className={`${jetbrainsMono.className} text-xs font-semibold uppercase tracking-wider text-blue-700`}
                >
                  Connected Classroom Ecosystem
                </span>
              </div>
              <h2
                className={`${montserrat.className} text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight`}
              >
                Direct Communication Between Lecturer & Enrolled Students.
              </h2>
              <p className="text-slate-600 text-base leading-relaxed">
                Every action you take in FacePass—whether verifying attendance with Computer
                Vision, uploading a new lecture PDF, or scheduling a pop quiz—is synchronized
                instantly with your enrolled students.
              </p>

              <div className="space-y-4 pt-2">
                {[
                  {
                    icon: DocumentTextIcon,
                    title: "Course Material Distribution",
                    desc: "Upload lecture slides, reading lists, and lab sheets once; every enrolled student gets immediate access.",
                  },
                  {
                    icon: ClipboardDocumentCheckIcon,
                    title: "Scheduled Quiz Notifications & Live Grading",
                    desc: "Publish timed quizzes with custom deadlines and inspect student scores as soon as they submit.",
                  },
                  {
                    icon: BellAlertIcon,
                    title: "Real-Time Attendance & Eligibility Alerts",
                    desc: "Students receive instant confirmation when verified by the Computer Vision Engine and see their live 75% eligibility standing.",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3.5 p-4 rounded-xl bg-[#FAFAFA] border border-slate-200/80"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Interactive Ecosystem Bridge Diagram */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl bg-obsidian-950 border border-obsidian-700 p-6 sm:p-8 text-white shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-obsidian-700 pb-4">
                  <div>
                    <span
                      className={`${jetbrainsMono.className} text-[11px] text-blue-400 uppercase tracking-wider`}
                    >
                      REAL-TIME CLASSROOM SYNCHRONIZATION
                    </span>
                    <h3 className={`${montserrat.className} text-lg font-bold text-white mt-0.5`}>
                      FacePass Lecturer Command &harr; Enrolled Student Portal
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-sans">
                    LIVE WEBHOOKS
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-obsidian-900 border border-obsidian-700 space-y-2">
                    <span
                      className={`${jetbrainsMono.className} text-[10px] text-blue-400 uppercase`}
                    >
                      CHANNEL 01
                    </span>
                    <p className="text-sm font-bold text-white">CV Attendance Sync</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      1:N Computer Vision scan marks student present & updates 75% exam eligibility
                      counter in real time.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-obsidian-900 border border-blue-500/40 space-y-2 shadow-[0_0_25px_-8px_rgba(0,123,255,0.4)]">
                    <span
                      className={`${jetbrainsMono.className} text-[10px] text-blue-400 uppercase`}
                    >
                      CHANNEL 02
                    </span>
                    <p className="text-sm font-bold text-white">Materials Broadcast</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Lecturer uploads PDFs, notes, or slides; files appear immediately in enrolled
                      students&apos; course library.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-obsidian-900 border border-obsidian-700 space-y-2">
                    <span
                      className={`${jetbrainsMono.className} text-[10px] text-blue-400 uppercase`}
                    >
                      CHANNEL 03
                    </span>
                    <p className="text-sm font-bold text-white">Scheduled Quizzes</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Timed quizzes open on student devices at the scheduled time and return
                      auto-graded scores to the lecturer.
                    </p>
                  </div>
                </div>

                {/* Simulated Live Event Stream */}
                <div className="rounded-xl bg-obsidian-900/90 border border-obsidian-700 p-4 space-y-2.5 font-sans text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-obsidian-700 pb-2">
                    <span>LIVE ACADEMIC EVENT STREAM // GET201</span>
                    <span className="text-emerald-400">● ACTIVE</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="truncate">
                      [MATERIAL] Published &quot;Thermodynamics_Wk4_Notes.pdf&quot;
                    </span>
                    <span className="text-blue-400 shrink-0 ml-2">142 Students Notified</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="truncate">
                      [QUIZ] Scheduled &quot;Mid-Semester CA Quiz (20m)&quot;
                    </span>
                    <span className="text-amber-300 shrink-0 ml-2">Starts Friday 10:00 AM</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="truncate">
                      [CV_ENGINE] 1:N Classroom Frame Verified
                    </span>
                    <span className="text-emerald-400 shrink-0 ml-2">136 Present • 2 Excluded</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: 4-STEP LECTURER WORKFLOW */}
      <section id="workflow" className="py-24 px-6 lg:px-10 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span
            className={`${jetbrainsMono.className} text-xs font-semibold uppercase tracking-widest text-blue-600`}
          >
            OPERATIONAL WORKFLOW
          </span>
          <h2
            className={`${montserrat.className} text-3xl sm:text-4xl font-extrabold text-slate-950 mt-2 tracking-tight`}
          >
            Four Steps to Run Your Entire Course
          </h2>
          <p className="text-slate-600 mt-3 text-base">
            Designed exclusively for university lecturers—students enroll once on their student
            portal while you command attendance, materials, and quizzes from FacePass.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: "01",
              title: "Provision Course & Session",
              desc: "Create your course code (e.g., GET201), set total classes, and initialize an isolated Computer Vision collection.",
              icon: AcademicCapIcon,
            },
            {
              step: "02",
              title: "Capture CV Attendance",
              desc: "Snap a live camera frame or upload a classroom group photo/video. The Computer Vision Engine verifies enrolled students in seconds.",
              icon: VideoCameraIcon,
            },
            {
              step: "03",
              title: "Share Materials & Quizzes",
              desc: "Upload lecture PDFs/slides for enrolled students and schedule timed continuous assessment quizzes with auto-grading.",
              icon: DocumentTextIcon,
            },
            {
              step: "04",
              title: "Audit 75% & Export Grades",
              desc: "Inspect individual student dossiers, review quiz scores, flag <75% at-risk students, and export Excel/CSV reports.",
              icon: DocumentArrowDownIcon,
            },
          ].map((item) => (
            <div
              key={item.step}
              className="relative rounded-2xl bg-white border border-slate-200/90 p-7 shadow-sm hover:border-blue-300 transition-all"
            >
              <div className="flex items-center justify-between mb-6">
                <span
                  className={`${jetbrainsMono.className} text-xs font-bold px-3 py-1 rounded-full bg-blue-500 text-white`}
                >
                  STEP {item.step}
                </span>
                <item.icon className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className={`${montserrat.className} text-lg font-bold text-slate-950 mb-2`}>
                {item.title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5: BIOMETRIC PRIVACY & SECURITY */}
      <section id="privacy" className="py-20 px-6 lg:px-10 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-obsidian-950 text-white p-8 sm:p-12 lg:p-16 border border-obsidian-700 relative overflow-hidden">
          <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl" />

          <div className="max-w-3xl space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300">
              <LockClosedIcon className="w-4 h-4" />
              <span
                className={`${jetbrainsMono.className} text-xs uppercase tracking-wider font-semibold`}
              >
                Zero-Local-Biometrics Guarantee
              </span>
            </div>

            <h2
              className={`${montserrat.className} text-3xl sm:text-4xl font-extrabold tracking-tight`}
            >
              Strict Biometric Privacy. Zero Local Device Storage.
            </h2>

            <p className="text-slate-300 text-base leading-relaxed">
              In compliance with university data protection guardrails, classroom captures are
              streamed directly to encrypted cloud storage and processed in-memory by our
              compartmentalized Computer Vision Engine over TLS 1.3. Biometric images are never
              persisted on lecturer laptops or mobile devices.
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link
                href={isLoggedIn ? "/lecturer" : "/login"}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-500/25"
              >
                {isLoggedIn ? "Go to Lecturer Command Center" : "Sign In to Lecturer Command Center"}
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Minimalist Precision Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-10 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <FacePassLogo theme="light" size="sm" showBadge={true} />
          <p className={`${jetbrainsMono.className} text-xs text-slate-500`}>
            FACEPASS LECTURER OS • COMPUTER VISION ATTENDANCE, COURSE MATERIALS & QUIZZES
          </p>
        </div>
      </footer>
    </div>
  );
}
