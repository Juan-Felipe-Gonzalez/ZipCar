import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  activeTrip: null,
};

const tripSlice = createSlice({
  name: "trip",
  initialState,
  reducers: {
    setActiveTrip: (state, action) => {
      state.activeTrip = action.payload;
    },
    markTripPaidInProgress: (state) => {
      if (state.activeTrip) {
        state.activeTrip.status = "in_progress";
        state.activeTrip.paymentStatus = "paid";
      }
    },
    clearActiveTrip: (state) => {
      state.activeTrip = null;
    },
  },
});

export const {
  setActiveTrip,
  markTripPaidInProgress,
  clearActiveTrip,
} = tripSlice.actions;

export default tripSlice.reducer;
