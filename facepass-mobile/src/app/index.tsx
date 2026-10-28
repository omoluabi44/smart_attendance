import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ScanFace,
  ShieldCheck,
  ArrowRight,
  Lock,
  CheckCircle2,
  Layers,
  Activity,
} from "lucide-react-native";
import CPLogo from "@/components/ui/CPLogo";
import { useAppSelector } from "@/lib/store";

const PREVIEW_TABS = [
  {
    key: "scan",
    code: "01 // MULTI-FACE SCAN",
    title: "Classroom Biometric Capture",
    badge: "CONFIDENCE >= 90%",
    description:
      "Snap a single classroom group photo or walkthrough video. AWS Rekognition isolates up to 60 faces per frame against the per-course collection.",
    metrics: [
      { label: "Detected Faces", value: "42 / 44", tone: "text-emerald-400" },
      { label: "Mean Confidence", value: "98.7%", tone: "text-blue-400" },
      { label: "Inference Time", value: "1.14s", tone: "text-white" },
    ],
  },
  {
    key: "threshold",
    code: "02 // 75% THRESHOLD MATRIX",
    title: "Automated Exam Eligibility",
    badge: "SENATE POLICY",
    description:
      "Continuously evaluates every student's attendance ratio against expected lectures and flags at-risk students before final exams.",
    metrics: [
      { label: "Exam Eligible", value: "88.6%", tone: "text-emerald-400" },
      { label: "At-Risk (<75%)", value: "5 Students", tone: "text-amber-400" },
      { label: "Required Classes", value: "9 / 12", tone: "text-white" },
    ],
  },
  {
    key: "webhook",
    code: "03 // COURSEPASS WEBHOOK",
    title: "Real-Time Student Portal Sync",
    badge: "HMAC-SHA256",
    description:
      "Biometric enrollment happens once on CoursePass. Attendance logs, course materials, and pop quizzes sync back instantaneously.",
    metrics: [
      { label: "Collection Scope", value: "COL-CSC401", tone: "text-blue-400" },
      { label: "Device Storage", value: "0 Bytes", tone: "text-emerald-400" },
      { label: "Webhook Latency", value: "140ms", tone: "text-white" },
    ],
  },
];

