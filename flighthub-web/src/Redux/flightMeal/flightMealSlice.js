import { createSlice } from "@reduxjs/toolkit";
import {
  createFlightMeal,
  bulkCreateFlightMeals,
  fetchFlightMealsByFlightId,
  updateFlightMeal,
  updateFlightMealAvailability,
  deleteFlightMeal,
} from "./flightMealThunk";

const initialState = {
  flightMeals: [],
  currentFlightMeal: null,
  loading: false,
  error: null,
  totalPages: 0,
  totalElements: 0,
  currentPage: 0,
  pageSize: 20,
};

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.content)) return value.content;
  if (Array.isArray(value?.data?.content)) return value.data.content;
  return [];
};

const unwrapItem = (value) => value?.data ?? value;
const normalizeFlightMeal = (flightMeal) => {
  if (!flightMeal || typeof flightMeal !== "object") return null;
  return {
    ...flightMeal,
    available: flightMeal.available !== false,
    price: Number.isFinite(Number(flightMeal.price)) ? Number(flightMeal.price) : 0,
    currency: String(flightMeal.currency || "USD").toUpperCase(),
  };
};

const upsertFlightMeal = (state, payload) => {
  const item = normalizeFlightMeal(unwrapItem(payload));
  if (!item) return;
  const index = state.flightMeals.findIndex((flightMeal) => flightMeal.id === item.id);
  if (index >= 0) {
    state.flightMeals[index] = item;
  } else {
    state.flightMeals.push(item);
  }
  state.currentFlightMeal = item;
};

const flightMealSlice = createSlice({
  name: "flightMeal",
  initialState,
  reducers: {
    clearFlightMealError: (state) => {
      state.error = null;
    },
    clearCurrentFlightMeal: (state) => {
      state.currentFlightMeal = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create FlightMeal
      .addCase(createFlightMeal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createFlightMeal.fulfilled, (state, action) => {
        state.loading = false;
        upsertFlightMeal(state, action.payload);
      })
      .addCase(createFlightMeal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Bulk Create FlightMeals
      .addCase(bulkCreateFlightMeals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkCreateFlightMeals.fulfilled, (state, action) => {
        state.loading = false;
        asArray(action.payload).forEach((flightMeal) => upsertFlightMeal(state, flightMeal));
      })
      .addCase(bulkCreateFlightMeals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch FlightMeals By Flight ID
      .addCase(fetchFlightMealsByFlightId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFlightMealsByFlightId.fulfilled, (state, action) => {
        state.loading = false;
        state.flightMeals = asArray(action.payload).map(normalizeFlightMeal).filter(Boolean);
      })
      .addCase(fetchFlightMealsByFlightId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update FlightMeal
      .addCase(updateFlightMeal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateFlightMeal.fulfilled, (state, action) => {
        state.loading = false;
        upsertFlightMeal(state, action.payload);
      })
      .addCase(updateFlightMeal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update FlightMeal Availability
      .addCase(updateFlightMealAvailability.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateFlightMealAvailability.fulfilled, (state, action) => {
        state.loading = false;
        upsertFlightMeal(state, action.payload);
      })
      .addCase(updateFlightMealAvailability.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete FlightMeal
      .addCase(deleteFlightMeal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteFlightMeal.fulfilled, (state, action) => {
        state.loading = false;
        state.flightMeals = state.flightMeals.filter((fm) => fm.id !== action.payload);
        if (state.currentFlightMeal?.id === action.payload) {
          state.currentFlightMeal = null;
        }
      })
      .addCase(deleteFlightMeal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

  },
});

export const { clearFlightMealError, clearCurrentFlightMeal } = flightMealSlice.actions;
export default flightMealSlice.reducer;
