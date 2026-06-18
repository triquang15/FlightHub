import { createSlice } from "@reduxjs/toolkit";
import {
  confirmSeatInstances,
  fetchAvailableSeatInstancesByFlightInstance,
  fetchSeatInstancesByFlightInstance,
  holdSeatInstances,
  releaseSeatInstances,
  updateSeat
} from "./seatThunk.js";

const initialState = {
  seats: [],
  seat: null,
  selectedHold: null,
  holdLoading: false,
  loading: false,
  error: null
};

const seatSlice = createSlice({
  name: "seat",
  initialState,
  reducers: {
    clearSeatError: (state) => {
      state.error = null;
    },
    clearCurrentSeat: (state) => {
      state.seat = null;
    },
    clearSeatHold: (state) => {
      state.selectedHold = null;
    }
  },
  extraReducers: (builder) => {
    // ---------- UPDATE ----------
    builder
      .addCase(updateSeat.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSeat.fulfilled, (state, action) => {
        state.loading = false;
        state.seat = action.payload;

        const index = state.seats.findIndex(s => s.id === action.payload.id);
        if (index !== -1) state.seats[index] = action.payload;
      })
      .addCase(updateSeat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchSeatInstancesByFlightInstance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSeatInstancesByFlightInstance.fulfilled, (state, action) => {
        state.loading = false;
        state.seats = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchSeatInstancesByFlightInstance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAvailableSeatInstancesByFlightInstance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailableSeatInstancesByFlightInstance.fulfilled, (state, action) => {
        state.loading = false;
        state.seats = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchAvailableSeatInstancesByFlightInstance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(holdSeatInstances.pending, (state) => {
        state.holdLoading = true;
        state.error = null;
      })
      .addCase(holdSeatInstances.fulfilled, (state, action) => {
        state.holdLoading = false;
        state.selectedHold = action.payload;
        const heldSeats = action.payload?.seats || [];
        heldSeats.forEach((heldSeat) => {
          const index = state.seats.findIndex((seat) => seat.id === heldSeat.id);
          if (index !== -1) state.seats[index] = heldSeat;
        });
      })
      .addCase(holdSeatInstances.rejected, (state, action) => {
        state.holdLoading = false;
        state.error = action.payload;
      })
      .addCase(releaseSeatInstances.fulfilled, (state, action) => {
        const releasedSeats = Array.isArray(action.payload) ? action.payload : [];
        releasedSeats.forEach((releasedSeat) => {
          const index = state.seats.findIndex((seat) => seat.id === releasedSeat.id);
          if (index !== -1) state.seats[index] = releasedSeat;
        });
        state.selectedHold = null;
      })
      .addCase(confirmSeatInstances.fulfilled, (state, action) => {
        const confirmedSeats = Array.isArray(action.payload) ? action.payload : [];
        confirmedSeats.forEach((confirmedSeat) => {
          const index = state.seats.findIndex((seat) => seat.id === confirmedSeat.id);
          if (index !== -1) state.seats[index] = confirmedSeat;
        });
      });
  }
});

export const { clearSeatError, clearCurrentSeat, clearSeatHold } = seatSlice.actions;
export default seatSlice.reducer;
