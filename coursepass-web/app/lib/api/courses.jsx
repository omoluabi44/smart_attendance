import {baseApi} from './apiSlice'

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCourses: builder.query({
      query: (id) => `courses`,
    }),
    getUserEnroll: builder.query({
      query: (id) => `enrollment/user/${id}`,
    }),
    enrollUser: builder.mutation({
      query: ({userID, courseID, course_name}) => ({
        url: '/enrollment',
        method: 'POST',
        body: {userID, courseID, course_name},
      }),
    }),
    AiCourse: builder.mutation({
      query: ({ courseID, courseName,user_id}) => ({
        url: '/course/ai',
        method: 'POST',
        body: {courseID, courseName,user_id},
      }),
    }),
    deEnrollUser: builder.mutation({
      query: ({enrollID}) => ({

        url: `/enrollment/${enrollID}`,
        method: 'DELETE',

      }),
    }),

  }),
  overrideExisting: false,
});

export const {
  useGetCoursesQuery,
  useGetUserEnrollQuery,
  useEnrollUserMutation,
  useDeEnrollUserMutation,
  useAiCourseMutation
} = usersApi;





