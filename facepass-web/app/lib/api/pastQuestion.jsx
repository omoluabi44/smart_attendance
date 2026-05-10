// lib/api/pastQuestion.js
import {baseApi} from './apiSlice';
export const pastQuestionsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getQuizeMetaData: builder.query({
            query: () => 'pastquestion/course',
        }),
        // Step 1: Get topics for the selected course
        getTopicsByCourse: builder.query({
            query: (courseID) => `/pastquestion/course/${courseID}`,
        }),
        // Step 2: Get uni/year for the selected course AND topic
        getFilterMetaByTopic: builder.query({
            query: ({ courseID, topicID }) => `/pastquestion/course/${courseID}/${topicID}`,
        }),
        getQuizeFilter: builder.query({
            query: ({ course, uni, year,topic }) => `course/${course}/quizes/${year}/${uni}/${topic}`,
        }),
    }),
    overrideExisting: true,
});

export const {
    useGetQuizeMetaDataQuery,
    useGetTopicsByCourseQuery,      // New
    useGetFilterMetaByTopicQuery,   // New
    useGetQuizeFilterQuery,
} = pastQuestionsApi;