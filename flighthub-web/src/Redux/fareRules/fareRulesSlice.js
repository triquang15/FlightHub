import { createSlice } from "@reduxjs/toolkit";
import {
  createFareRule,
  getAllFareRules,
  getFareRuleById,
  updateFareRule,
  deleteFareRule,
  getFareRulesByAirline,
  getFareRuleByFare,
} from "./fareRulesThunk";

const toFareRuleArray = (payload) => {
  if (Array.isArray(payload)) return payload.filter(Boolean);
  if (Array.isArray(payload?.content)) return payload.content.filter(Boolean);
  if (Array.isArray(payload?.items)) return payload.items.filter(Boolean);
  return [];
};

const normalizeFareRule = (rule) => {
  if (!rule || typeof rule !== "object") return null;
  return {
    ...rule,
    isRefundable: Boolean(rule.isRefundable),
    isChangeable: Boolean(rule.isChangeable),
  };
};

const fareRulesSlice = createSlice({
  name: "fareRules",
  initialState: {
    fareRules: [],
    currentFareRule: null,
    loading: false,
    error: null,
    fareRule: null,
  },
  reducers: {
    clearFareRulesError: (state) => {
      state.error = null;
    },
    clearCurrentFareRule: (state) => {
      state.currentFareRule = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Fare Rule
      .addCase(createFareRule.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createFareRule.fulfilled, (state, action) => {
        state.loading = false;
        const created = normalizeFareRule(action.payload);
        if (created) {
          state.fareRules = [
            created,
            ...toFareRuleArray(state.fareRules).filter((rule) => rule.id !== created.id),
          ];
          state.currentFareRule = created;
        }
      })
      .addCase(createFareRule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get All Fare Rules
      .addCase(getAllFareRules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllFareRules.fulfilled, (state, action) => {
        state.loading = false;
        state.fareRules = toFareRuleArray(action.payload).map(normalizeFareRule).filter(Boolean);
      })
      .addCase(getAllFareRules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Fare Rule by ID
      .addCase(getFareRuleById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getFareRuleById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentFareRule = normalizeFareRule(action.payload);
      })
      .addCase(getFareRuleById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Fare Rule
      .addCase(updateFareRule.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateFareRule.fulfilled, (state, action) => {
        state.loading = false;
        const updated = normalizeFareRule(action.payload);
        if (!updated) return;
        const rules = toFareRuleArray(state.fareRules);
        const index = rules.findIndex((rule) => rule.id === updated.id);
        if (index !== -1) {
          rules[index] = updated;
          state.fareRules = rules;
        } else {
          state.fareRules = [updated, ...rules];
        }
        state.currentFareRule = updated;
      })
      .addCase(updateFareRule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete Fare Rule
      .addCase(deleteFareRule.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteFareRule.fulfilled, (state, action) => {
        state.loading = false;
        state.fareRules = toFareRuleArray(state.fareRules).filter(
          (rule) => rule.id !== action.payload
        );
        if (state.currentFareRule?.id === action.payload) {
          state.currentFareRule = null;
        }
      })
      .addCase(deleteFareRule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Fare Rules by Airline
      .addCase(getFareRulesByAirline.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getFareRulesByAirline.fulfilled, (state, action) => {
        state.loading = false;
        state.fareRules = toFareRuleArray(action.payload).map(normalizeFareRule).filter(Boolean);
      })
      .addCase(getFareRulesByAirline.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Fare Rule by Fare
      .addCase(getFareRuleByFare.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getFareRuleByFare.fulfilled, (state, action) => {
        state.loading = false;
        state.fareRule = normalizeFareRule(action.payload);
      })
      .addCase(getFareRuleByFare.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearFareRulesError, clearCurrentFareRule } = fareRulesSlice.actions;
export default fareRulesSlice.reducer;