export default function LandingScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const { currentUser, token } = useAppSelector((state) => state.user);

  const isAuthenticated = Boolean(token && currentUser);
  const activePreview = PREVIEW_TABS[activeTab];

  const handleEnterWorkspace = () => {
    if (!isAuthenticated) {
      router.push("/(auth)/login");
      return;
    }
    if (currentUser?.must_change_password) {
      router.push("/(auth)/change-password");
      return;
    }
    if (currentUser?.role === "admin") {
      router.push("/(admin)");
    } else {
      router.push("/(lecturer)");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA]">
      {/* Top Navbar */}
      <View className="px-5 py-3.5 bg-white border-b border-slate-200/80 flex-row items-center justify-between">
        <CPLogo theme="light" size="sm" />
        <TouchableOpacity
          onPress={handleEnterWorkspace}
          className="flex-row items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500"
        >
          <Lock size={13} color="#FFFFFF" />
          <Text className="text-xs font-semibold text-white">
            {isAuthenticated ? "Open Console" : "Faculty Sign In"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-6"
        showsVerticalScrollIndicator={false}
      >
        {/* System Telemetry Pill */}
        <View className="self-start flex-row items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 mb-4">
          <View className="w-2 h-2 rounded-full bg-blue-500" />
          <Text className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
            SMART ATTENDANCE & COURSE PORTAL
          </Text>
        </View>

        {/* Hero Headline */}
        <Text className="text-3xl font-extrabold text-slate-950 tracking-tight leading-tight">
          Zero-Friction Classroom Attendance{" "}
          <Text className="text-blue-500">&amp; Auditing.</Text>
        </Text>
        <Text className="text-sm text-slate-600 mt-3 leading-relaxed">
          Verify entire lecture halls in seconds with isolated per-course AWS
          Rekognition collections, automated 75% exam eligibility tracking, and
          real-time CoursePass synchronization.
        </Text>

        {/* Primary CTA Buttons */}
        <View className="flex-row items-center gap-3 mt-6">
          <TouchableOpacity
            onPress={handleEnterWorkspace}
            className="flex-1 flex-row items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-blue-500"
          >
            <Text className="text-sm font-bold text-white">
              {isAuthenticated
                ? `Continue as ${currentUser?.name?.split(" ")[0] || "Faculty"}`
                : "Sign In to Console"}
            </Text>
            <ArrowRight size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Interactive Obsidian Telemetry HUD Card */}
        <View className="mt-7 rounded-3xl bg-obsidian-950 border border-slate-800 p-5 shadow-xl">
          <View className="flex-row items-center justify-between pb-3.5 border-b border-slate-800">
            <View className="flex-row items-center gap-2">
              <ScanFace size={18} color="#3395FF" />
              <Text className="text-xs font-bold text-white uppercase tracking-wider">
                CLASSROOM OVERVIEW
              </Text>
            </View>
            <View className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-400/30">
              <Text className="text-[10px] font-bold text-emerald-400">
                {activePreview.badge}
              </Text>
            </View>
          </View>

          {/* Selector Tabs */}
          <View className="flex-row gap-1.5 mt-4">
            {PREVIEW_TABS.map((t, idx) => (
              <TouchableOpacity
                key={t.key}
                onPress={() => setActiveTab(idx)}
                className={`flex-1 py-2 px-2 rounded-xl border ${
                  activeTab === idx
                    ? "bg-blue-500 border-blue-400"
                    : "bg-slate-900 border-slate-800"
                }`}
              >
                <Text
                  className={`text-[10px] font-bold text-center ${
                    activeTab === idx ? "text-white" : "text-slate-400"
                  }`}
                  numberOfLines={1}
                >
                  {t.code.split(" // ")[1]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Active Preview Content */}
          <View className="mt-4 p-4 rounded-2xl bg-obsidian-900 border border-slate-800">
            <Text className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
              {activePreview.code}
            </Text>
            <Text className="text-base font-bold text-white mt-1">
              {activePreview.title}
            </Text>
            <Text className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              {activePreview.description}
            </Text>

            <View className="flex-row gap-2 mt-4 pt-3 border-t border-slate-800">
              {activePreview.metrics.map((m) => (
                <View
                  key={m.label}
                  className="flex-1 p-2.5 rounded-xl bg-obsidian-950 border border-slate-800/80"
                >
                  <Text
                    className="text-[9px] text-slate-400 uppercase"
                    numberOfLines={1}
                  >
                    {m.label}
                  </Text>
                  <Text className={`text-xs font-bold mt-1 ${m.tone}`}>
                    {m.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Architectural Guardrail Cards */}
        <View className="mt-6 mb-10 space-y-3">
          <View className="p-4 rounded-2xl bg-white border border-slate-200/90 flex-row items-start gap-3.5 mb-3">
            <View className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 items-center justify-center">
              <Layers size={18} color="#007BFF" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-900">
                Per-Course Biometric Compartmentalization
              </Text>
              <Text className="text-xs text-slate-500 mt-1 leading-relaxed">
                Each academic course provisions an isolated Rekognition
                collection (COL-CourseID) for sub-second O(1) matching accuracy.
              </Text>
            </View>
          </View>

          <View className="p-4 rounded-2xl bg-white border border-slate-200/90 flex-row items-start gap-3.5 mb-3">
            <View className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 items-center justify-center">
              <ShieldCheck size={18} color="#059669" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-900">
                Zero-Trace Ephemeral Mobile Privacy
              </Text>
              <Text className="text-xs text-slate-500 mt-1 leading-relaxed">
                Classroom photos and videos stream directly to S3 presigned URLs
                and are immediately purged from the lecturer&apos;s phone cache.
              </Text>
            </View>
          </View>

          <View className="p-4 rounded-2xl bg-white border border-slate-200/90 flex-row items-start gap-3.5">
            <View className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 items-center justify-center">
              <Activity size={18} color="#D97706" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-900">
                75% Eligibility &amp; Manual Override Auditing
              </Text>
              <Text className="text-xs text-slate-500 mt-1 leading-relaxed">
                Real-time watchlist flags students below 75% attendance and
                lets lecturers grant medical/excused overrides or export Excel
                sheets.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
