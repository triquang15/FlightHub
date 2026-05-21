import { createSlice } from "@reduxjs/toolkit";
import {
  createAirport,
  deleteAirport,
  getAirportById,
  listAllAirports,
  updateAirport,
  detectTimezone
} from "./airportThunk";

const initialState = {
  airports: [],
  airport: null,

  total: 0,
  totalPages: 1,

  loading: false,
  actionLoading: false,

  timezone: null,
  error: null
};

const airportSlice = createSlice({
  name: "airport",
  initialState,

  reducers: {
    clearAirportError: (state) => {
      state.error = null;
    },
    clearSelectedAirport: (state) => {
      state.airport = null;
    }
  },

  extraReducers: (builder) => {
    builder

      // ================= LIST =================
      .addCase(listAllAirports.pending, (state) => {
        state.loading = true;
      })
      .addCase(listAllAirports.fulfilled, (state, action) => {
        state.loading = false;

        state.airports = action.payload.content || [];
        state.total = action.payload.totalElements || 0;
        state.totalPages = action.payload.totalPages || 1;
      })
      .addCase(listAllAirports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ================= GET BY ID =================
      .addCase(getAirportById.fulfilled, (state, action) => {
        state.loading = false;
        state.airport = action.payload;
      })

      // ================= CREATE =================
      .addCase(createAirport.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createAirport.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.airports.unshift(action.payload);
      })
      .addCase(createAirport.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // ================= UPDATE =================
      .addCase(updateAirport.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateAirport.fulfilled, (state, action) => {
        state.actionLoading = false;

        const index = state.airports.findIndex(
          (a) => a.id === action.payload.id
        );

        if (index !== -1) {
          state.airports[index] = action.payload;
        }

        if (state.airport?.id === action.payload.id) {
          state.airport = action.payload;
        }
      })
      .addCase(updateAirport.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // ================= DELETE =================
      .addCase(deleteAirport.fulfilled, (state, action) => {
        state.airports = state.airports.filter(
          (a) => a.id !== action.payload
        );
        state.total -= 1;
      })

      // ================= DETECT TIMEZONE =================
      .addCase(detectTimezone.fulfilled, (state, action) => {
        state.timezone = action.payload;
      });
  }
});

export const {
  clearAirportError,
  clearSelectedAirport
} = airportSlice.actions;

export default airportSlice.reducer;