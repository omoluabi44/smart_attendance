import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export interface FacePassUser {
  id: string;
  name?: string;
  email: string;
  matric?: string;
  role: "admin" | "lecturer" | "student";
  must_change_password?: boolean;
  profile_url?: string;
}

export interface UserState {
  currentUser: FacePassUser | null;
  token: string | null;
  refreshToken: string | null;
  hydrated: boolean;
}

const TOKEN_KEY = "facepass_access_token";
const REFRESH_KEY = "facepass_refresh_token";
const USER_KEY = "facepass_user_profile";

export async function saveAuthSessionToStorage(
  user: FacePassUser,
  accessToken: string,
  refreshToken?: string | null
) {
  try {
    if (Platform.OS === "web") {
      localStorage.setItem(TOKEN_KEY, accessToken);
      if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
    if (refreshToken) {
      await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
    }
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  } catch (err) {
    console.warn("[FacePass Auth] Failed to persist session:", err);
  }
}

export async function clearAuthSessionFromStorage() {
  try {
    if (Platform.OS === "web") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(USER_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch (err) {
    console.warn("[FacePass Auth] Failed to clear session:", err);
  }
}

export async function loadAuthSessionFromStorage(): Promise<{
  user: FacePassUser | null;
  token: string | null;
  refreshToken: string | null;
}> {
  try {
    if (Platform.OS === "web") {
      const token = localStorage.getItem(TOKEN_KEY);
      const refreshToken = localStorage.getItem(REFRESH_KEY);
      const rawUser = localStorage.getItem(USER_KEY);
      return {
        user: rawUser ? JSON.parse(rawUser) : null,
        token,
        refreshToken,
      };
    }
    const [token, refreshToken, rawUser] = await Promise.all([
      SecureStore.getItemAsync(TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_KEY),
      SecureStore.getItemAsync(USER_KEY),
    ]);
    return {
      user: rawUser ? JSON.parse(rawUser) : null,
      token,
      refreshToken,
    };
  } catch {
    return { user: null, token: null, refreshToken: null };
  }
}

const initialState: UserState = {
  currentUser: null,
  token: null,
  refreshToken: null,
  hydrated: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    hydrateAuth: (
      state,
      action: PayloadAction<{
        user: FacePassUser | null;
        token: string | null;
        refreshToken: string | null;
      }>
    ) => {
      state.currentUser = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.hydrated = true;
    },
    login: (
      state,
      action: PayloadAction<{
        user: FacePassUser;
        token: string;
        refreshToken?: string | null;
      }>
    ) => {
      state.currentUser = action.payload.user;
      state.token = action.payload.token;
      if (action.payload.refreshToken !== undefined) {
        state.refreshToken = action.payload.refreshToken;
      }
      state.hydrated = true;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    updateCurrentUser: (
      state,
      action: PayloadAction<Partial<FacePassUser>>
    ) => {
      if (state.currentUser) {
        state.currentUser = { ...state.currentUser, ...action.payload };
      }
    },
    logout: (state) => {
      state.currentUser = null;
      state.token = null;
      state.refreshToken = null;
      state.hydrated = true;
    },
  },
});

export const { hydrateAuth, login, setToken, updateCurrentUser, logout } =
  userSlice.actions;

export default userSlice.reducer;
