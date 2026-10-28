"use client";

import {
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
} from "@heroicons/react/20/solid";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import CPLogo from "../CPLogo";
import { ClipLoader } from "react-spinners";
import { useLoginsMutation } from "../../lib/api/authApi";
import { useAppDispatch } from "@/app/lib/hooks";
import Cookies from "js-cookie";
import { login } from "../../lib/features/user/userStore";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function LoginForm() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loginMutation, { isLoading, error: apiError }] = useLoginsMutation();

  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await loginMutation({ email, password }).unwrap();
      const mustChange = Boolean(response.user.must_change_password);

      dispatch(
        login({
          id: response.user.id,
          name: response.user.name,
          access_token: response.tokens.access,
          email: response.user.email,
          profile_url: response.user.profile_url,
          role: response.user.role,
          must_change_password: mustChange,
          isLoggedIn: true,
        })
      );

      localStorage.setItem("accessToken", response.tokens.access);
      Cookies.set("refresh_token_cookies", response.tokens.refresh_token_cookie, {
        expires: 7,
        secure: true,
        sameSite: "strict",
      });

      if (mustChange) {
        toast.info("Security requirement: Please update your temporary password to continue.");
        router.push("/change-password");
      } else if (response.user.role === "admin") {
        toast.success("Authenticated as Administrator. Opening Admin Command Center.");
        router.push("/admin");
      } else {
        toast.success("Authentication verified. Welcome to FacePass.");
        router.push("/lecturer");
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err?.data?.error || "Login failed. Please verify your credentials.";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="flex items-center justify-center w-full px-4 sm:px-6">
      <div className="w-full max-w-md">
        {/* Top Back Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to overview
          </Link>
          <span className="text-[11px] font-mono text-blue-600 font-semibold uppercase tracking-wider">
            AUTH // FACULTY &amp; ADMIN
          </span>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 md:p-10">
          {/* Logo */}
          <div className="mb-6">
            <CPLogo theme="light" size="md" />
          </div>

          {/* Header */}
          <div className="mb-7">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Faculty &amp; Admin Sign In
            </h1>
            <p className="mt-1.5 text-sm text-slate-600">
              Enter your institutional credentials to access the FacePass Command Center.
            </p>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Institutional Email
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className={`peer block w-full rounded-xl border bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition focus:bg-white focus:outline-none focus:ring-2 ${
                    apiError
                      ? "border-rose-500 focus:border-rose-600 focus:ring-rose-500/15"
                      : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/15"
                  }`}
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="lecturer@university.edu"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  Password
                </label>
                <Link
                  href="/enterEmail"
                  className="text-xs font-medium text-blue-500 hover:text-blue-600"
                >
                  Reset password?
                </Link>
              </div>
              <div className="relative">
                <LockClosedIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {show ? (
                    <EyeIcon className="h-4 w-4" />
                  ) : (
                    <EyeSlashIcon className="h-4 w-4" />
                  )}
                </button>
                <input
                  className={`peer block w-full rounded-xl border bg-slate-50/50 py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 transition focus:bg-white focus:outline-none focus:ring-2 ${
                    apiError
                      ? "border-rose-500 focus:border-rose-600 focus:ring-rose-500/15"
                      : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/15"
                  }`}
                  id="password"
                  type={show ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {apiError && (
                <p className="mt-2 text-xs font-medium text-rose-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block" />
                  {apiError?.data?.error || "Invalid institutional credentials"}
                </p>
              )}
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all ${
                  isLoading
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {isLoading ? (
                  <>
                    <ClipLoader color="#fff" size={16} />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  "Sign In to Command Center"
                )}
              </button>
            </div>
          </form>

          {/* Institutional Provisioning Notice */}
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Lecturer credentials are provisioned by your university administration.
            </p>
          </div>
        </div>

        {/* Scope Guardrail Note */}
        <p className="mt-5 text-center text-[11px] font-mono text-slate-400">
          STUDENT ENROLLMENT IS HANDLED EXCLUSIVELY VIA STUDENT PORTAL
        </p>
      </div>
    </div>
  );
}
