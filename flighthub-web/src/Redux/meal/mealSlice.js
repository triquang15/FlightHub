import { createSlice } from "@reduxjs/toolkit";
import {
  createMeal,
  fetchMealById,
  fetchMealsByAirlineId,

  searchMeals,
  updateMeal,
  updateMealAvailability,
  deleteMeal,
} from "./mealThunk";

const initialState = {
  meals: [],
  currentMeal: null,
  loading: false,
  error: null,
  totalPages: 0,
  totalElements: 0,
  currentPage: 0,
  pageSize: 20,
};

const toMealArray = (payload) => {
  if (Array.isArray(payload)) return payload.filter(Boolean);
  if (Array.isArray(payload?.content)) return payload.content.filter(Boolean);
  if (Array.isArray(payload?.items)) return payload.items.filter(Boolean);
  return [];
};

const normalizeMeal = (meal) => {
  if (!meal || typeof meal !== "object") return null;
  return {
    ...meal,
    available: meal.available !== false,
    requiresAdvanceBooking: Boolean(meal.requiresAdvanceBooking),
  };
};

const mealSlice = createSlice({
  name: "meal",
  initialState,
  reducers: {
    clearMealError: (state) => {
      state.error = null;
    },
    clearCurrentMeal: (state) => {
      state.currentMeal = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Meal
      .addCase(createMeal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMeal.fulfilled, (state, action) => {
        state.loading = false;
        const created = normalizeMeal(action.payload);
        if (created) {
          state.meals = [
            created,
            ...toMealArray(state.meals).filter((meal) => meal.id !== created.id),
          ];
          state.currentMeal = created;
        }
      })
      .addCase(createMeal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Meal By ID
      .addCase(fetchMealById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMealById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMeal = normalizeMeal(action.payload);
      })
      .addCase(fetchMealById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Meals By Airline ID
      .addCase(fetchMealsByAirlineId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMealsByAirlineId.fulfilled, (state, action) => {
        state.loading = false;
        state.meals = toMealArray(action.payload).map(normalizeMeal).filter(Boolean);
      })
      .addCase(fetchMealsByAirlineId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      

      // Search Meals
      .addCase(searchMeals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchMeals.fulfilled, (state, action) => {
        state.loading = false;
        state.meals = toMealArray(action.payload).map(normalizeMeal).filter(Boolean);
        state.totalPages = action.payload.totalPages || 0;
        state.totalElements = action.payload.totalElements || 0;
        state.currentPage = action.payload.number || 0;
        state.pageSize = action.payload.size || 20;
      })
      .addCase(searchMeals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Meal
      .addCase(updateMeal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMeal.fulfilled, (state, action) => {
        state.loading = false;
        const updated = normalizeMeal(action.payload);
        if (!updated) return;
        const meals = toMealArray(state.meals);
        const index = meals.findIndex((m) => m.id === updated.id);
        if (index !== -1) {
          meals[index] = updated;
          state.meals = meals;
        } else {
          state.meals = [updated, ...meals];
        }
        state.currentMeal = updated;
      })
      .addCase(updateMeal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Meal Availability
      .addCase(updateMealAvailability.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMealAvailability.fulfilled, (state, action) => {
        state.loading = false;
        const updated = normalizeMeal(action.payload);
        if (!updated) return;
        const meals = toMealArray(state.meals);
        const index = meals.findIndex((m) => m.id === updated.id);
        if (index !== -1) {
          meals[index] = updated;
          state.meals = meals;
        }
        state.currentMeal = updated;
      })
      .addCase(updateMealAvailability.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete Meal
      .addCase(deleteMeal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMeal.fulfilled, (state, action) => {
        state.loading = false;
        state.meals = toMealArray(state.meals).filter((m) => m.id !== action.payload);
        if (state.currentMeal?.id === action.payload) {
          state.currentMeal = null;
        }
      })
      .addCase(deleteMeal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearMealError, clearCurrentMeal } = mealSlice.actions;
export default mealSlice.reducer;
