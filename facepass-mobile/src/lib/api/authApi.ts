import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "./apiSlice";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({ baseUrl: API_URL, credentials: "include" }),
  endpoints: (builder) => ({
    logins: builder.mutation({
      query: (credentials: { email: string; password: string }) => ({
        url: "auth/login",
        method: "POST",
        body: credentials,
      }),
    }),
    updateUser: builder.mutation({
      query: ({ id, ...credentials }: { id: string; [key: string]: any }) => ({
        url: `/user/${id}`,
        method: "PUT",
        body: credentials,
      }),
    }),
    code: builder.mutation({
      query: (credentials: { userID: string; code: string }) => ({
        url: "auth/verify",
        method: "POST",
        body: credentials,
      }),
    }),
    resendCode: builder.mutation({
      query: (credentials: { userId: string }) => ({
        url: "auth/resend_code",
        method: "POST",
        body: credentials,
      }),
    }),
  }),
});

export const {
  useLoginsMutation,
  useUpdateUserMutation,
  useCodeMutation,
  useResendCodeMutation,
} = authApi;
