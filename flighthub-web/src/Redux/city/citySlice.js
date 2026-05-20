import { createSlice } from "@reduxjs/toolkit";
import {
  getAllCities,
  createCity,
  updateCity,
  deleteCity,
  getTimezones
} from "./cityThunk";

const initialState = {
  // ================= CITY =================
  cityList: [],
  total: 0,
  totalPages: 1,

  selectedCity: null,

  // ================= TIMEZONE =================
  timezones: [],
  timezoneLoading: false,

  // ================= LOADING =================
  loading: false,
  actionLoading: false,

  error: null,
};

const citySlice = createSlice({
  name: "city",
  initialState,

  reducers: {
    setSelectedCity: (state, action) => {
      state.selectedCity = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },

    resetCityState: () => initialState,
  },

  extraReducers: (builder) => {
    builder

      // =========================
      // GET ALL CITIES
      // =========================
      .addCase(getAllCities.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllCities.fulfilled, (state, action) => {
        state.loading = false;

        if (!action.payload) return;

        state.cityList = action.payload.content || [];
        state.total = action.payload.totalElements || 0;
        state.totalPages = action.payload.totalPages || 1;
      })
      .addCase(getAllCities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // =========================
      // CREATE CITY
      // =========================
      .addCase(createCity.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createCity.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(createCity.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // =========================
      // UPDATE CITY
      // =========================
      .addCase(updateCity.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateCity.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(updateCity.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // =========================
      // DELETE CITY
      // =========================
      .addCase(deleteCity.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(deleteCity.fulfilled, (state, action) => {
        state.actionLoading = false;

        state.cityList = state.cityList.filter(
          (c) => c.id !== action.payload
        );
        state.total = Math.max(0, state.total - 1);
      })
      .addCase(deleteCity.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // =========================
      // GET TIMEZONES (🔥 NEW)
      // =========================
      .addCase(getTimezones.pending, (state) => {
        state.timezoneLoading = true;
      })
      .addCase(getTimezones.fulfilled, (state, action) => {
        state.timezoneLoading = false;
        state.timezones = action.payload || [];
      })
      .addCase(getTimezones.rejected, (state, action) => {
        state.timezoneLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setSelectedCity,
  clearError,
  resetCityState
} = citySlice.actions;

export default citySlice.reducer;