import React from "react";
import { Stack } from "expo-router";

export default function LecturerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#FAFAFA" },
      }}
    />
  );
}
