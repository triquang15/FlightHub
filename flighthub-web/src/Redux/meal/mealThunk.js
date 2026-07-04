import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api";
import { getApiErrorMessage, unwrapApiData } from "@/utils/flightOps";

const API_URL = "/api/meals";

const rejectMealError = (error, rejectWithValue, fallback) =>
  rejectWithValue(getApiErrorMessage(error, fallback));

export const createMeal = createAsyncThunk(
  "meal/create",
  async (mealData, { rejectWithValue }) => {
    try {
      return unwrapApiData(await api.post(API_URL, mealData));
    } catch (error) {
      return rejectMealError(error, rejectWithValue, "Failed to create meal");
    }
  },
);

export const fetchMealById = createAsyncThunk(
  "meal/fetchById",
  async (mealId, { rejectWithValue }) => {
    try {
      return unwrapApiData(await api.get(`${API_URL}/${mealId}`));
    } catch (error) {
      return rejectMealError(error, rejectWithValue, "Failed to fetch meal");
    }
  },
);

export const fetchMealsByAirlineId = createAsyncThunk(
  "meal/fetchByAirlineId",
  async (_, { rejectWithValue }) => {
    try {
      return unwrapApiData(await api.get(`${API_URL}/airline`));
    } catch (error) {
      return rejectMealError(error, rejectWithValue, "Failed to fetch meals");
    }
  },
);

export const searchMeals = createAsyncThunk(
  "meal/search",
  async ({ keyword, page = 0, size = 20 }, { rejectWithValue }) => {
    try {
      return unwrapApiData(await api.get(`${API_URL}/search`, {
        params: { keyword, page, size },
      }));
    } catch (error) {
      return rejectMealError(error, rejectWithValue, "Failed to search meals");
    }
  },
);

export const updateMeal = createAsyncThunk(
  "meal/update",
  async ({ mealId, mealData }, { rejectWithValue }) => {
    try {
      return unwrapApiData(await api.put(`${API_URL}/${mealId}`, mealData));
    } catch (error) {
      return rejectMealError(error, rejectWithValue, "Failed to update meal");
    }
  },
);

export const updateMealAvailability = createAsyncThunk(
  "meal/updateAvailability",
  async ({ mealId, available }, { rejectWithValue }) => {
    try {
      return unwrapApiData(await api.patch(`${API_URL}/${mealId}/availability`, null, {
        params: { available },
      }));
    } catch (error) {
      return rejectMealError(error, rejectWithValue, "Failed to update meal availability");
    }
  },
);

export const deleteMeal = createAsyncThunk(
  "meal/delete",
  async (mealId, { rejectWithValue }) => {
    try {
      await api.delete(`${API_URL}/${mealId}`);
      return mealId;
    } catch (error) {
      return rejectMealError(error, rejectWithValue, "Failed to delete meal");
    }
  },
);
