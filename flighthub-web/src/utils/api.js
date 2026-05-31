import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { getDeviceId } from "@/utils/device";
import { clearAuthTokens, getAccessToken, getRefreshToken, updateAuthTokens } from "@/utils/authStorage";

const BASE_URL = "http://localhost:8080";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const clearSession = () => {
  clearAuthTokens();
};

const redirectToLogin = () => {
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
};

// ============================
// REQUEST INTERCEPTOR
// ============================
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      
      // Extract userId from token and add X-User-Id header
      try {
        const decoded = jwtDecode(token);
        if (decoded.userId) {
          config.headers["X-User-Id"] = decoded.userId;
        }
      } catch (err) {
        console.error("Failed to decode token:", err);
      }
    }

    // 🔥 attach device id
    config.headers["X-Device-Id"] = getDeviceId();

    return config;
  },
  (error) => Promise.reject(error)
);

// ============================
// REFRESH CONTROL
// ============================
let isRefreshing = false;
let queue = [];

const processQueue = (error, token = null) => {
  queue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  queue = [];
};

// ============================
// RESPONSE INTERCEPTOR
// ============================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.response?.data?.detail ||
      "";

    // ❗ detect auth endpoints (IMPORTANT)
    const isAuthEndpoint =
      originalRequest?.url?.includes("/api/auth/login") ||
      originalRequest?.url?.includes("/api/auth/signup");

    // ============================
    // HANDLE 401 (ONLY FOR NON-AUTH)
    // ============================
    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      const sessionInvalidated =
        message.includes("Token invalidated") ||
        message.includes("Token revoked");

      if (sessionInvalidated) {
        clearSession();
        redirectToLogin();
        return Promise.reject(error);
      }

      // ❗ refresh endpoint failed → logout
      if (originalRequest.url.includes("/api/auth/refresh")) {
        clearSession();
        redirectToLogin();
        return Promise.reject(error);
      }

      // ============================
      // QUEUE WHEN REFRESHING
      // ============================
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getRefreshToken();

        // ❗ nếu không có refresh token → logout luôn
        if (!refreshToken) {
          // No refresh token available — clear local tokens and bubble the error.
          clearSession();
          redirectToLogin();
          return Promise.reject(error);
        }

        const res = await axios.post(
          `${BASE_URL}/api/auth/refresh`,
          { refreshToken },
          {
            headers: {
              "X-Device-Id": getDeviceId(),
            },
          }
        );

        const authResponse = res.data.data;
        const newAccessToken = authResponse.accessToken;
        const newRefreshToken = authResponse.refreshToken;

        updateAuthTokens({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        });

        // release queue
        processQueue(null, newAccessToken);

        // retry request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);

      } catch (err) {
        processQueue(err, null);

        // Clear tokens and rethrow the error so callers can handle navigation.
        clearSession();
        redirectToLogin();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    // ============================
    // ❗ IMPORTANT: PASS RAW ERROR
    // ============================
    return Promise.reject(error);
  }
);

export default api;
