"use client";

import {
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
} from "@heroicons/react/20/solid";
import { useState } from "react";
import Link from "next/link";
import CPLogo from "../CPLogo";
import { montserrat } from "@/app/ui/fonts";
import { ClipLoader } from "react-spinners";
import { useLoginsMutation } from "../../lib/api/authApi";
import { useAppDispatch } from "@/app/lib/hooks";
import Cookies from "js-cookie";
import { login } from "../../lib/features/user/userStore";
import { useRouter } from "next/navigation";
import Oauth from "./Oauth";
import { toast } from "react-toastify";

export default function LoginForm() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // RTK Query provides isLoading and error states automatically
  const [loginMutation, { isLoading, error: apiError }] = useLoginsMutation();
  
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // unwrapping allows us to catch the error in the catch block
      const response = await loginMutation({ email, password }).unwrap();

      dispatch(
        login({
          id: response.user.id,
          access_token: response.tokens.access,
          email: response.user.email,
          profile_url: response.user.profile_url,
          isLoggedIn: true,
        })
      );

      // Security Note: HttpOnly cookies are safer than localStorage, 
      // but if you must use client-side storage, this works.
      localStorage.setItem("accessToken", response.tokens.access);
      Cookies.set("refresh_token_cookies", response.tokens.refresh_token_cookie, {
        expires: 7,
        secure: true, // Recommended for production
        sameSite: 'strict'
      });

      toast.success("Login Successful");
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      const errorMessage = err?.data?.error || "Login failed. Please try again.";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl bg-white rounded-2xl shadow-md p-4 sm:p-6 md:p-8 lg:p-10">
        
        {/* Logo Section */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <CPLogo />
        </div>
        
        {/* Header Text */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className={`${montserrat.className} text-xl sm:text-2xl md:text-3xl font-bold`}>
            Sign In
          </h1>
          <p className={`${montserrat.className} text-xs sm:text-sm text-gray-600`}>
            Welcome back! Please enter your details
          </p>
        </div>

        {/* Form */}
        <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          

          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-xs sm:text-sm font-medium text-gray-900"
            >
              Email
            </label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-gray-400" />
              <input
                className={`peer block w-full rounded-lg border py-1.5 sm:py-2 pl-9 sm:pl-10 text-xs sm:text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                  apiError ? "border-red-600" : "border-gray-300"
                }`}
                id="email"
                type="email"
                name="email"
                autoComplete="email" // SEO/UX: Helps browsers autofill
                placeholder="Enter your email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

  
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-xs sm:text-sm font-medium text-gray-900"
            >
              Password
            </label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-gray-400" />
              <button
                type="button"
                onClick={() => setShow(!show)}
                aria-label={show ? "Hide password" : "Show password"} // Accessibility
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 focus:outline-none"
              >
                {show ? (
                  <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <EyeSlashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </button>
              <input
                className={`peer block w-full rounded-lg border py-1.5 sm:py-2 pl-9 sm:pl-10 text-xs sm:text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                  apiError ? "border-red-600" : "border-gray-300"
                }`}
                id="password"
                type={show ? "text" : "password"}
                name="password"
                autoComplete="current-password" // SEO/UX: Helps browsers autofill
                placeholder="Enter your password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
     
            {apiError && (
              <p className="mt-1 text-xs text-red-600">
                {apiError?.data?.error || "Invalid credentials"}
              </p>
            )}
          </div>

   
          <div className="text-right">
            <Link
              href="/enterEmail"
              className="text-xs sm:text-sm font-semibold text-blue-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

 
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center rounded-lg px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium text-white transition ${
                isLoading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {isLoading ? <ClipLoader color="#fff" size={20} /> : "Sign In"}
            </button>
          </div>
        </form>

        {/* <Oauth /> */}

        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-xs sm:text-sm">
            Don’t have an account?{" "}
            <Link
              href="/signup"
              className="text-blue-500 font-semibold hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}