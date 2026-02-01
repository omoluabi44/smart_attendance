import {createSlice} from '@reduxjs/toolkit'
import Cookies from "js-cookie";

const initialState = {
  isLoggedIn: false,
  id: null,
  access_token: null,
  email: null,
  profile_url: null,
  balance: null

}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    login: (state, action) => {
      // action.payload should be the user id
      state.isLoggedIn = true
      state.id = action.payload.id
      state.access_token = action.payload.access_token
      state.email = action.payload.email
      state.profile_url = action.payload.profile_url
    },
    logout: (state) => {
      state.isLoggedIn = false
      state.id = null
      state.access_token = null
      Cookies.remove("refresh_token_cookies");
      Cookies.remove("user_id")
      Cookies.remove("refresh_token")
      Cookies.remove("access_token")
      Cookies.remove("is_new")

    },
    updateAccessToken: (state, action) => {

      state.access_token = action.payload;
    },
    updateBalance: (state, action) => {

      state.balance = action.payload;
    },

  },
})

export const {login, logout, updateAccessToken, updateBalance} = userSlice.actions
export default userSlice.reducer
