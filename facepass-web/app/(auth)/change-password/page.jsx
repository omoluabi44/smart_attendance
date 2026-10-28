"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";
import {
  KeyRound,
  ShieldAlert,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  ScanFace,
} from "lucide-react";
import CPLogo from "@/app/ui/CPLogo";
import { useChangePasswordMutation } from "@/app/lib/api/facepassApi";
import {
  clearMustChangePassword,
  logout,
} from "@/app/lib/features/user/userStore";

export default function ForceChangePasswordPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useSelector((state) => state.user);
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!user?.isLoggedIn || !user?.access_token) {
      router.replace("/login");
    }
  }, [user?.isLoggedIn, user?.access_token, router]);

  const isMinLength = newPassword.length >= 8;
  const hasUpperAndLower =
    /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const isDifferentFromCurrent =
    newPassword.length > 0 && newPassword !== currentPassword;
  const passwordsMatch =
    newPassword.length > 0 && newPassword === confirmPassword;

  const canSubmit =
    currentPassword.trim().length > 0 &&
    isMinLength &&
    isDifferentFromCurrent &&
    passwordsMatch &&
    !isLoading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      const res = await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      }).unwrap();

      dispatch(clearMustChangePassword());
      toast.success(
        "Password updated! Redirecting to your FacePass Command Center."
      );

      const targetRole = res?.role || user?.role;
      if (targetRole === "admin") {
        router.push("/admin");
      } else {
        router.push("/lecturer");
      }
    } catch (err) {
      toast.error(
        err?.data?.error ||
          "Failed to update password. Please verify your temporary password."
      );
    }
  };

  const handleSignOut = () => {
    dispatch(logout());
    router.push("/login");
  };

  return (
    <main className="min-h-screen bg-[#FAFAFA] bg-vision-grid flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Top Status Header */}
        <div className="mb-5 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-[11px] font-sans font-semibold text-amber-800 uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            SECURITY // MANDATORY CREDENTIAL ROTATION
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-rose-600 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <div className="mb-5 flex items-center justify-between">
            <CPLogo theme="light" size="sm" />
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Update Temporary Password
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
            Welcome{user?.name ? `, ${user.name}` : ""}. Your institutional
            account (<span className="font-sans text-slate-800">{user?.email}</span>) was
            provisioned by an administrator with a temporary password. Please
            choose a new personal password to unlock the Command Center.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Temporary / Current Password */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Temporary / Current Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter temporary password provided by admin"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrent ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                New Personal Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNew ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Confirm New Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Live Security Checklist */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
              <div className="text-[10px] font-sans uppercase tracking-wider text-slate-400 font-semibold mb-1">
                PASSWORD POLICY CHECKS
              </div>
              <RequirementItem
                met={isMinLength}
                label="At least 8 characters long"
              />
              <RequirementItem
                met={hasUpperAndLower && hasNumber}
                label="Includes uppercase, lowercase, and a number (recommended)"
              />
              <RequirementItem
                met={isDifferentFromCurrent}
                label="Different from temporary password"
              />
              <RequirementItem
                met={passwordsMatch}
                label="Confirmation matches new password"
              />
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className={`w-full flex justify-center items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all ${
                !canSubmit
                  ? "bg-slate-300 cursor-not-allowed shadow-none"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {isLoading ? (
                <>
                  <ClipLoader color="#fff" size={16} />
                  <span>Updating Credentials...</span>
                </>
              ) : (
                <>
                  <ScanFace className="w-4 h-4" />
                  <span>Save Password &amp; Enter Command Center</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

function RequirementItem({ met, label }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2
        className={`w-3.5 h-3.5 shrink-0 ${
          met ? "text-emerald-600" : "text-slate-300"
        }`}
      />
      <span className={met ? "text-slate-800 font-medium" : "text-slate-500"}>
        {label}
      </span>
    </div>
  );
}
