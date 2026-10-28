import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Users,
  Calendar,
  LayoutDashboard,
  UserPlus,
  LogOut,
  ShieldCheck,
  ChevronRight,
  PlusCircle,
  X,
  Server,
} from "lucide-react-native";
import CPLogo from "@/components/ui/CPLogo";
import { FacePassUser } from "@/lib/features/user/userSlice";

export interface AppDrawerProps {
  visible: boolean;
  onClose: () => void;
  user: FacePassUser | null;
  role?: "admin" | "lecturer";
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  onProvisionClick?: () => void;
  onCreateCourseClick?: () => void;
  onCreateSessionClick?: () => void;
  onLogout: () => void;
  badges?: {
    usersCount?: number;
    sessionsCount?: number;
  };
}

export default function AppDrawer({
  visible,
  onClose,
  user,
  role = "lecturer",
  activeTab,
  setActiveTab,
  onProvisionClick,
  onCreateCourseClick,
  onCreateSessionClick,
  onLogout,
  badges = {},
}: AppDrawerProps) {
  const router = useRouter();
  const isAdmin = user?.role === "admin" || role === "admin";
  const userInitials = (user?.name || user?.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleNavClick = (tabKey: string) => {
    if (setActiveTab) {
      setActiveTab(tabKey);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 flex-row bg-slate-900/50">
        {/* Drawer Panel */}
        <View className="w-72 max-w-[82%] bg-white h-full border-r border-slate-200 flex-col justify-between shadow-2xl">
          {/* Top Brand & Identity */}
          <View className="p-5 pt-12 border-b border-slate-200/80">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  router.push(isAdmin ? "/(admin)" : "/(lecturer)");
                }}
              >
                <CPLogo theme="light" size="sm" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onClose}
                className="p-1.5 rounded-lg bg-slate-100"
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View className="mt-3 flex-row items-center gap-1.5">
              <View className="px-2 py-0.5 rounded-md bg-obsidian-950">
                <Text className="text-white text-[10px] font-semibold tracking-wider">
                  {isAdmin ? "ADMIN // GOVERNANCE" : "FACULTY // OPERATIONS"}
                </Text>
              </View>
              <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200/80">
                <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <Text className="text-[10px] font-semibold text-emerald-700">
                  {isAdmin ? "SUPER ADMIN" : "ACTIVE"}
                </Text>
              </View>
            </View>
          </View>

          {/* Authenticated User Identity Card */}
          <View className="p-3.5 mx-3 my-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl bg-blue-500 items-center justify-center">
                <Text className="text-white font-bold text-xs">
                  {userInitials}
                </Text>
              </View>
              <View className="flex-1">
                <Text
                  className="text-xs font-semibold text-slate-900"
                  numberOfLines={1}
                >
                  {user?.name || "System Administrator"}
                </Text>
                <Text
                  className="text-[11px] text-slate-500"
                  numberOfLines={1}
                >
                  {user?.email || "admin@coursepass.app"}
                </Text>
              </View>
            </View>
            {user?.matric ? (
              <View className="mt-2 pt-2 border-t border-slate-200/60 flex-row items-center justify-between">
                <Text className="text-[10px] text-slate-500">ID / MATRIC</Text>
                <Text className="text-[10px] font-semibold text-slate-700">
                  {user.matric}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Navigation Links */}
          <ScrollView className="flex-1 px-3 py-1">
            <Text className="px-3 py-1 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              Navigation
            </Text>

            {role === "admin" ? (
              <>
                <TouchableOpacity
                  onPress={() => handleNavClick("users")}
                  className={`flex-row items-center justify-between px-3.5 py-2.5 rounded-xl mb-1.5 ${
                    activeTab === "users" ? "bg-blue-500" : "bg-transparent"
                  }`}
                >
                  <View className="flex-row items-center gap-2.5">
                    <Users
                      size={16}
                      color={activeTab === "users" ? "#FFFFFF" : "#64748B"}
                    />
                    <Text
                      className={`text-xs ${
                        activeTab === "users"
                          ? "text-white font-semibold"
                          : "text-slate-600 font-medium"
                      }`}
                    >
                      Faculty & Accounts
                    </Text>
                  </View>
                  {badges.usersCount !== undefined && (
                    <View
                      className={`px-1.5 py-0.5 rounded ${
                        activeTab === "users"
                          ? "bg-white/20"
                          : "bg-slate-200/70"
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-semibold ${
                          activeTab === "users"
                            ? "text-white"
                            : "text-slate-700"
                        }`}
                      >
                        {badges.usersCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleNavClick("sessions")}
                  className={`flex-row items-center justify-between px-3.5 py-2.5 rounded-xl mb-2 ${
                    activeTab === "sessions" ? "bg-blue-500" : "bg-transparent"
                  }`}
                >
                  <View className="flex-row items-center gap-2.5">
                    <Calendar
                      size={16}
                      color={activeTab === "sessions" ? "#FFFFFF" : "#64748B"}
                    />
                    <Text
                      className={`text-xs ${
                        activeTab === "sessions"
                          ? "text-white font-semibold"
                          : "text-slate-600 font-medium"
                      }`}
                    >
                      Courses & Sessions
                    </Text>
                  </View>
                  {badges.sessionsCount !== undefined && (
                    <View
                      className={`px-1.5 py-0.5 rounded ${
                        activeTab === "sessions"
                          ? "bg-white/20"
                          : "bg-slate-200/70"
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-semibold ${
                          activeTab === "sessions"
                            ? "text-white"
                            : "text-slate-700"
                        }`}
                      >
                        {badges.sessionsCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                <Text className="px-3 py-1 mt-2 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  Workspaces
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    router.push("/(lecturer)");
                  }}
                  className="flex-row items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70"
                >
                  <View className="flex-row items-center gap-2.5">
                    <LayoutDashboard size={16} color="#007BFF" />
                    <Text className="text-xs font-medium text-slate-700">
                      Lecturer Console
                    </Text>
                  </View>
                  <ChevronRight size={14} color="#94A3B8" />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    router.push("/(lecturer)");
                  }}
                  className="flex-row items-center justify-between px-3.5 py-2.5 rounded-xl bg-blue-500 mb-1.5"
                >
                  <View className="flex-row items-center gap-2.5">
                    <LayoutDashboard size={16} color="#FFFFFF" />
                    <Text className="text-xs font-semibold text-white">
                      Lecturer Dashboard
                    </Text>
                  </View>
                  <ChevronRight size={14} color="#FFFFFF" />
                </TouchableOpacity>

                {user?.role === "admin" && (
                  <TouchableOpacity
                    onPress={() => {
                      onClose();
                      router.push("/(admin)");
                    }}
                    className="flex-row items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70"
                  >
                    <View className="flex-row items-center gap-2.5">
                      <ShieldCheck size={16} color="#059669" />
                      <Text className="text-xs font-medium text-slate-700">
                        Admin Console
                      </Text>
                    </View>
                    <ChevronRight size={14} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* Quick Actions */}
            <View className="pt-4">
              <Text className="px-3 py-1 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Quick Actions
              </Text>
              {isAdmin && onProvisionClick && (
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    onProvisionClick();
                  }}
                  className="mt-1 flex-row items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-blue-50"
                >
                  <UserPlus size={16} color="#0069D9" />
                  <Text className="text-xs font-semibold text-blue-600">
                    Provision Lecturer
                  </Text>
                </TouchableOpacity>
              )}

              {onCreateCourseClick && (
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    onCreateCourseClick();
                  }}
                  className="mt-1.5 flex-row items-center gap-2.5 px-3.5 py-2 rounded-xl"
                >
                  <PlusCircle size={15} color="#64748B" />
                  <Text className="text-xs font-medium text-slate-600">
                    New Course
                  </Text>
                </TouchableOpacity>
              )}

              {onCreateSessionClick && (
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    onCreateSessionClick();
                  }}
                  className="mt-1 flex-row items-center gap-2.5 px-3.5 py-2 rounded-xl"
                >
                  <PlusCircle size={15} color="#64748B" />
                  <Text className="text-xs font-medium text-slate-600">
                    New Session
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          {/* Footer Status & Logout */}
          <View className="p-3 pb-8 border-t border-slate-200/80 space-y-2">
            <View className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/60 flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-1.5">
                <Server size={12} color="#10B981" />
                <Text className="text-[10px] text-slate-500 font-medium">
                  ENGINE
                </Text>
              </View>
              <Text className="text-[10px] text-emerald-600 font-semibold">
                CONNECTED
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                onClose();
                onLogout();
              }}
              className="w-full flex-row items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200/70"
            >
              <LogOut size={14} color="#E11D48" />
              <Text className="text-xs font-semibold text-rose-600">
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Backdrop click area */}
        <Pressable className="flex-1" onPress={onClose} />
      </View>
    </Modal>
  );
}
