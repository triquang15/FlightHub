import { createSlice } from "@reduxjs/toolkit";
import {
  createAirport,
  deleteAirport,
  getAirportById,
  listAllAirports,
  updateAirport,
  detectTimezone,
  fetchTimezones
} from "./airportThunk";

const initialState = {
  airports: [],
  airport: null,

  total: 0,
  totalPages: 1,

  loading: false,        // list + getById
  actionLoading: false,  // create/update/delete

  timezones: [],         // API timezones
  timezonesLoading: false,

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
    },
    clearTimezone: (state) => {
      state.timezone = null;
    }
  },

  extraReducers: (builder) => {
    builder

      // ================= LIST =================
      .addCase(listAllAirports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(listAllAirports.fulfilled, (state, action) => {
        state.loading = false;

        const payload = action.payload?.data ?? action.payload;
        const items = Array.isArray(payload) ? payload : payload?.content || [];

        state.airports = items;
        state.total = payload?.totalElements ?? items.length;
        state.totalPages = payload?.totalPages ?? 1;
      })
      .addCase(listAllAirports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ================= GET BY ID =================
      .addCase(getAirportById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAirportById.fulfilled, (state, action) => {
        state.loading = false;
        state.airport = action.payload;
      })
      .addCase(getAirportById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ================= CREATE =================
      .addCase(createAirport.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createAirport.fulfilled, (state, action) => {
        state.actionLoading = false;

        // add vào đầu list
        state.airports.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createAirport.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // ================= UPDATE =================
      .addCase(updateAirport.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateAirport.fulfilled, (state, action) => {
        state.actionLoading = false;

        const updated = action.payload;

        // update list
        const index = state.airports.findIndex((a) => a.id === updated.id);
        if (index !== -1) {
          state.airports[index] = updated;
        }

        // update detail
        if (state.airport?.id === updated.id) {
          state.airport = updated;
        }
      })
      .addCase(updateAirport.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // ================= DELETE =================
      .addCase(deleteAirport.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteAirport.fulfilled, (state, action) => {
        state.actionLoading = false;

        state.airports = state.airports.filter(
          (a) => a.id !== action.payload
        );

        state.total = Math.max(0, state.total - 1);

        if (state.airport?.id === action.payload) {
          state.airport = null;
        }
      })
      .addCase(deleteAirport.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // ================= FETCH TIMEZONES =================
      .addCase(fetchTimezones.pending, (state) => {
        state.timezonesLoading = true;
        state.error = null;
      })
      .addCase(fetchTimezones.fulfilled, (state, action) => {
        state.timezonesLoading = false;
        state.timezones = action.payload;
      })
      .addCase(fetchTimezones.rejected, (state, action) => {
        state.timezonesLoading = false;
        state.error = action.payload;
      })

      // ================= DETECT TIMEZONE =================
      .addCase(detectTimezone.pending, (state) => {
        state.timezone = null;
      })
      .addCase(detectTimezone.fulfilled, (state, action) => {
        state.timezone = action.payload;
      })
      .addCase(detectTimezone.rejected, (state) => {
        state.timezone = null;
      });
  }
});

export const {
  clearAirportError,
  clearSelectedAirport,
  clearTimezone
} = airportSlice.actions;

export default airportSlice.reducer;
