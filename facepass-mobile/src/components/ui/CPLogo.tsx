import React from "react";
import { View, Text } from "react-native";
import Svg, { Path, Circle, Line } from "react-native-svg";

export interface FacePassLogoProps {
  theme?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;
}

export default function CPLogo({
  theme = "light",
  size = "md",
  showBadge = true,
}: FacePassLogoProps) {
  const isDark = theme === "dark";

  const boxSizes = {
    sm: "w-8 h-8 rounded-lg",
    md: "w-10 h-10 rounded-xl",
    lg: "w-12 h-12 rounded-2xl",
  };

  const svgSizes = {
    sm: 19,
    md: 23,
    lg: 28,
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <View className="flex-row items-center gap-3">
      {/* Biometric Face Reticle Emblem */}
      <View
        className={`items-center justify-center ${boxSizes[size]} ${
          isDark
            ? "bg-obsidian-900 border border-blue-400/35"
            : "bg-blue-500 border border-blue-600"
        }`}
      >
        <Svg
          width={svgSizes[size]}
          height={svgSizes[size]}
          viewBox="0 0 36 36"
          fill="none"
        >
          {/* Corner Vision Reticles */}
          <Path
            d="M4 11V6C4 4.89543 4.89543 4 6 4H11"
            stroke={isDark ? "#3395FF" : "#FFFFFF"}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <Path
            d="M25 4H30C31.1046 4 32 4.89543 32 6V11"
            stroke={isDark ? "#3395FF" : "#FFFFFF"}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <Path
            d="M4 25V30C4 31.1046 4.89543 32 6 32H11"
            stroke={isDark ? "#3395FF" : "#FFFFFF"}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <Path
            d="M32 25V30C32 31.1046 31.1046 32 30 32H25"
            stroke={isDark ? "#3395FF" : "#FFFFFF"}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Biometric Nodes & Mesh */}
          <Circle cx="13.5" cy="14.5" r="1.6" fill="#FFFFFF" />
          <Circle cx="22.5" cy="14.5" r="1.6" fill="#FFFFFF" />
          <Path
            d="M18 14.5V19.5L16.5 20.5"
            stroke={isDark ? "#ADD5FF" : "#D6EAFF"}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M13.5 24C14.8 25.4 16.3 26 18 26C19.7 26 21.2 25.4 22.5 24"
            stroke={isDark ? "#3395FF" : "#FFFFFF"}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Laser Horizontal Scan Line */}
          <Line
            x1="7"
            y1="18"
            x2="29"
            y2="18"
            stroke={isDark ? "#70B5FF" : "#D6EAFF"}
            strokeWidth="1"
            strokeDasharray="2 2"
            strokeOpacity="0.85"
          />
        </Svg>
      </View>

      {/* Brand Wordmark & Vision Pill */}
      <View className="flex-col">
        <View className="flex-row items-center gap-2">
          <Text
            className={`${textSizes[size]} font-extrabold tracking-tight leading-none ${
              isDark ? "text-white" : "text-slate-950"
            }`}
          >
            face
            <Text className={isDark ? "text-blue-400" : "text-blue-500"}>
              Pass
            </Text>
          </Text>
          {showBadge && (
            <View
              className={`px-1.5 py-0.5 rounded border ${
                isDark
                  ? "bg-blue-500/15 border-blue-400/30"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <Text
                className={`text-[10px] font-semibold uppercase tracking-widest ${
                  isDark ? "text-blue-300" : "text-blue-600"
                }`}
              >
                CV•AI
              </Text>
            </View>
          )}
        </View>
        <Text
          className={`text-[10px] tracking-wider uppercase mt-0.5 ${
            isDark ? "text-slate-400" : "text-slate-500"
          }`}
        >
          Lecturer & Classroom OS
        </Text>
      </View>
    </View>
  );
}
