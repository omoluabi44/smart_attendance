import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react-native";
import CPLogo from "@/components/ui/CPLogo";
import { useLoginsMutation } from "@/lib/api/authApi";
import { useAppDispatch } from "@/lib/store";
import {
  login,
  saveAuthSessionToStorage,
} from "@/lib/features/user/userSlice";

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [logins, { isLoading }] = useLoginsMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async () => {
    setErrorMessage("");
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter both your institutional email and password.");
      return;
    }

    try {
      const response = await logins({
        email: email.trim(),
        password: password.trim(),
      }).unwrap();

      const accessToken = response?.tokens?.access;
      const refreshToken = response?.tokens?.refresh_token_cookie || null;
      const user = response?.user;

      if (!accessToken || !user) {
        setErrorMessage("Unexpected server response. Please try again.");
        return;
      }

      await saveAuthSessionToStorage(user, accessToken, refreshToken);
      dispatch(
        login({
          user,
          token: accessToken,
          refreshToken,
        })
      );

      if (user.must_change_password) {
        router.replace("/(auth)/change-password");
      } else if (user.role === "admin") {
        router.replace("/(admin)");
      } else {
        router.replace("/(lecturer)");
      }
    } catch (err: any) {
      setErrorMessage(
        err?.data?.error ||
          err?.data?.message ||
          "Invalid email or password. Please verify your credentials."
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Top Bar */}
        <View className="px-5 py-3.5 bg-white border-b border-slate-200/80 flex-row items-center justify-between">
          <CPLogo theme="light" size="sm" />
          <TouchableOpacity
            onPress={() => router.push("/")}
            className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100"
          >
            <ArrowLeft size={14} color="#475569" />
            <Text className="text-xs font-medium text-slate-600">Overview</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          className="px-5 py-8"
          keyboardShouldPersistTaps="handled"
        >
          <View className="w-full max-w-md self-center">
            <View className="mb-6">
              <View className="self-start flex-row items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200/80 mb-3">
                <View className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <Text className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  FACULTY &amp; ADMIN ACCESS
                </Text>
              </View>
              <Text className="text-2xl font-bold text-slate-900">
                Sign in to FacePass
              </Text>
              <Text className="text-sm text-slate-600 mt-1">
                Enter your institutional credentials to manage sessions and
                classroom attendance.
              </Text>
            </View>

            {/* Login Form Card */}
            <View className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
              {errorMessage ? (
                <View className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex-row items-center gap-2.5">
                  <AlertCircle size={18} color="#E11D48" />
                  <Text className="text-xs font-medium text-rose-700 flex-1">
                    {errorMessage}
                  </Text>
                </View>
              ) : null}

              {/* Email Field */}
              <View className="mb-4">
                <Text className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Institutional Email
                </Text>
                <View className="relative justify-center">
                  <View className="absolute left-3.5 z-10">
                    <Mail size={16} color="#94A3B8" />
                  </View>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="lecturer@university.edu"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 py-3 text-sm text-slate-900"
                  />
                </View>
              </View>

              {/* Password Field */}
              <View className="mb-5">
                <Text className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Password
                </Text>
                <View className="relative justify-center">
                  <View className="absolute left-3.5 z-10">
                    <Lock size={16} color="#94A3B8" />
                  </View>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-11 py-3 text-sm text-slate-900"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 p-1"
                  >
                    {showPassword ? (
                      <EyeOff size={16} color="#64748B" />
                    ) : (
                      <Eye size={16} color="#64748B" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isLoading}
                className={`w-full py-3.5 rounded-xl flex-row items-center justify-center gap-2 ${
                  isLoading ? "bg-blue-300" : "bg-blue-500"
                }`}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : null}
                <Text className="text-sm font-semibold text-white">
                  {isLoading ? "Authenticating..." : "Sign In to Console"}
                </Text>
              </TouchableOpacity>

              <View className="mt-5 pt-4 border-t border-slate-100 flex-row items-start gap-2">
                <ShieldCheck size={15} color="#007BFF" />
                <Text className="text-[11px] text-slate-500 flex-1 leading-relaxed">
                  Lecturer accounts are provisioned by your University
                  Administrator. Students register and enroll biometrics on{" "}
                  <Text className="font-semibold text-slate-700">
                    CoursePass
                  </Text>
                  .
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
