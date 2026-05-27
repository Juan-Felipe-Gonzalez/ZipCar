import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "../slices/counterSlice";
import authReducer from "../slices/authSlice";
import tripReducer from "../slices/tripSlice";

const store = configureStore({
  reducer: {
    counter: counterReducer,
    auth: authReducer,
    trip: tripReducer,
  },
});

export default store;
