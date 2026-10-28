"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useAppSelector } from "@/app/lib/hooks";
import FacePassLogo from "@/app/ui/CPLogo";
import { montserrat, jetbrainsMono } from "@/app/ui/fonts";
import FaceMeshScannerHUD from "@/app/ui/LandingPage/FaceMeshScannerHUD";
import {
  CameraIcon,
  ChartBarIcon,
  ArrowRightIcon,
  DocumentArrowDownIcon,
  ArrowsRightLeftIcon,
  LockClosedIcon,
  VideoCameraIcon,
  SparklesIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  BellAlertIcon,
  AcademicCapIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function FacePassLanding() {
  const isLoggedIn = useAppSelector((state) => state?.user?.isLoggedIn);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 selection:bg-blue-500/20 selection:text-blue-900 overflow-x-hidden">
      {/* Sticky Precision Glass Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-16 sm:h-20 flex items-center justify-between gap-2">
          <Link href="/" className="focus:outline-none shrink-0">
            <FacePassLogo theme="light" size="sm" />
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

          <div className="flex items-center gap-2 sm:gap-3">
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
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-blue-500/25"
              >
                <span className="hidden sm:inline">Lecturer Command Center</span>
                <span className="sm:hidden">Dashboard</span>
                <ArrowRightIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-blue-500/25"
              >
                <span className="hidden sm:inline">Lecturer Sign In</span>
                <span className="sm:hidden">Sign In</span>
                <ArrowRightIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="w-5 h-5" />
              ) : (
                <Bars3Icon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Collapsible Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200/80 bg-white px-4 pt-3 pb-5 space-y-3 shadow-lg">
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-blue-50/80 border border-blue-200/80">
              <span className="flex items-center gap-2 text-xs font-semibold text-blue-800">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                1:N Computer Vision Engine
              </span>
              <span className={`${jetbrainsMono.className} text-[10px] font-bold text-blue-600`}>
                ONLINE
              </span>
            </div>
            <nav className="grid grid-cols-2 gap-2 text-sm font-semibold text-slate-700">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-200/70 transition"
              >
                Platform Suite
              </a>
              <a
                href="#engagement"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-200/70 transition"
              >
                Materials & Quizzes
              </a>
              <a
                href="#workflow"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-200/70 transition"
              >
                Lecturer Workflow
              </a>
              <a
                href="#privacy"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-200/70 transition"
              >
                Biometric Privacy
              </a>
            </nav>
            <Link
              href={isLoggedIn ? "/lecturer" : "/login"}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold shadow-sm transition"
            >
              <span>{isLoggedIn ? "Open Lecturer Command Center" : "Sign In to Lecturer Workspace"}</span>
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        )}
      </header>

      {/* HERO SECTION: Full Lecturer OS + Interactive 3-Mode Simulator */}
      <section className="relative overflow-hidden bg-vision-grid pt-8 pb-16 sm:pt-12 sm:pb-24 lg:pt-20 lg:pb-28 border-b border-slate-200/80">
        {/* Ambient Brand Blue Glow */}
        <div className="pointer-events-none absolute -top-24 left-1/4 w-[620px] h-[420px] bg-blue-400/15 rounded-full blur-[130px]" />
        <div className="pointer-events-none absolute top-36 right-10 w-[480px] h-[420px] bg-blue-500/10 rounded-full blur-[120px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-10 items-center">
            {/* Left Column: Complete Lecturer Value Proposition */}
            <div className="lg:col-span-6 space-y-5 sm:space-y-7">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 shadow-sm max-w-full">
                <span className="flex h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                <span
                  className={`${jetbrainsMono.className} text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-blue-700 truncate`}
                >
                  AI Attendance • Course Materials • Live Quizzes
                </span>
              </div>

              <h1
                className={`${montserrat.className} text-3xl sm:text-5xl lg:text-[3.35rem] font-extrabold text-slate-950 tracking-tight leading-[1.1] sm:leading-[1.08]`}
              >
                AI Command Center for{" "}
                <span className="text-blue-500">University Lecturers.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-lg">
                Verify <span className="font-semibold text-slate-900">100+ students in seconds</span>,
                share <span className="font-semibold text-slate-900">lecture materials</span>, run{" "}
                <span className="font-semibold text-slate-900">auto-graded quizzes</span>, and track{" "}
                <span className="font-semibold text-blue-600">75% exam eligibility</span>.
              </p>

              {/* Quick Capability Pills */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { icon: CameraIcon, label: "1:N Vision Attendance" },
                  { icon: DocumentTextIcon, label: "Course Materials" },
                  { icon: ClipboardDocumentCheckIcon, label: "Auto-Graded Quizzes" },
                  { icon: ChartBarIcon, label: "75% Eligibility Audit" },
                ].map((pill, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white border border-slate-200/90 text-[11px] sm:text-xs font-semibold text-slate-700 shadow-sm"
                  >
                    <pill.icon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    {pill.label}
                  </span>
                ))}
              </div>

              {/* Action CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-1 sm:pt-2">
                <Link
                  href={isLoggedIn ? "/lecturer" : "/login"}
                  className="inline-flex items-center justify-center gap-3 px-6 sm:px-7 py-3.5 sm:py-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm sm:text-base transition-all shadow-lg shadow-blue-500/25 group"
                >
                  <span>{isLoggedIn ? "Open Lecturer Dashboard" : "Sign In to Lecturer Workspace"}</span>
                  <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <a
                  href="#engagement"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:py-4 rounded-xl bg-white hover:bg-blue-50/50 text-slate-800 border border-slate-200/90 hover:border-blue-300 font-semibold text-sm sm:text-base transition-all shadow-sm"
                >
                  Explore Materials & Quizzes
                </a>
              </div>

              {/* Key Telemetry Metrics Bar */}
              <div className="pt-5 border-t border-slate-200/80 grid grid-cols-3 gap-3 sm:gap-6 max-w-lg">
                <div>
                  <p
                    className={`${jetbrainsMono.className} text-xl sm:text-2xl font-bold text-slate-950`}
                  >
                    &lt;1.8s
                  </p>
                  <p className="text-[11px] sm:text-xs font-medium text-slate-500 mt-1">
                    1:N Vision Scan
                  </p>
                </div>
                <div>
                  <p
                    className={`${jetbrainsMono.className} text-xl sm:text-2xl font-bold text-blue-500`}
                  >
                    Instant
                  </p>
                  <p className="text-[11px] sm:text-xs font-medium text-slate-500 mt-1">
                    Notes & Quiz Sync
                  </p>
                </div>
                <div>
                  <p
                    className={`${jetbrainsMono.className} text-xl sm:text-2xl font-bold text-emerald-600`}
                  >
                    75.0%
                  </p>
                  <p className="text-[11px] sm:text-xs font-medium text-slate-500 mt-1">
                    Eligibility Audit
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: NASA-Grade 3D Biometric Face Mesh & Green Laser Scanner */}
            <div className="lg:col-span-6">
              <FaceMeshScannerHUD />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: COMPLETE ACADEMIC OPERATIONS BENTO GRID */}
      <section id="features" className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
        <div className="max-w-2xl mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 mb-3">
            <SparklesIcon className="w-4 h-4 text-blue-500" />
            <span
              className={`${jetbrainsMono.className} text-xs font-semibold uppercase tracking-wider text-blue-700`}
            >
              Platform Suite
            </span>
          </div>
          <h2
            className={`${montserrat.className} text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight`}
          >
            Everything You Need to Run a Course.
          </h2>
          <p className="text-slate-600 mt-2.5 text-sm sm:text-base">
            Attendance, materials, quizzes, and exam eligibility in one workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6">
          {/* Card 1: 1:N Computer Vision Attendance (7 cols) */}
          <div className="md:col-span-7 rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-7 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 sm:mb-5">
                <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-sm shadow-blue-500/25">
                  <CameraIcon className="w-5 h-5" />
                </div>
                <span
                  className={`${jetbrainsMono.className} text-[11px] font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200`}
                >
                  1:N VISION ENGINE
                </span>
              </div>
              <h3 className={`${montserrat.className} text-lg sm:text-xl font-bold text-slate-950 mb-2`}>
                Instant Photo, Video & Live Attendance
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Snap a classroom photo or video to verify 100+ enrolled faces simultaneously while
                blocking proxy sign-ins.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { code: "GROUP PHOTO", desc: "100+ faces per frame" },
                { code: "CLASS VIDEO", desc: "Frame deduplication" },
                { code: "INTRUDER SHIELD", desc: "Blocks proxy sign-ins" },
              ].map((item) => (
                <div
                  key={item.code}
                  className="p-2.5 rounded-xl bg-blue-50/50 border border-blue-100"
                >
                  <p
                    className={`${jetbrainsMono.className} text-[11px] font-bold text-blue-600`}
                  >
                    {item.code}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Course Materials & Lecture Notes Sharing (5 cols) */}
          <div className="md:col-span-5 rounded-2xl bg-obsidian-950 text-white border border-obsidian-700 p-5 sm:p-7 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="pointer-events-none absolute -right-12 -bottom-12 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl" />
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 sm:mb-5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-400 flex items-center justify-center">
                  <DocumentTextIcon className="w-5 h-5" />
                </div>
                <span
                  className={`${jetbrainsMono.className} text-[11px] font-semibold px-2.5 py-1 rounded-md bg-blue-500/15 text-blue-300 border border-blue-400/30`}
                >
                  COURSE MATERIALS
                </span>
              </div>
              <h3 className={`${montserrat.className} text-lg sm:text-xl font-bold text-white mb-2`}>
                Direct Slide & PDF Sharing
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Upload lecture notes, PDFs, and study guides straight to enrolled students&apos;
                portals—no group chats needed.
              </p>
            </div>

            <div className="mt-5 p-3.5 rounded-xl bg-obsidian-900 border border-obsidian-700 flex items-center justify-between text-xs font-sans">
              <span className="text-blue-400">PDF • DOCX • PPTX</span>
              <span className="text-emerald-400">100% DELIVERED</span>
            </div>
          </div>

          {/* Card 3: Scheduled Quizzes & Auto-Grading (6 cols) */}
          <div className="md:col-span-6 rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-7 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 sm:mb-5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                  <ClipboardDocumentCheckIcon className="w-5 h-5" />
                </div>
                <span
                  className={`${jetbrainsMono.className} text-[11px] font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200`}
                >
                  LIVE QUIZZES
                </span>
              </div>
              <h3 className={`${montserrat.className} text-lg sm:text-xl font-bold text-slate-950 mb-2`}>
                Timed Quizzes & Auto-Grading
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Publish timed multiple-choice assessments with automatic grading and instant class
                score analytics.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs font-sans text-slate-600">
              <span className="inline-flex items-center gap-1.5 text-blue-600 font-semibold">
                <ClockIcon className="w-4 h-4" /> Timed Windows
              </span>
              <span>Instant Analytics</span>
            </div>
          </div>

          {/* Card 4: 75% Eligibility & Co-Lecturer Auditing (6 cols) */}
          <div className="md:col-span-6 rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-7 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 sm:mb-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                  <ChartBarIcon className="w-5 h-5" />
                </div>
                <span
                  className={`${jetbrainsMono.className} text-[11px] font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200`}
                >
                  75% ELIGIBILITY
                </span>
              </div>
              <h3 className={`${montserrat.className} text-lg sm:text-xl font-bold text-slate-950 mb-2`}>
                Automated 75% Threshold & Exports
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Track attendance against total lectures, flag at-risk students below 75%, and export
                Senate-ready CSV/Excel sheets in one click.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs font-sans text-slate-600">
              <span className="text-emerald-600 font-semibold">ELIGIBLE &ge; 75%</span>
              <span className="text-amber-600 font-semibold">AT-RISK &lt; 75%</span>
              <span className="text-blue-600 font-semibold">1-CLICK CSV</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: LECTURER-TO-STUDENT ENGAGEMENT & REAL-TIME SYNC SHOWCASE */}
      <section
        id="engagement"
        className="py-12 sm:py-16 lg:py-20 bg-white border-y border-slate-200/80 px-4 sm:px-6 lg:px-10"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-center">
            <div className="lg:col-span-5 space-y-4 sm:space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200">
                <ArrowsRightLeftIcon className="w-4 h-4 text-blue-500" />
                <span
                  className={`${jetbrainsMono.className} text-xs font-semibold uppercase tracking-wider text-blue-700`}
                >
                  Real-Time Sync
                </span>
              </div>
              <h2
                className={`${montserrat.className} text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight`}
              >
                Instant Sync with Enrolled Students.
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Every attendance scan, file upload, and quiz syncs directly to the CoursePass
                student portal in real time.
              </p>

              <div className="space-y-3 pt-1">
                {[
                  {
                    icon: DocumentTextIcon,
                    title: "Course Material Broadcast",
                    desc: "Instant student access to slides, PDFs, and lab sheets.",
                  },
                  {
                    icon: ClipboardDocumentCheckIcon,
                    title: "Live Quiz Delivery",
                    desc: "Timed quizzes with automatic grading and score breakdowns.",
                  },
                  {
                    icon: BellAlertIcon,
                    title: "Attendance & Eligibility Alerts",
                    desc: "Immediate scan confirmation and live 75% eligibility standing.",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FAFAFA] border border-slate-200/80"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                      <p className="text-xs text-slate-600 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Interactive Ecosystem Bridge Diagram */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl bg-obsidian-950 border border-obsidian-700 p-4 sm:p-7 text-white shadow-xl space-y-4 sm:space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-obsidian-700 pb-3.5">
                  <div>
                    <span
                      className={`${jetbrainsMono.className} text-[10px] sm:text-[11px] text-blue-400 uppercase tracking-wider`}
                    >
                      WEBHOOK SYNC
                    </span>
                    <h3 className={`${montserrat.className} text-base sm:text-lg font-bold text-white mt-0.5`}>
                      FacePass Lecturer &harr; Student Portal
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[11px] font-sans shrink-0">
                    LIVE WEBHOOKS
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-obsidian-900 border border-obsidian-700 space-y-1.5">
                    <span
                      className={`${jetbrainsMono.className} text-[10px] text-blue-400 uppercase`}
                    >
                      CHANNEL 01
                    </span>
                    <p className="text-sm font-bold text-white">CV Attendance</p>
                    <p className="text-xs text-slate-400">
                      Marks attendance & updates 75% standing live.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-obsidian-900 border border-blue-500/40 space-y-1.5 shadow-[0_0_25px_-8px_rgba(0,123,255,0.4)]">
                    <span
                      className={`${jetbrainsMono.className} text-[10px] text-blue-400 uppercase`}
                    >
                      CHANNEL 02
                    </span>
                    <p className="text-sm font-bold text-white">Course Materials</p>
                    <p className="text-xs text-slate-400">
                      Delivers PDFs & slides straight to student libraries.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-obsidian-900 border border-obsidian-700 space-y-1.5">
                    <span
                      className={`${jetbrainsMono.className} text-[10px] text-blue-400 uppercase`}
                    >
                      CHANNEL 03
                    </span>
                    <p className="text-sm font-bold text-white">Timed Quizzes</p>
                    <p className="text-xs text-slate-400">
                      Pushes quizzes & returns auto-graded scores.
                    </p>
                  </div>
                </div>

                {/* Simulated Live Event Stream */}
                <div className="rounded-xl bg-obsidian-900/90 border border-obsidian-700 p-3.5 space-y-2 font-sans text-xs">
                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 border-b border-obsidian-700 pb-2">
                    <span className="truncate">EVENT STREAM // GET201</span>
                    <span className="text-emerald-400 shrink-0 ml-2">● ACTIVE</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 text-slate-300">
                    <span className="truncate">
                      [MATERIAL] &quot;Thermodynamics_Wk4_Notes.pdf&quot;
                    </span>
                    <span className="text-blue-400 text-[11px] sm:text-xs shrink-0">142 Notified</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 text-slate-300">
                    <span className="truncate">
                      [QUIZ] &quot;Mid-Semester CA Quiz (20m)&quot;
                    </span>
                    <span className="text-amber-300 text-[11px] sm:text-xs shrink-0">Fri 10:00 AM</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 text-slate-300">
                    <span className="truncate">
                      [CV_ENGINE] 1:N Classroom Frame Verified
                    </span>
                    <span className="text-emerald-400 text-[11px] sm:text-xs shrink-0">136 Present</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: 4-STEP LECTURER WORKFLOW */}
      <section id="workflow" className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <span
            className={`${jetbrainsMono.className} text-xs font-semibold uppercase tracking-widest text-blue-600`}
          >
            WORKFLOW
          </span>
          <h2
            className={`${montserrat.className} text-2xl sm:text-4xl font-extrabold text-slate-950 mt-2 tracking-tight`}
          >
            Run Your Course in Four Steps
          </h2>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">
            Students enroll once on CoursePass; you manage classes from FacePass.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {[
            {
              step: "01",
              title: "Create Session",
              desc: "Select your course, set total lectures, and initialize its face collection.",
              icon: AcademicCapIcon,
            },
            {
              step: "02",
              title: "Scan Classroom",
              desc: "Capture a live frame, photo, or video to verify enrolled students in seconds.",
              icon: VideoCameraIcon,
            },
            {
              step: "03",
              title: "Share & Assess",
              desc: "Publish lecture materials and schedule auto-graded quizzes.",
              icon: DocumentTextIcon,
            },
            {
              step: "04",
              title: "Audit & Export",
              desc: "Review 75% eligibility standing and export Senate-ready CSV/Excel reports.",
              icon: DocumentArrowDownIcon,
            },
          ].map((item) => (
            <div
              key={item.step}
              className="relative rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-sm hover:border-blue-300 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`${jetbrainsMono.className} text-xs font-bold px-3 py-1 rounded-full bg-blue-500 text-white`}
                >
                  STEP {item.step}
                </span>
                <item.icon className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className={`${montserrat.className} text-base sm:text-lg font-bold text-slate-950 mb-1.5`}>
                {item.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5: BIOMETRIC PRIVACY & SECURITY */}
      <section id="privacy" className="py-10 sm:py-16 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
        <div className="rounded-2xl sm:rounded-3xl bg-obsidian-950 text-white p-6 sm:p-10 lg:p-12 border border-obsidian-700 relative overflow-hidden">
          <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl" />

          <div className="max-w-2xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300">
              <LockClosedIcon className="w-4 h-4 shrink-0" />
              <span
                className={`${jetbrainsMono.className} text-[10px] sm:text-xs uppercase tracking-wider font-semibold`}
              >
                Zero-Local-Biometrics
              </span>
            </div>

            <h2
              className={`${montserrat.className} text-2xl sm:text-3xl font-extrabold tracking-tight`}
            >
              Strict Biometric Privacy. Zero Local Storage.
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Classroom captures are processed in-memory over TLS 1.3 inside isolated per-course
              collections and are never stored on lecturer devices.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href={isLoggedIn ? "/lecturer" : "/login"}
                className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-500/25"
              >
                {isLoggedIn ? "Open Dashboard" : "Lecturer Sign In"}
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Minimalist Precision Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 sm:py-8 px-4 sm:px-6 lg:px-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <FacePassLogo theme="light" size="sm" showBadge={true} />
          <p className={`${jetbrainsMono.className} text-[10px] sm:text-xs text-slate-500`}>
            FACEPASS • AI ATTENDANCE, MATERIALS & QUIZZES
          </p>
        </div>
      </footer>
    </div>
  );
}
