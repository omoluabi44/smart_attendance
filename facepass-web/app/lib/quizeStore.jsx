import { create } from 'zustand';

export const useQuizStore = create((set) => ({
  results: {
    questions: [],
    courseID: '',
    mode: 'practice',
  },
  setResults: (newResults) => set({ results: newResults }),


  aiQuizData: null, 
  setAiQuizData: ({ courseID, data }) => set({ 
    aiQuizData: { 
      courseID: courseID, 
      data: data 
    } 
  }),
  clearAiQuizData: () => set({ aiQuizData: null }),
}));