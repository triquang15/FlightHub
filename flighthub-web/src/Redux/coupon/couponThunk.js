import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/api";
const API_URL = "/api/coupons";

// ✅ Create Coupon
export const createCoupon = createAsyncThunk(
  "coupon/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post(API_URL, data);
      console.log("✅ createCoupon success:", res.data);
      return res.data;
    } catch (err) {
      console.error(
        "❌ createCoupon error:",
        err.response?.data?.message || err.message
      );
      return rejectWithValue(
        err.response?.data?.message || "Failed to create coupon"
      );
    }
  }
);

// ✅ Get Coupon by ID
export const getCouponById = createAsyncThunk(
  "coupon/getById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`${API_URL}/${id}`);
      console.log("✅ getCouponById success:", res.data);
      return res.data;
    } catch (err) {
      console.error(
        "❌ getCouponById error:",
        err.response?.data?.message || err.message
      );
      return rejectWithValue(
        err.response?.data?.message || "Coupon not found"
      );
    }
  }
);

// ✅ Get All Coupons with Pagination and Filters
export const getAllCoupons = createAsyncThunk(
  "coupon/getAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const {
        page = 0,
        size = 10,
        status,
        keyword,
        sort = 'createdAt,desc'
      } = params;

      const queryParams = {
        page,
        size,
        sort,
        ...(status && { status }),
        ...(keyword && { keyword }),
      };

      const res = await api.get(API_URL, {
        params: queryParams,
        });
      console.log("✅ getAllCoupons success:", res.data);
      return res.data;
    } catch (err) {
      console.error(
        "❌ getAllCoupons error:",
        err.response?.data?.message || err.message
      );
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch coupons"
      );
    }
  }
);

// ✅ Get Active Coupons
export const getActiveCoupons = createAsyncThunk(
  "coupon/getActive",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get(`${API_URL}/active`);
      console.log("✅ getActiveCoupons success:", res.data);
      return res.data;
    } catch (err) {
      console.error(
        "❌ getActiveCoupons error:",
        err.response?.data?.message || err.message
      );
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch active coupons"
      );
    }
  }
);

// ✅ Update Coupon
export const updateCoupon = createAsyncThunk(
  "coupon/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`${API_URL}/${id}`, data, {
        });
      console.log("✅ updateCoupon success:", res.data);
      return res.data;
    } catch (err) {
      console.error(
        "❌ updateCoupon error:",
        err.response?.data?.message || err.message
      );
      return rejectWithValue(
        err.response?.data?.message || "Failed to update coupon"
      );
    }
  }
);

// ✅ Delete Coupon
export const deleteCoupon = createAsyncThunk(
  "coupon/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`${API_URL}/${id}`);
      console.log("✅ deleteCoupon success:", id);
      return id;
    } catch (err) {
      console.error(
        "❌ deleteCoupon error:",
        err.response?.data?.message || err.message
      );
      return rejectWithValue(
        err.response?.data?.message || "Failed to delete coupon"
      );
    }
  }
);

// ✅ Validate Coupon
export const validateCoupon = createAsyncThunk(
  "coupon/validate",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post(`${API_URL}/validate`, data);
      console.log("✅ validateCoupon success:", res.data);
      return res.data;
    } catch (err) {
      console.error(
        "❌ validateCoupon error:",
        err.response?.data?.message || err.message
      );
      return rejectWithValue(
        err.response?.data?.message || "Failed to validate coupon"
      );
    }
  }
);

// ✅ Check if Coupon Code Exists
export const checkCouponCode = createAsyncThunk(
  "coupon/checkCode",
  async (code, { rejectWithValue }) => {
    try {
      const res = await api.get(`${API_URL}/check/${code}`);
      console.log("✅ checkCouponCode success:", res.data);
      return res.data;
    } catch (err) {
      console.error(
        "❌ checkCouponCode error:",
        err.response?.data?.message || err.message
      );
      return rejectWithValue(
        err.response?.data?.message || "Failed to check coupon code"
      );
    }
  }
);
