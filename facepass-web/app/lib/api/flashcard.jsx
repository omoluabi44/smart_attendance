import { baseApi } from './apiSlice'

export const flashCardsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    
 getUserFlashcard: builder.query({
      query: (id) => `flashcards/${id}`,
    }),
       
  }),
  overrideExisting: false,
});

export const { 
  useGetUserFlashcardQuery, 
 
} = flashCardsApi;





