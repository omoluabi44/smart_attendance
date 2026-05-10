import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  uni: null,
  col: null,
  dept: null,
  year: null
};

const schoolProfileSlice = createSlice({
  name: 'schoolProfile',
  initialState,
  reducers: {

    updateSchoolProfile: (state, action) => {
      const { uni, col, dept, year } = action.payload;

      if (uni !== undefined) state.uni = uni;
      if (col !== undefined) state.col = col;
      if (dept !== undefined) state.dept = dept;
      if (year !== undefined) state.year = year;
    },

    resetSchoolProfile: () => {
      return initialState;
    }
  }
});

export const { 
  updateSchoolProfile, 
  resetSchoolProfile 
} = schoolProfileSlice.actions;

export default schoolProfileSlice.reducer;
