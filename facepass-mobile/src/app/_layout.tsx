import "../../global.css";
import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { Provider } from "react-redux";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { store, useAppDispatch } from "@/lib/store";
import {
  hydrateAuth,
  loadAuthSessionFromStorage,
} from "@/lib/features/user/userSlice";

function AuthHydrator({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let mounted = true;
    loadAuthSessionFromStorage().then((session) => {
      if (mounted) {
        dispatch(hydrateAuth(session));
      }
    });
    return () => {
      mounted = false;
    };
  }, [dispatch]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthHydrator>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#FAFAFA" },
              animation: "fade_from_bottom",
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(lecturer)" />
            <Stack.Screen name="(admin)" />
          </Stack>
        </AuthHydrator>
      </SafeAreaProvider>
    </Provider>
  );
}
