import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/api";
const API_URL = "/api/payments";
const unwrapApiData = (response) => response?.data?.data ?? response?.data;
const getApiErrorMessage = (err, fallback) => {
  const payload = err.response?.data;
  return (
    payload?.message ||
    payload?.error ||
    payload?.errorMessage ||
    payload?.errorCode ||
    err.message ||
    fallback
  );
};


// ---------- VERIFY PAYMENT ----------
/**
 * Verify payment after gateway callback
 * POST /api/payments/verify
 */
export const verifyPayment = createAsyncThunk(
  "payment/verify",
  async (request, { rejectWithValue }) => {
    try {
      const res = await api.post(`${API_URL}/verify`, request);
      return unwrapApiData(res);
    } catch (err) {
      return rejectWithValue(getApiErrorMessage(err, "Failed to verify payment"));
    }
  }
);





// ---------- GET ALL PAYMENTS ----------
/**
 * Get all payments (Admin only)
 * GET /api/payments
 */
export const getAllPayments = createAsyncThunk(
  "payment/getAll",
  async ({ page = 0, size = 20, sortBy = "createdAt", sortDirection = "DESC" } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        sortBy,
        sortDirection
      });

      console.log("📤 Fetching all payments with params:", { page, size, sortBy, sortDirection });
      const res = await api.get(`${API_URL}?${params.toString()}`);
      console.log("✅ getAllPayments success:", res.data);
      return res.data;
    } catch (err) {
      console.error("❌ getAllPayments error:", err.response?.data || err.message);
      return rejectWithValue(err.response?.data?.message || "Failed to fetch payments");
    }
  }
);





