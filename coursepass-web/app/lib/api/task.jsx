import { baseApi } from './apiSlice';

export const TaskApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTask: builder.query({
      query: () => 'task',
    }),
       getTaskById: builder.query({
      query: (id) => `task/${id}`,
    }),
     getAllTask: builder.query({
      query: () => 'all_task',
    }),
    getTaskQuize: builder.query({
      query: (id) => `quize-task/${id}`,
    }),
  }),
  overrideExisting: false,
});

export const { useGetTaskQuery, useGetAllTaskQuery, useGetTaskQuizeQuery, useGetTaskByIdQuery} = TaskApi;