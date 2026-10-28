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
  KeyRound,
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  LogOut,
} from "lucide-react-native";
import CPLogo from "@/components/ui/CPLogo";
import { useChangePasswordMutation } from "@/lib/api/facepassApi";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  updateCurrentUser,
  logout,
  saveAuthSessionToStorage,
  clearAuthSessionFromStorage,
} from "@/lib/features/user/userSlice";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentUser, token, refreshToken } = useAppSelector(
    (state) => state.user
  );
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const hasMinLength = newPassword.length >= 8;
  const isDifferent =
    newPassword.length > 0 && newPassword !== currentPassword;
  const matchesConfirm =
    newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!hasMinLength) {
      setErrorMessage("New password must be at least 8 characters long.");
      return;
    }
    if (!isDifferent) {
      setErrorMessage(
        "New password must be different from your temporary password."
      );
      return;
    }
    if (!matchesConfirm) {
      setErrorMessage("New password and confirmation do not match.");
      return;
    }

    try {
      const res = await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      }).unwrap();

      const updatedUser = currentUser
        ? { ...currentUser, must_change_password: false }
        : null;

      dispatch(updateCurrentUser({ must_change_password: false }));
      if (updatedUser && token) {
        await saveAuthSessionToStorage(updatedUser, token, refreshToken);
      }

      setSuccessMessage("Password updated! Redirecting to your workspace...");
      const targetRole = res?.role || currentUser?.role || "lecturer";
      setTimeout(() => {
        if (targetRole === "admin") {
          router.replace("/(admin)");
        } else {
          router.replace("/(lecturer)");
        }
      }, 800);
    } catch (err: any) {
      setErrorMessage(
        err?.data?.error ||
          "Failed to update password. Please check your current password."
      );
    }
  };

  const handleSignOut = async () => {
    await clearAuthSessionFromStorage();
    dispatch(logout());
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-5 py-3.5 bg-white border-b border-slate-200/80 flex-row items-center justify-between">
          <CPLogo theme="light" size="sm" />
          <TouchableOpacity
            onPress={handleSignOut}
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100"
          >
            <LogOut size={14} color="#64748B" />
            <Text className="text-xs font-medium text-slate-600">Sign Out</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          className="px-5 py-6"
          keyboardShouldPersistTaps="handled"
        >
          <View className="w-full max-w-md self-center bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
            <View className="self-start flex-row items-center gap-2 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200/80 mb-3">
              <KeyRound size={14} color="#D97706" />
              <Text className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                SECURITY POLICY // FIRST LOGIN
              </Text>
            </View>

            <Text className="text-xl font-bold text-slate-900">
              Set Your Personal Password
            </Text>
            <Text className="text-xs text-slate-600 mt-1 mb-5 leading-relaxed">
              Welcome{currentUser?.name ? `, ${currentUser.name}` : ""}. Because
              your account was provisioned with a temporary password, please set
              a private password before accessing the console.
            </Text>

            {errorMessage ? (
              <View className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex-row items-center gap-2">
                <AlertCircle size={16} color="#E11D48" />
                <Text className="text-xs text-rose-700 flex-1">
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {successMessage ? (
              <View className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex-row items-center gap-2">
                <CheckCircle2 size={16} color="#059669" />
                <Text className="text-xs text-emerald-700 flex-1">
                  {successMessage}
                </Text>
              </View>
            ) : null}

            {/* Current Temporary Password */}
            <View className="mb-4">
              <Text className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Current / Temporary Password
              </Text>
              <View className="relative justify-center">
                <View className="absolute left-3.5 z-10">
                  <Lock size={16} color="#94A3B8" />
                </View>
                <TextInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!showCurrent}
                  placeholder="Enter temporary password"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-10 py-2.5 text-sm text-slate-900"
                />
                <TouchableOpacity
                  onPress={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 p-1"
                >
                  {showCurrent ? (
                    <EyeOff size={16} color="#64748B" />
                  ) : (
                    <Eye size={16} color="#64748B" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* New Password */}
            <View className="mb-4">
              <Text className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                New Personal Password
              </Text>
              <View className="relative justify-center">
                <View className="absolute left-3.5 z-10">
                  <Lock size={16} color="#94A3B8" />
                </View>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNew}
                  placeholder="At least 8 characters"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-10 py-2.5 text-sm text-slate-900"
                />
                <TouchableOpacity
                  onPress={() => setShowNew(!showNew)}
                  className="absolute right-3 p-1"
                >
                  {showNew ? (
                    <EyeOff size={16} color="#64748B" />
                  ) : (
                    <Eye size={16} color="#64748B" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm New Password */}
            <View className="mb-4">
              <Text className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Confirm New Password
              </Text>
              <View className="relative justify-center">
                <View className="absolute left-3.5 z-10">
                  <Lock size={16} color="#94A3B8" />
                </View>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showNew}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 py-2.5 text-sm text-slate-900"
                />
              </View>
            </View>

            {/* Live Policy Checklist */}
            <View className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 mb-5 space-y-2">
              {[
                { ok: hasMinLength, label: "At least 8 characters long" },
                {
                  ok: isDifferent,
                  label: "Different from temporary password",
                },
                { ok: matchesConfirm, label: "Confirmation matches" },
              ].map((rule) => (
                <View
                  key={rule.label}
                  className="flex-row items-center gap-2 py-0.5"
                >
                  <CheckCircle2
                    size={14}
                    color={rule.ok ? "#059669" : "#CBD5E1"}
                  />
                  <Text
                    className={`text-xs ${
                      rule.ok
                        ? "text-emerald-700 font-semibold"
                        : "text-slate-500"
                    }`}
                  >
                    {rule.label}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={
                isLoading || !hasMinLength || !isDifferent || !matchesConfirm
              }
              className={`w-full py-3.5 rounded-xl flex-row items-center justify-center gap-2 ${
                isLoading || !hasMinLength || !isDifferent || !matchesConfirm
                  ? "bg-slate-300"
                  : "bg-blue-500"
              }`}
            >
              {isLoading && <ActivityIndicator size="small" color="#FFFFFF" />}
              <Text className="text-xs font-bold text-white">
                {isLoading
                  ? "Updating Password..."
                  : "Save Password & Enter Console"}
              </Text>
              <ArrowRight size={15} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
