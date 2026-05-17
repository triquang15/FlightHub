import { createSlice } from "@reduxjs/toolkit";
import {
  getAllCities,
  createCity,
  updateCity,
  deleteCity
} from "./cityThunk";

const initialState = {
  cityList: [],
  total: 0,
  totalPages: 1,

  selectedCity: null,

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
  },

  extraReducers: (builder) => {
    builder

      // =========================
      // GET ALL
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
      // CREATE
      // =========================
      .addCase(createCity.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createCity.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(createCity.rejected, (state) => {
        state.actionLoading = false;
      })

      // =========================
      // UPDATE
      // =========================
      .addCase(updateCity.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateCity.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(updateCity.rejected, (state) => {
        state.actionLoading = false;
      })

      // =========================
      // DELETE
      // =========================
      .addCase(deleteCity.fulfilled, (state, action) => {
        state.cityList = state.cityList.filter(
          (c) => c.id !== action.payload
        );
        state.total -= 1;
      });
  },
});

export const { setSelectedCity } = citySlice.actions;

export default citySlice.reducer;