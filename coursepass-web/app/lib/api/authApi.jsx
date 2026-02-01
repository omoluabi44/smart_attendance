// authApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
const API_URL = process.env.NEXT_PUBLIC_API_URL 
export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({ baseUrl:API_URL }),
  endpoints: (builder) => ({
   
    logins: builder.mutation({
      query: (credentials) => ({ url: 'auth/login', method: 'POST', body: credentials }),
    }),
     updateUser: builder.mutation({
      query: ({id, ...credentials}) => ({ url:  `/user/${id}`, method: 'PUT', body: credentials }),
    }),
      register: builder.mutation({
      query: (credentials) => ({ url:  'auth/register', method: 'POST', body: credentials }),
    }),
    code: builder.mutation({
      query: (credentials) => ({ url:  'auth/verify', method: 'POST', body: credentials }),
    }),
     resendCode: builder.mutation({
      query: (credentials) => ({ url:  'auth/resend_code', method: 'POST', body: credentials }),
    }),
  }),
});

export const { useLoginsMutation, useUpdateUserMutation, useRegisterMutation, useCodeMutation, useResendCodeMutation} = authApi;
