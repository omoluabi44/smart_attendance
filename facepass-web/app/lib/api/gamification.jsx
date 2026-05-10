import {baseApi} from './apiSlice';

export const gamificationApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        score: builder.mutation({
            query: ({userID, courseID, score}) => ({
                url: '/score',
                method: 'POST',
                body: {userID, courseID, score},
            }),
        }),
        getScoreAVG: builder.query({
            query: (userID) => `score/${userID}`,
        }),
        getCourseScoreAVG: builder.query({
            query: ({userID, courseID}) => `score/${userID}/${courseID}`,
        }),
        getPoint: builder.query({
            query: (userID) => `streak/${userID}`,
        }),
        point: builder.mutation({
            query: ({userID, note_id}) => ({
                url: '/point',
                method: 'POST',
                body: {userID, note_id},
            }),
        }),

        //rank
        getRank: builder.query({
            query: (userID) => `rank/${userID}`,
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetScoreAVGQuery,
    useGetCourseScoreAVGQuery,
    useGetPointQuery,
    usePointMutation,
    useGetRankQuery,
    useScoreMutation
} = gamificationApi;