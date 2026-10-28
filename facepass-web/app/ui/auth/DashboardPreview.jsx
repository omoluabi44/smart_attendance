"use client";

import {
  ScanFace,
  ShieldCheck,
  Cpu,
  Lock,
  FileText,
  ClipboardCheck,
} from "lucide-react";
import CPLogo from "../CPLogo";

export default function DashboardPreview({ mode = "login" }) {
  const modeCopy = {
    login: {
      badge: "LECTURER PORTAL",
      title: "Face Attendance, Course Materials & Timed Quizzes.",
      subtitle:
        "Take classroom attendance in seconds, share lecture notes with your students, schedule auto-graded quizzes, and track 75% exam eligibility.",
    },
  };

  const activeCopy = modeCopy[mode] || modeCopy.login;

  return (
    <div className="relative flex flex-col justify-between w-full h-full min-h-screen bg-obsidian-950 text-white p-10 xl:p-14 overflow-hidden select-none">
      {/* Background Grid & Brand Blue Ambient Glow */}
      <div className="absolute inset-0 bg-vision-grid-dark opacity-40 pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between border-b border-obsidian-700 pb-6">
        <CPLogo theme="dark" size="sm" />
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-obsidian-900 border border-obsidian-700 text-[11px] font-sans text-blue-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          SMART ATTENDANCE: READY
        </div>
      </div>

      {/* Center Content & Biometric HUD Card */}
      <div className="relative z-10 my-auto py-8 max-w-xl">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-500/15 border border-blue-400/30 text-blue-300 text-[11px] font-sans tracking-wider uppercase mb-5">
          <Cpu className="w-3.5 h-3.5" />
          {activeCopy.badge}
        </div>

        <h2 className="text-2xl xl:text-3xl font-bold tracking-tight text-white leading-tight mb-4">
          {activeCopy.title}
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed mb-8">
          {activeCopy.subtitle}
        </p>

        {/* Simulated Live Classroom Suite HUD Panel */}
        <div className="relative rounded-2xl bg-obsidian-900/95 border border-obsidian-700 p-5 shadow-2xl overflow-hidden">
          {/* Corner Reticles */}
          <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-blue-400/70" />
          <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-blue-400/70" />
          <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-blue-400/70" />
          <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-blue-400/70" />

          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-obsidian-700 text-[11px] font-sans text-slate-400">
            <span className="flex items-center gap-1.5 text-blue-400">
              <ScanFace className="w-3.5 h-3.5" />
              COURSE: CSC401 (2026)
            </span>
            <span className="text-emerald-400">CLASSROOM HUB</span>
          </div>

          {/* Simulated Detections & Classroom Activities */}
          <div className="space-y-2.5 mb-4">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-obsidian-950/90 border border-obsidian-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-400/40 flex items-center justify-center text-blue-300 font-sans text-xs font-bold">
                  FA
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">
                    Classroom Attendance Scan
                  </div>
                  <div className="text-[10px] font-sans text-slate-400">
                    138 STUDENTS PRESENT • 75% TARGET TRACKED
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-sans text-emerald-300">
                VERIFIED
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-obsidian-950/90 border border-obsidian-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-400/40 flex items-center justify-center text-blue-300">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">
                    Course Materials & Lecture Slides
                  </div>
                  <div className="text-[10px] font-sans text-slate-400">
                    CSC401_Week4_Notes.pdf • SHARED WITH STUDENTS
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-blue-500/20 border border-blue-400/30 text-[10px] font-sans text-blue-300">
                DELIVERED
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-obsidian-950/90 border border-obsidian-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-400/40 flex items-center justify-center text-blue-300">
                  <ClipboardCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">
                    Scheduled Mid-Semester Quiz (20m)
                  </div>
                  <div className="text-[10px] font-sans text-slate-400">
                    AUTO-GRADED • AVERAGE SCORE: 82.4%
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-sans text-emerald-300">
                LIVE SYNC
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-obsidian-700 text-center">
            <div className="p-2 rounded-lg bg-obsidian-950/70 border border-obsidian-700">
              <div className="text-[10px] font-sans text-slate-400">THRESHOLD</div>
              <div className="text-xs font-sans font-bold text-white mt-0.5">
                75.0% MIN
              </div>
            </div>
            <div className="p-2 rounded-lg bg-obsidian-950/70 border border-obsidian-700">
              <div className="text-[10px] font-sans text-slate-400">PRIVACY</div>
              <div className="text-xs font-sans font-bold text-blue-400 mt-0.5">
                PROTECTED
              </div>
            </div>
            <div className="p-2 rounded-lg bg-obsidian-950/70 border border-obsidian-700">
              <div className="text-[10px] font-sans text-slate-400">STUDENT SYNC</div>
              <div className="text-xs font-sans font-bold text-emerald-400 mt-0.5">
                INSTANT
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Guardrail Strip */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-obsidian-700 text-[11px] font-sans text-slate-400">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-blue-400" />
          <span>NO PHOTOS SAVED ON YOUR DEVICE</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>ATTENDANCE • MATERIALS • QUIZZES</span>
        </div>
      </div>
    </div>
  );
}
