import { createAsyncThunk } from "@reduxjs/toolkit";

import api from "@/utils/api";
import { getApiErrorMessage, unwrapApiData } from "@/utils/flightOps";

const API_URL = "/api/coupons";

const rejectCouponError = (error, rejectWithValue, fallback) =>
  rejectWithValue(getApiErrorMessage(error, fallback));

export const createCoupon = createAsyncThunk(
  "coupon/create",
  async (data, { rejectWithValue }) => {
    try {
      return unwrapApiData(await api.post(API_URL, data));
    } catch (error) {
      return rejectCouponError(error, rejectWithValue, "Failed to create coupon");
    }
  },
);

export const getCouponById = createAsyncThunk(
  "coupon/getById",
  async (id, { rejectWithValue }) => {
    try {
      return unwrapApiData(await api.get(`${API_URL}/${id}`));
    } catch (error) {
      return rejectCouponError(error, rejectWithValue, "Coupon not found");
    }
  },
);

export const getAllCoupons = createAsyncThunk(
  "coupon/getAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { page = 0, size = 25, status, keyword, sort = "createdAt,desc" } = params;
      return unwrapApiData(
        await api.get(API_URL, {
          params: {
            page,
            size,
            sort,
            ...(status ? { status } : {}),
            ...(keyword ? { keyword } : {}),
          },
        }),
      );
    } catch (error) {
      return rejectCouponError(error, rejectWithValue, "Coupon API is not available yet");
    }
  },
);

export const getActiveCoupons = createAsyncThunk(
  "coupon/getActive",
  async (_, { rejectWithValue }) => {
    try {
      return unwrapApiData(await api.get(`${API_URL}/active`));
    } catch (error) {
      return rejectCouponError(error, rejectWithValue, "Failed to fetch active coupons");
    }
  },
);

export const updateCoupon = createAsyncThunk(
  "coupon/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return unwrapApiData(await api.put(`${API_URL}/${id}`, data));
    } catch (error) {
      return rejectCouponError(error, rejectWithValue, "Failed to update coupon");
    }
  },
);

export const deleteCoupon = createAsyncThunk(
  "coupon/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`${API_URL}/${id}`);
      return id;
    } catch (error) {
      return rejectCouponError(error, rejectWithValue, "Failed to delete coupon");
    }
  },
);

export const validateCoupon = createAsyncThunk(
  "coupon/validate",
  async (data, { rejectWithValue }) => {
    try {
      return unwrapApiData(await api.post(`${API_URL}/validate`, data));
    } catch (error) {
      return rejectCouponError(error, rejectWithValue, "Failed to validate coupon");
    }
  },
);

export const checkCouponCode = createAsyncThunk(
  "coupon/checkCode",
  async (code, { rejectWithValue }) => {
    try {
      return unwrapApiData(await api.get(`${API_URL}/check/${code}`));
    } catch (error) {
      return rejectCouponError(error, rejectWithValue, "Failed to check coupon code");
    }
  },
);
