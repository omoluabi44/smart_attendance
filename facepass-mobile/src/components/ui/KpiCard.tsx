import React from "react";
import { View, Text } from "react-native";

export interface KpiCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  variant?: "light" | "obsidian";
  valueColorClass?: string;
  icon?: React.ReactNode;
}

export default function KpiCard({
  label,
  value,
  sublabel,
  variant = "light",
  valueColorClass,
  icon,
}: KpiCardProps) {
  const isObsidian = variant === "obsidian";

  return (
    <View
      className={`flex-1 min-w-[46%] p-4 rounded-2xl border ${
        isObsidian
          ? "bg-obsidian-950 border-slate-800"
          : "bg-white border-slate-200/90"
      }`}
    >
      <View className="flex-row items-center justify-between mb-1.5">
        <Text
          className={`text-[10px] font-semibold uppercase tracking-wider ${
            isObsidian ? "text-blue-400" : "text-slate-400"
          }`}
          numberOfLines={1}
        >
          {label}
        </Text>
        {icon}
      </View>
      <Text
        className={`text-2xl font-bold ${
          valueColorClass
            ? valueColorClass
            : isObsidian
            ? "text-white"
            : "text-slate-900"
        }`}
      >
        {value}
      </Text>
      {sublabel ? (
        <Text
          className={`text-[11px] mt-1 ${
            isObsidian ? "text-slate-400" : "text-slate-500"
          }`}
          numberOfLines={1}
        >
          {sublabel}
        </Text>
      ) : null}
    </View>
  );
}
