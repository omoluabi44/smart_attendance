import { baseApi } from './apiSlice';

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUser: builder.query({
      query: () => 'users',
    }),
    getUserById: builder.query({
      query: (id) => `user/${id}`,
    }),
  }),
  overrideExisting: false,
});

export const { useGetUserQuery, useGetUserByIdQuery } = usersApi;