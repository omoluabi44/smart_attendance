import { baseApi } from './apiSlice';

export const Staging = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // ================= QUERIES =================

    getStagingCourse: builder.query({
      query: () => '/staging/courses',
      // Tells Redux: "This query provides the list of courses"
      providesTags: ['StagingCourses'],
    }),

    getByCourse: builder.query({
      query: (courseID) => `/staging/${courseID}`,
      // Tells Redux: "This query provides the data for the comparison view"
      providesTags: ['StagingData'],
    }),

    // (Note: This looks like a mutation URL used as a query, but keeping as requested)
    getStageOutline: builder.query({
      query: () => '/staging/confirm_new_outline',
    }),

    // ================= MUTATIONS =================

    stagingConfirm: builder.mutation({
      // FIXED: Backend expects 'tmp_outline_id', not 'outline_id'
      query: ({ tmp_outline_id }) => ({
        url: '/staging/confirm_new_outline',
        method: 'POST',
        body: { tmp_outline_id },
      }),
      // Refreshes the comparison view AND the course list (in case it was the last item)
      invalidatesTags: ['StagingData', 'StagingCourses'],
    }),

    stagingMerge: builder.mutation({
      query: ({ tmp_outline_id, target_main_id }) => ({
        url: '/staging/merge_outline',
        method: 'POST',
        body: { tmp_outline_id, target_main_id },
      }),
      // Refreshes the comparison view to show the merged items
      invalidatesTags: ['StagingData'],
    }),

    stagingPromote: builder.mutation({
      query: ({ tmp_note_id, target_main_outline_id }) => ({
        url: '/staging/promote/concept',
        method: 'POST',
        body: { tmp_note_id, target_main_outline_id },
      }),
      invalidatesTags: ['StagingData'],
    }),

    stageDiscard: builder.mutation({
      query: ({ type, id }) => ({
        url: '/staging/discard',
        method: 'DELETE',
        body: { type, id },
      }),
      invalidatesTags: ['StagingData', 'StagingCourses'],
    }),

      UpdateNote: builder.mutation({
      query: ( {id,content,youtube} ) => ({
        url: `/note/${id}`,
        method: 'PUT',
        body: { content,youtube },
      }),
      invalidatesTags: ['StagingData', 'StagingCourses'],
    }),



  }),

  overrideExisting: true,
});


// ✅ Export Hooks
export const {
  useGetStagingCourseQuery,
  useGetByCourseQuery,
  useGetStageOutlineQuery,
  useStagingConfirmMutation,
  useStagingMergeMutation,
  useStagingPromoteMutation,
  useStageDiscardMutation,
  useUpdateNoteMutation,
} = Staging;