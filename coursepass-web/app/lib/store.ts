// 


// app/lib/store.js
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web
import userReducer from '@/app/lib/features/user/userStore';
import schoolProfileReducer from '@/app/lib/features/user/profileStore';
import { authApi } from '@/app/lib/api/authApi';
import counterReducer from '@/app/lib/counter/counterSlice';
import {baseApi} from "@/app/lib/api/apiSlice"

// Combine your reducers first
const rootReducer = combineReducers({
  counter: counterReducer,
  user: userReducer,
  school:schoolProfileReducer,
  [authApi.reducerPath]: authApi.reducer,
  [baseApi.reducerPath]: baseApi.reducer,
});

const persistConfig = {
  key: 'root',
  storage,
  // You can blacklist parts of your state if you don't want them persisted.
  // For example, to avoid persisting RTK Query's state:
  blacklist: [authApi.reducerPath, baseApi.reducerPath],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const makeStore = () => {
  const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        // This is necessary to avoid a serialization error from redux-persist
        serializableCheck: false,
      }).concat(authApi.middleware, baseApi.middleware),
  });

  const persistor = persistStore(store);

  return { store, persistor };
};