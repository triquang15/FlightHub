import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api";
import { getApiErrorMessage, unwrapApiData } from "@/utils/flightOps";

const rejectFlightMealError = (error, rejectWithValue, fallback) =>
  rejectWithValue(getApiErrorMessage(error, fallback));

/**
 * Create a new flight meal
 */
export const createFlightMeal = createAsyncThunk(
  "flightMeal/create",
  async (flightMealData, { rejectWithValue }) => {
    try {
      return unwrapApiData(await api.post("/api/flight-meals", flightMealData));
    } catch (error) {
      return rejectFlightMealError(error, rejectWithValue, "Failed to create flight meal");
    }
  }
);

/**
 * Bulk create flight meals
 */
export const bulkCreateFlightMeals = createAsyncThunk(
  "flightMeal/bulkCreate",
  async (flightMealsData, { rejectWithValue }) => {
    try {
      return unwrapApiData(await api.post("/api/flight-meals/bulk", flightMealsData));
    } catch (error) {
      return rejectFlightMealError(error, rejectWithValue, "Failed to bulk create flight meals");
    }
  }
);

/**
 * Fetch flight meals by flight ID
 */
export const fetchFlightMealsByFlightId = createAsyncThunk(
  "flightMeal/fetchByFlightId",
  async (flightId, { rejectWithValue }) => {
    try {
      return unwrapApiData(await api.get(`/api/flight-meals/flight/${flightId}`));
    } catch (error) {
      return rejectFlightMealError(error, rejectWithValue, "Failed to fetch flight meals by flight");
    }
  }
);

/**
 * Update flight meal
 */
export const updateFlightMeal = createAsyncThunk(
  "flightMeal/update",
  async ({ flightMealId, flightMealData }, { rejectWithValue }) => {
    try {
      return unwrapApiData(await api.put(`/api/flight-meals/${flightMealId}`, flightMealData));
    } catch (error) {
      return rejectFlightMealError(error, rejectWithValue, "Failed to update flight meal");
    }
  }
);

/**
 * Update flight meal availability
 */
export const updateFlightMealAvailability = createAsyncThunk(
  "flightMeal/updateAvailability",
  async ({ flightMealId, available }, { rejectWithValue }) => {
    try {
      return unwrapApiData(await api.patch(
        `/api/flight-meals/${flightMealId}/availability`,
        null,
        {
          params: { available },
          }
      ));
    } catch (error) {
      return rejectFlightMealError(error, rejectWithValue, "Failed to update flight meal availability");
    }
  }
);

/**
 * Delete flight meal
 */
export const deleteFlightMeal = createAsyncThunk(
  "flightMeal/delete",
  async (flightMealId, { rejectWithValue }) => {
    try {
      await api.delete(`/api/flight-meals/${flightMealId}`);
      return flightMealId;
    } catch (error) {
      return rejectFlightMealError(error, rejectWithValue, "Failed to delete flight meal");
    }
  }
);
