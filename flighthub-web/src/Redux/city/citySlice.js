import { createSlice } from "@reduxjs/toolkit";
import {
  getCitiesDropdown,
  searchCities,
  getAllCities,
  getCityById,
  createCity,
  updateCity,
  deleteCity,
  getCitiesByCountry
} from "./cityThunk";

const initialState = {
  // dropdown
  cities: [],

  // search
  searchResults: [],

  // main list (render UI)
  cityList: [],
  total: 0,

  // selected
  selectedCity: null,

  // loading
  loading: false,
  searchLoading: false,
  actionLoading: false,

  // error
  error: null,
};

const citySlice = createSlice({
  name: "city",
  initialState,

  reducers: {
    clearCityState: (state) => {
      state.cities = [];
      state.searchResults = [];
      state.cityList = [];
      state.selectedCity = null;
      state.error = null;
      state.total = 0;
    },

    setSelectedCity: (state, action) => {
      state.selectedCity = action.payload;
    },

    // 🔥 QUAN TRỌNG: dùng cho client filter + pagination
    setCityList: (state, action) => {
      state.cityList = action.payload;
    },

    // 🔥 update total khi client filter
    setTotal: (state, action) => {
      state.total = action.payload;
    }
  },

  extraReducers: (builder) => {
    builder

      // =========================
      // DROPDOWN
      // =========================
      .addCase(getCitiesDropdown.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCitiesDropdown.fulfilled, (state, action) => {
        state.loading = false;
        state.cities = action.payload;
      })
      .addCase(getCitiesDropdown.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // =========================
      // SEARCH
      // =========================
      .addCase(searchCities.pending, (state) => {
        state.searchLoading = true;
      })
      .addCase(searchCities.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload;

        // 🔥 optional: sync luôn UI
        state.cityList = action.payload;
        state.total = action.payload.length;
      })
      .addCase(searchCities.rejected, (state, action) => {
        state.searchLoading = false;
        state.error = action.payload;
      })

      // =========================
      // PAGINATION (SERVER)
      // =========================
      .addCase(getAllCities.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllCities.fulfilled, (state, action) => {
        state.loading = false;

        state.cityList = action.payload.content;
        state.total = action.payload.total;
      })
      .addCase(getAllCities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // =========================
      // BY COUNTRY
      // =========================
      .addCase(getCitiesByCountry.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCitiesByCountry.fulfilled, (state, action) => {
        state.loading = false;

        state.cityList = action.payload;
        state.total = action.payload.length;
      })
      .addCase(getCitiesByCountry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // =========================
      // GET BY ID
      // =========================
      .addCase(getCityById.fulfilled, (state, action) => {
        state.selectedCity = action.payload;
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

export const {
  clearCityState,
  setSelectedCity,
  setCityList,
  setTotal
} = citySlice.actions;

export default citySlice.reducer;