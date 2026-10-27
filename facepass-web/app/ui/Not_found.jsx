"use client";

import { ScanFace, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function EmptyActionState({
  title = "No Biometric Records Found",
  description = "Provision a course session or run a Computer Vision classroom scan to populate this view.",
  buttonLabel = "Return to Command Center",
  onClick,
}) {
  const router = useRouter();

  const handleAction = () => {
    if (onClick) {
      onClick();
    } else {
      router.back();
    }
  };

  return (
    <div className="group relative w-full py-12 px-6 bg-white rounded-2xl border border-slate-200/90 flex flex-col items-center justify-center overflow-hidden hover:border-blue-400 transition-all">
      <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 mb-4">
        <ScanFace className="w-6 h-6" />
      </div>

      <span className="text-[10px] font-mono uppercase tracking-wider text-blue-600 font-semibold mb-1">
        TELEMETRY // EMPTY STATE
      </span>
      <h3 className="text-base font-bold text-slate-900 tracking-tight text-center">
        {title}
      </h3>
      <p className="text-xs text-slate-500 mt-1 max-w-xs text-center">
        {description}
      </p>

      <button
        onClick={handleAction}
        className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold transition-all shadow-sm shadow-blue-500/20"
      >
        <ArrowLeft className="w-3.5 h-3.5 text-white" />
        {buttonLabel}
      </button>
    </div>
  );
}
