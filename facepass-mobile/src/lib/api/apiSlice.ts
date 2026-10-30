import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import {
  setToken,
  logout,
  saveAuthSessionToStorage,
  clearAuthSessionFromStorage,
  UserState,
} from "@/lib/features/user/userSlice";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api/v1/";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as { user: UserState };
    const token = state.user?.token;
    if (token && !headers.has("authorization")) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const state = api.getState() as { user: UserState };
    const refreshToken = state.user?.refreshToken;
    const currentUser = state.user?.currentUser;

    // Attempt refresh using either stored refresh token header or cookie
    const refreshResult = await rawBaseQuery(
      {
        url: "auth/refresh",
        method: "POST",
        headers: refreshToken
          ? { Authorization: `Bearer ${refreshToken}` }
          : undefined,
      },
      api,
      extraOptions
    );

    const refreshData = refreshResult.data as { access?: string } | undefined;

    if (refreshData?.access) {
      api.dispatch(setToken(refreshData.access));
      if (currentUser) {
        await saveAuthSessionToStorage(
          currentUser,
          refreshData.access,
          refreshToken
        );
      }
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      await clearAuthSessionFromStorage();
      api.dispatch(logout());
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "User",
    "AdminStats",
    "AdminUsers",
    "AdminSessions",
    "Courses",
    "LecturerSessions",
    "SessionDetail",
    "StudentAudit",
    "SessionMaterials",
    "SessionQuizzes",
    "SessionTimetable",
  ],
  endpoints: () => ({}),
});
