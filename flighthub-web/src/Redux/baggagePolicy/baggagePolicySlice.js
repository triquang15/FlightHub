import { createSlice } from "@reduxjs/toolkit";
import {
  createPolicy,
  deletePolicy,
  getBaggagePolicyByFare,
  getPolicyByAirline,
  getPolicyById,
  updatePolicy,
} from "./baggagePolicyThunk.js";

const toPolicyArray = (payload) => {
  if (Array.isArray(payload)) return payload.filter(Boolean);
  if (Array.isArray(payload?.content)) return payload.content.filter(Boolean);
  if (Array.isArray(payload?.items)) return payload.items.filter(Boolean);
  return [];
};

const normalizePolicy = (policy) => {
  if (!policy || typeof policy !== "object") return null;
  return {
    ...policy,
    priorityBaggage: Boolean(policy.priorityBaggage),
    extraBaggageAllowance: Boolean(policy.extraBaggageAllowance),
  };
};

const initialState = {
  policies: [],
  policy: null,
  loading: false,
  error: null,
};

const baggagePolicySlice = createSlice({
  name: "baggagePolicy",
  initialState,
  reducers: {
    clearBaggagePolicyError: (state) => {
      state.error = null;
    },
    clearCurrentBaggagePolicy: (state) => {
      state.policy = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPolicy.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPolicy.fulfilled, (state, action) => {
        state.loading = false;
        const created = normalizePolicy(action.payload);
        if (created) {
          state.policy = created;
          state.policies = [
            created,
            ...toPolicyArray(state.policies).filter((policy) => policy.id !== created.id),
          ];
        }
      })
      .addCase(createPolicy.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updatePolicy.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePolicy.fulfilled, (state, action) => {
        state.loading = false;
        const updated = normalizePolicy(action.payload);
        if (!updated) return;
        state.policy = updated;
        const policies = toPolicyArray(state.policies);
        const index = policies.findIndex((policy) => policy.id === updated.id);
        if (index >= 0) {
          policies[index] = updated;
          state.policies = policies;
        } else {
          state.policies = [updated, ...policies];
        }
      })
      .addCase(updatePolicy.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getPolicyById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPolicyById.fulfilled, (state, action) => {
        state.loading = false;
        state.policy = normalizePolicy(action.payload);
      })
      .addCase(getPolicyById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getPolicyByAirline.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPolicyByAirline.fulfilled, (state, action) => {
        state.loading = false;
        state.policies = toPolicyArray(action.payload).map(normalizePolicy).filter(Boolean);
      })
      .addCase(getPolicyByAirline.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getBaggagePolicyByFare.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBaggagePolicyByFare.fulfilled, (state, action) => {
        state.loading = false;
        state.policy = normalizePolicy(action.payload);
      })
      .addCase(getBaggagePolicyByFare.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deletePolicy.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePolicy.fulfilled, (state, action) => {
        state.loading = false;
        state.policies = toPolicyArray(state.policies).filter((policy) => policy.id !== action.payload);
        if (state.policy?.id === action.payload) state.policy = null;
      })
      .addCase(deletePolicy.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearBaggagePolicyError, clearCurrentBaggagePolicy } = baggagePolicySlice.actions;
export default baggagePolicySlice.reducer;
