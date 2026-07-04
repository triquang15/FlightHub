import { createSlice } from "@reduxjs/toolkit";
import {
  checkCouponCode,
  createCoupon,
  deleteCoupon,
  getActiveCoupons,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  validateCoupon,
} from "./couponThunk.js";

const emptyPage = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  size: 25,
  number: 0,
  first: true,
  last: true,
  numberOfElements: 0,
};

const initialState = {
  coupons: [],
  coupon: null,
  paginatedCoupons: emptyPage,
  activeCoupons: [],
  validationResult: null,
  loading: false,
  error: null,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
  validateLoading: false,
};

const toCouponArray = (payload) => {
  if (Array.isArray(payload)) return payload.filter(Boolean);
  if (Array.isArray(payload?.content)) return payload.content.filter(Boolean);
  if (Array.isArray(payload?.items)) return payload.items.filter(Boolean);
  return [];
};

const normalizeCoupon = (coupon) => {
  if (!coupon || typeof coupon !== "object") return null;
  const usageLimit = coupon.usageLimit ?? coupon.maxRedemptions ?? null;
  const usedCount = coupon.usedCount ?? coupon.redemptionCount ?? 0;
  return {
    ...coupon,
    code: String(coupon.code || "").toUpperCase(),
    status: coupon.status || "ACTIVE",
    discountType: coupon.discountType || "PERCENTAGE",
    discountValue: Number(coupon.discountValue ?? coupon.value ?? 0),
    usageLimit,
    usedCount,
    remainingUsage:
      usageLimit === null || usageLimit === undefined
        ? null
        : Math.max(Number(usageLimit) - Number(usedCount || 0), 0),
    perUserLimit: coupon.perUserLimit ?? 1,
    applicableCabinClasses: Array.isArray(coupon.applicableCabinClasses)
      ? coupon.applicableCabinClasses
      : [],
    applicableRoutes: Array.isArray(coupon.applicableRoutes) ? coupon.applicableRoutes : [],
  };
};

const toPage = (payload, fallback = emptyPage) => {
  const content = toCouponArray(payload).map(normalizeCoupon).filter(Boolean);
  return {
    ...fallback,
    ...(payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {}),
    content,
    totalElements: payload?.totalElements ?? content.length,
    totalPages: payload?.totalPages ?? (content.length > 0 ? 1 : 0),
    numberOfElements: payload?.numberOfElements ?? content.length,
  };
};

const upsertCoupon = (list, coupon) => {
  const items = toCouponArray(list).map(normalizeCoupon).filter(Boolean);
  const index = items.findIndex((item) => item.id === coupon.id);
  if (index === -1) return [coupon, ...items];
  items[index] = coupon;
  return items;
};

const couponSlice = createSlice({
  name: "coupon",
  initialState,
  reducers: {
    clearCouponState: (state) => {
      state.coupons = [];
      state.coupon = null;
      state.paginatedCoupons = emptyPage;
      state.activeCoupons = [];
      state.validationResult = null;
      state.error = null;
    },
    clearCoupon: (state) => {
      state.coupon = null;
      state.error = null;
    },
    clearValidationResult: (state) => {
      state.validationResult = null;
    },
    clearCouponError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCoupon.pending, (state) => {
        state.loading = true;
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.createLoading = false;
        const coupon = normalizeCoupon(action.payload);
        if (!coupon) return;
        state.coupon = coupon;
        state.coupons = upsertCoupon(state.coupons, coupon);
        state.paginatedCoupons = {
          ...state.paginatedCoupons,
          content: upsertCoupon(state.paginatedCoupons.content, coupon),
          totalElements: state.paginatedCoupons.totalElements + 1,
        };
      })
      .addCase(createCoupon.rejected, (state, action) => {
        state.loading = false;
        state.createLoading = false;
        state.error = action.payload;
      })

      .addCase(getCouponById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCouponById.fulfilled, (state, action) => {
        state.loading = false;
        state.coupon = normalizeCoupon(action.payload);
      })
      .addCase(getCouponById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(getAllCoupons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.paginatedCoupons = toPage(action.payload, state.paginatedCoupons);
        state.coupons = state.paginatedCoupons.content;
      })
      .addCase(getAllCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.paginatedCoupons = toPage([], state.paginatedCoupons);
        state.coupons = [];
      })

      .addCase(getActiveCoupons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getActiveCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.activeCoupons = toCouponArray(action.payload).map(normalizeCoupon).filter(Boolean);
      })
      .addCase(getActiveCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateCoupon.pending, (state) => {
        state.loading = true;
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.updateLoading = false;
        const coupon = normalizeCoupon(action.payload);
        if (!coupon) return;
        state.coupon = coupon;
        state.coupons = upsertCoupon(state.coupons, coupon);
        state.paginatedCoupons = {
          ...state.paginatedCoupons,
          content: upsertCoupon(state.paginatedCoupons.content, coupon),
        };
      })
      .addCase(updateCoupon.rejected, (state, action) => {
        state.loading = false;
        state.updateLoading = false;
        state.error = action.payload;
      })

      .addCase(deleteCoupon.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(deleteCoupon.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.coupons = toCouponArray(state.coupons).filter((coupon) => coupon.id !== action.payload);
        state.paginatedCoupons.content = toCouponArray(state.paginatedCoupons.content).filter(
          (coupon) => coupon.id !== action.payload,
        );
        state.paginatedCoupons.totalElements = Math.max(state.paginatedCoupons.totalElements - 1, 0);
        if (state.coupon?.id === action.payload) state.coupon = null;
      })
      .addCase(deleteCoupon.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload;
      })

      .addCase(validateCoupon.pending, (state) => {
        state.validateLoading = true;
        state.validationResult = null;
        state.error = null;
      })
      .addCase(validateCoupon.fulfilled, (state, action) => {
        state.validateLoading = false;
        state.validationResult = action.payload;
      })
      .addCase(validateCoupon.rejected, (state, action) => {
        state.validateLoading = false;
        state.error = action.payload;
      })

      .addCase(checkCouponCode.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkCouponCode.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(checkCouponCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearCouponState,
  clearCoupon,
  clearValidationResult,
  clearCouponError,
} = couponSlice.actions;

export default couponSlice.reducer;
