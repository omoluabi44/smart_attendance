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
      badge: "TELEMETRY NODE // AUTH-GATEWAY",
      title: "Computer Vision Attendance, Course Materials & Live Quizzes.",
      subtitle:
        "Sign in to run 1:N Computer Vision attendance scans, broadcast lecture materials to enrolled students, schedule timed quizzes, and audit 75% exam eligibility.",
    },
    signup: {
      badge: "PROVISIONING // LECTURER ONBOARDING",
      title: "Initialize your AI Lecturer & Classroom Command Center.",
      subtitle:
        "Create your faculty credentials to provision isolated Computer Vision collections per course, share lecture notes with enrolled students, and automate continuous assessment quizzes.",
    },
    profile: {
      badge: "STEP 02 // INSTITUTIONAL MAPPING",
      title: "Bind your account to your academic department.",
      subtitle:
        "Linking your University, College, and Department scopes your course registry and synchronizes enrolled student rosters directly from the student portal.",
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
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-obsidian-900 border border-obsidian-700 text-[11px] font-mono text-blue-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          COMPUTER VISION ENGINE: ONLINE
        </div>
      </div>

      {/* Center Content & Biometric HUD Card */}
      <div className="relative z-10 my-auto py-8 max-w-xl">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-500/15 border border-blue-400/30 text-blue-300 text-[11px] font-mono tracking-wider uppercase mb-5">
          <Cpu className="w-3.5 h-3.5" />
          {activeCopy.badge}
        </div>

        <h2 className="text-2xl xl:text-3xl font-bold tracking-tight text-white leading-tight mb-4">
          {activeCopy.title}
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed mb-8">
          {activeCopy.subtitle}
        </p>

        {/* Simulated Live Computer Vision & Classroom Suite HUD Panel */}
        <div className="relative rounded-2xl bg-obsidian-900/95 border border-obsidian-700 p-5 shadow-2xl overflow-hidden">
          {/* Corner Reticles */}
          <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-blue-400/70" />
          <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-blue-400/70" />
          <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-blue-400/70" />
          <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-blue-400/70" />

          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-obsidian-700 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-blue-400">
              <ScanFace className="w-3.5 h-3.5" />
              COLLECTION: CV-CSC401-2026
            </span>
            <span className="text-emerald-400">1:N VISION + ACADEMIC HUB</span>
          </div>

          {/* Simulated Detections & Classroom Activities */}
          <div className="space-y-2.5 mb-4">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-obsidian-950/90 border border-obsidian-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-400/40 flex items-center justify-center text-blue-300 font-mono text-xs font-bold">
                  CV
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">
                    1:N Classroom Attendance Scan
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    138 ENROLLED VERIFIED • 75% THRESHOLD AUDITED
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono text-emerald-300">
                99.4% CONF
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
                  <div className="text-[10px] font-mono text-slate-400">
                    CSC401_Week4_Notes.pdf • BROADCAST TO STUDENTS
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-blue-500/20 border border-blue-400/30 text-[10px] font-mono text-blue-300">
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
                  <div className="text-[10px] font-mono text-slate-400">
                    AUTO-GRADED • MEAN SCORE: 82.4%
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono text-emerald-300">
                LIVE SYNC
              </span>
            </div>
          </div>

          {/* Telemetry Footer */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-obsidian-700 text-center">
            <div className="p-2 rounded-lg bg-obsidian-950/70 border border-obsidian-700">
              <div className="text-[10px] font-mono text-slate-400">THRESHOLD</div>
              <div className="text-xs font-mono font-bold text-white mt-0.5">
                75.0% MIN
              </div>
            </div>
            <div className="p-2 rounded-lg bg-obsidian-950/70 border border-obsidian-700">
              <div className="text-[10px] font-mono text-slate-400">PRIVACY</div>
              <div className="text-xs font-mono font-bold text-blue-400 mt-0.5">
                ZERO-LOCAL
              </div>
            </div>
            <div className="p-2 rounded-lg bg-obsidian-950/70 border border-obsidian-700">
              <div className="text-[10px] font-mono text-slate-400">STUDENT SYNC</div>
              <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                REAL-TIME
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Guardrail Strip */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-obsidian-700 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-blue-400" />
          <span>ZERO CLIENT BIOMETRIC RETENTION</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>ATTENDANCE • MATERIALS • QUIZZES</span>
        </div>
      </div>
    </div>
  );
}
