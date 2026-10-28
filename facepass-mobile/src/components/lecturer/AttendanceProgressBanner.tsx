import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { CheckCircle2, AlertTriangle, X } from "lucide-react-native";

export interface AttendanceTaskState {
  status: "uploading" | "analyzing" | "polling" | "complete" | "error";
  mode: "photo" | "camera" | "video";
  progress: number;
  title: string;
  detail: string;
  result?: any;
}

export default function AttendanceProgressBanner({
  task,
  onDismiss,
}: {
  task: AttendanceTaskState | null;
  onDismiss: () => void;
}) {
  if (!task) return null;

  const isWorking =
    task.status === "uploading" ||
    task.status === "analyzing" ||
    task.status === "polling";
  const isComplete = task.status === "complete";
  const isError = task.status === "error";

  return (
    <View className="absolute bottom-5 left-4 right-4 z-50">
      <View
        className={`rounded-2xl border p-4 shadow-2xl ${
          isError
            ? "bg-rose-950 border-rose-500/40"
            : isComplete
            ? "bg-obsidian-950 border-emerald-500/40"
            : "bg-obsidian-950 border-blue-500/40"
        }`}
      >
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-row items-start gap-3 flex-1">
            <View className="mt-0.5">
              {isWorking && <ActivityIndicator size="small" color="#3395FF" />}
              {isComplete && <CheckCircle2 size={20} color="#34D399" />}
              {isError && <AlertTriangle size={20} color="#FB7185" />}
            </View>

            <View className="flex-1">
              <View className="flex-row items-center justify-between gap-2">
                <Text
                  className="text-xs font-bold uppercase tracking-wider text-white flex-1"
                  numberOfLines={1}
                >
                  {task.title}
                </Text>
                <Text className="text-[11px] font-bold text-blue-400">
                  {task.progress}%
                </Text>
              </View>
              <Text className="text-xs text-slate-300 mt-1 leading-relaxed">
                {task.detail}
              </Text>
            </View>
          </View>

          {!isWorking && (
            <TouchableOpacity
              onPress={onDismiss}
              className="p-1.5 rounded-lg bg-slate-800/80"
            >
              <X size={14} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Progress Track */}
        <View className="mt-3 w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <View
            style={{ width: `${Math.min(100, Math.max(5, task.progress))}%` }}
            className={`h-full rounded-full ${
              isError
                ? "bg-rose-500"
                : isComplete
                ? "bg-emerald-400"
                : "bg-blue-500"
            }`}
          />
        </View>

        {/* Completion Telemetry Summary */}
        {isComplete && task.result && (
          <View className="mt-3 pt-2.5 border-t border-slate-800 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <Text className="text-[11px] text-emerald-400 font-semibold">
                {task.result.marked_present_count ??
                  (task.result.present_students || []).length ??
                  0}{" "}
                Present
              </Text>
              {task.result.already_marked_today_count > 0 && (
                <Text className="text-[11px] text-blue-300">
                  {task.result.already_marked_today_count} Already Logged
                </Text>
              )}
              {task.result.unmatched_faces_count > 0 && (
                <Text className="text-[11px] text-amber-400">
                  {task.result.unmatched_faces_count} Unmatched
                </Text>
              )}
            </View>
            <Text className="text-[10px] text-slate-400">
              Roster Updated
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
