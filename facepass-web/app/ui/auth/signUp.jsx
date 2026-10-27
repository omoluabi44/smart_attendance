"use client";

import {
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  IdentificationIcon,
} from "@heroicons/react/20/solid";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import CPLogo from "../CPLogo";
import { ClipLoader } from "react-spinners";
import { useRegisterMutation } from "../../lib/api/authApi";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function SignUPForm() {
  const [registerMutation, { isLoading, error: apiError }] = useRegisterMutation();

  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [matric, setMatric] = useState("");

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await registerMutation({
        email: email.trim(),
        password: password,
        name: name,
        matric: matric.trim(),
      }).unwrap();

      toast.success("Account provisioned. Complete your academic unit setup.");

      router.push(`/schoolProfile?id=${response.userID}`);
    } catch (err) {
      console.error(err);
      const errorMessage =
        err?.data?.error || "Registration failed. Please verify your details.";
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
            STEP 01 OF 02 // CREDENTIALS
          </span>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 md:p-10">
          {/* Progress Bar */}
          <div className="flex items-center gap-2 mb-6">
            <div className="h-1.5 flex-1 rounded-full bg-blue-500" />
            <div className="h-1.5 flex-1 rounded-full bg-slate-100" />
          </div>

          {/* Logo */}
          <div className="mb-6">
            <CPLogo theme="light" size="md" />
          </div>

          {/* Header */}
          <div className="mb-7">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Lecturer Onboarding
            </h1>
            <p className="mt-1.5 text-sm text-slate-600">
              Create your faculty credentials to manage Computer Vision attendance, course materials, and quizzes.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="fullname"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Full Name & Academic Title
              </label>
              <div className="relative">
                <IdentificationIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="peer block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15"
                  id="fullname"
                  type="text"
                  name="fullname"
                  autoComplete="name"
                  placeholder="Dr. Adewale Ogunleye"
                  onChange={(e) => setName(e.target.value)}
                  required
                  value={name}
                />
              </div>
            </div>

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
                  placeholder="a.ogunleye@university.edu"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  value={email}
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="matric"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  Staff ID / Faculty Code
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  INSTITUTIONAL ID
                </span>
              </div>
              <div className="relative">
                <IdentificationIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="peer block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm font-mono text-slate-900 placeholder-slate-400 transition focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15"
                  id="matric"
                  type="text"
                  name="matric"
                  autoComplete="off"
                  placeholder="STAFF/CSC/0094"
                  onChange={(e) => setMatric(e.target.value)}
                  required
                  value={matric}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Security Password
              </label>
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
                  className="peer block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 transition focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15"
                  id="password"
                  type={show ? "text" : "password"}
                  name="password"
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  value={password}
                />
              </div>

              {apiError && (
                <p className="mt-2 text-xs font-medium text-rose-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block" />
                  {apiError?.data?.error || "Registration failed"}
                </p>
              )}
            </div>

            <div className="pt-2">
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
                    <span>Provisioning Account...</span>
                  </>
                ) : (
                  "Continue to Academic Unit Setup"
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Already registered on FacePass?{" "}
              <Link
                href="/login"
                className="text-blue-500 font-semibold hover:text-blue-600 underline underline-offset-4 transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
