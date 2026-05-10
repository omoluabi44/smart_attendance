import {baseApi} from './apiSlice'

export const OutlineApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getOutline: builder.query({
      query: (id) => `course/${id}/outlines/`,
    }),
      getOutlineAi: builder.query({
      query: (id) => `course/${id}/ai_outlines/`,
    }),
    getConcept: builder.query({
      query: (id) => `concept/${id}/`,
    }),
     getConceptAi: builder.query({
      query: (id) => `ai_concept/${id}/`,
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetOutlineQuery,useGetConceptQuery, useGetOutlineAiQuery,useGetConceptAiQuery

} = OutlineApi;





