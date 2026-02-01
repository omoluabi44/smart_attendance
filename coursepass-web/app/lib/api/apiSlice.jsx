import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { logout,updateAccessToken } from '../features/user/userStore';




const API_URL = process.env.NEXT_PUBLIC_API_URL 
const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState, extra }) => {
    const token = getState().user.access_token;

    // ✅ Skip adding token for refresh requests
    if (!extra?.skipAuth && token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  },
  credentials: 'include', 
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result?.error?.status === 401) {
    // Try to refresh
    const refreshResult = await baseQuery(
      { url: 'auth/refresh', method: 'POST' },
      { ...api, extra: { skipAuth: true } },
      extraOptions
    );

    if (refreshResult?.data?.access) {
      const access = refreshResult.data.access;
      api.dispatch(updateAccessToken(access));

      // Retry original request
      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};

export const baseApi = createApi({
  baseQuery: baseQueryWithReauth,
   tagTypes: [
    'StagingCourses',
    'StagingData',
  ],
  endpoints: () => ({}),
});
