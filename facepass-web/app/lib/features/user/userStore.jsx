import {createSlice} from '@reduxjs/toolkit'
import Cookies from "js-cookie";

const initialState = {
  isLoggedIn: false,
  id: null,
  name: null,
  access_token: null,
  email: null,
  profile_url: null,
  balance: null,
  role: 'student',
  must_change_password: false,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    login: (state, action) => {
      // action.payload should be the user id
      state.isLoggedIn = true
      state.id = action.payload.id
      state.name = action.payload.name || null
      state.access_token = action.payload.access_token
      state.email = action.payload.email
      state.profile_url = action.payload.profile_url
      state.role = action.payload.role || 'student'
      state.must_change_password = Boolean(action.payload.must_change_password)
    },
    logout: (state) => {
      state.isLoggedIn = false
      state.id = null
      state.name = null
      state.access_token = null
      state.must_change_password = false
      Cookies.remove("refresh_token_cookies");
      Cookies.remove("user_id")
      Cookies.remove("refresh_token")
      Cookies.remove("access_token")
      Cookies.remove("is_new")
      localStorage.removeItem("accessToken");
      localStorage.removeItem("persist:root"); // Clear persisted state if using redux-persist

    },
    updateAccessToken: (state, action) => {

      state.access_token = action.payload;
    },
    updateBalance: (state, action) => {

      state.balance = action.payload;
    },
    clearMustChangePassword: (state) => {
      state.must_change_password = false;
    },

  },
})

export const {login, logout, updateAccessToken, updateBalance, clearMustChangePassword} = userSlice.actions
export default userSlice.reducer
