import { createSlice } from "@reduxjs/toolkit";
import {
  createAncillary,
  getAncillaryById,
  getAllAncillaries,
  updateAncillary,
  deleteAncillary
} from "./ancillaryThunk.js";

const initialState = {
  ancillaries: [],
  ancillary: null,
  ancillariesByCategory: {}, // Grouped by category for UI
  loading: false,
  error: null
};

const toAncillaryArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const normalizeAncillary = (payload) => payload?.data ?? payload ?? null;

const ancillarySlice = createSlice({
  name: "ancillary",
  initialState,
  reducers: {
    clearAncillaryError: (state) => {
      state.error = null;
    },
    clearCurrentAncillary: (state) => {
      state.ancillary = null;
    },
    groupAncillariesByCategory: (state) => {
      // Group ancillaries by category for checkout UI
      state.ancillariesByCategory = toAncillaryArray(state.ancillaries).reduce((acc, ancillary) => {
        const category = ancillary.category || 'OTHER';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(ancillary);
        return acc;
      }, {});
    }
  },
  extraReducers: (builder) => {
    // CREATE
    builder
      .addCase(createAncillary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAncillary.fulfilled, (state, action) => {
        state.loading = false;
        const ancillary = normalizeAncillary(action.payload);
        state.ancillary = ancillary;
        if (ancillary) state.ancillaries.unshift(ancillary);
      })
      .addCase(createAncillary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // GET BY ID
    builder
      .addCase(getAncillaryById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAncillaryById.fulfilled, (state, action) => {
        state.loading = false;
        state.ancillary = normalizeAncillary(action.payload);
      })
      .addCase(getAncillaryById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // GET ALL
    builder
      .addCase(getAllAncillaries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllAncillaries.fulfilled, (state, action) => {
        state.loading = false;
        state.ancillaries = toAncillaryArray(action.payload);
      })
      .addCase(getAllAncillaries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // UPDATE
    builder
      .addCase(updateAncillary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAncillary.fulfilled, (state, action) => {
        state.loading = false;
        const ancillary = normalizeAncillary(action.payload);
        state.ancillary = ancillary;
        const index = state.ancillaries.findIndex(a => a.id === ancillary?.id);
        if (index !== -1) state.ancillaries[index] = ancillary;
      })
      .addCase(updateAncillary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // DELETE
    builder
      .addCase(deleteAncillary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAncillary.fulfilled, (state, action) => {
        state.loading = false;
        state.ancillaries = state.ancillaries.filter(a => a.id !== action.payload);
        if (state.ancillary?.id === action.payload) state.ancillary = null;
      })
      .addCase(deleteAncillary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearAncillaryError, clearCurrentAncillary, groupAncillariesByCategory } = ancillarySlice.actions;
export default ancillarySlice.reducer;
