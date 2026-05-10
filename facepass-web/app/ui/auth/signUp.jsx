"use client";

import {
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  IdentificationIcon
} from "@heroicons/react/20/solid";
import {useState} from "react";
import Link from "next/link";
import CPLogo from "../CPLogo";
import {montserrat} from "@/app/ui/fonts";
import {ClipLoader} from "react-spinners";

import {useRegisterMutation} from "../../lib/api/authApi";
import {useRouter} from "next/navigation";
import {toast} from 'react-toastify';

export default function SignUPForm() {
  // RTK Query hook
  const [registerMutation, {isLoading, error: apiError}] = useRegisterMutation();

  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [matric, setMatric] = useState("");

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevents page refresh

    try {
      const response = await registerMutation({
        email: email.trim(),
        password: password,
        name: name,
        matric: matric.trim()
      }).unwrap();

      toast.success("Sign Up Successful");

      // Redirect to OTP page with the user ID
      router.push(`/schoolProfile?id=${response.userID}`);

    } catch (err) {
      console.error(err);
      const errorMessage = err?.data?.error || "Registration failed. Please try again.";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl bg-white rounded-2xl shadow-md p-4 sm:p-6 md:p-8 lg:p-10">

        {/* Logo Section */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <CPLogo />
        </div>

        {/* Header Text */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className={`${montserrat.className} text-xl sm:text-2xl md:text-3xl font-bold`}>
            Sign Up
          </h1>
          <p className={`${montserrat.className} text-xs sm:text-sm text-gray-600`}>
            Welcome! Let’s get you started by creating an account
          </p>
        </div>


        <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>

          <div>
            <label htmlFor="name" className="mb-1 block text-xs sm:text-sm font-medium text-gray-900">
              Full name
            </label>
            <div className="relative">
              <IdentificationIcon className="absolute left-3 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-gray-400" />
              <input
                className="peer block w-full rounded-lg border border-gray-300 py-1.5 sm:py-2 pl-9 sm:pl-10 text-xs sm:text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                id="fullname"
                type="text"
                name="fullname"
                autoComplete="fullname"
                placeholder="Enter your fullname"
                onChange={(e) => setName(e.target.value)}
                required
                value={name}
              />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-xs sm:text-sm font-medium text-gray-900">
              Email
            </label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-gray-400" />
              <input
                className={`peer block w-full rounded-lg border py-1.5 sm:py-2 pl-9 sm:pl-10 text-xs sm:text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${apiError ? "border-red-600" : "border-gray-300"
                  }`}
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="Enter your email"
                onChange={(e) => setEmail(e.target.value)}
                required
                value={email}
              />
            </div>
          </div>



          <div>
            <label htmlFor="matric" className="mb-1 block text-xs sm:text-sm font-medium text-gray-900">
              Matric Number
            </label>
            <div className="relative">
              <IdentificationIcon className="absolute left-3 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-gray-400" />
              <input
                className="peer block w-full rounded-lg border border-gray-300 py-1.5 sm:py-2 pl-9 sm:pl-10 text-xs sm:text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                id="matric"
                type="text"
                name="matric"
                autoComplete="matric"
                placeholder="Enter your matric number"
                onChange={(e) => setMatric(e.target.value)}
                required
                value={matric}
              />
            </div>
          </div>


          <div>
            <label htmlFor="password" className="mb-1 block text-xs sm:text-sm font-medium text-gray-900">
              Password
            </label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-gray-400" />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 focus:outline-none"
              >
                {show ? (
                  <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <EyeSlashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </button>
              <input
                className="peer block w-full rounded-lg border border-gray-300 py-1.5 sm:py-2 pl-9 sm:pl-10 text-xs sm:text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                id="password"
                type={show ? "text" : "password"}
                name="password"
                autoComplete="new-password" // "new-password" prevents browsers from filling in the user's current password
                placeholder="Create a password"
                onChange={(e) => setPassword(e.target.value)}
                required
                value={password}
              />
            </div>

            {apiError && (
              <p className="mt-1 text-xs text-red-600">

                {apiError?.data?.error || "Registration failed"}
              </p>
            )}
          </div>


          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center rounded-lg px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium text-white transition ${isLoading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
                }`}
            >
              {isLoading ? <ClipLoader color="#fff" size={20} /> : "Sign Up"}
            </button>
          </div>
        </form>




        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-xs sm:text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-500 font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}