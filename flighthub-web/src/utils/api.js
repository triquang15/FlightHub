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

export const AUTH_SESSION_EXPIRED_EVENT = "flighthub:auth-session-expired";

const notifySessionExpired = (reason = "Session expired") => {
  clearSession();
  isRefreshing = false;
  processQueue(new Error(reason), null);
  window.dispatchEvent(
    new CustomEvent(AUTH_SESSION_EXPIRED_EVENT, {
      detail: { reason },
    })
  );
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

    // Public auth endpoints should surface their own errors instead of forcing
    // the protected-route session-expired flow.
    const isPublicAuthEndpoint =
      originalRequest?.url?.includes("/api/auth/login") ||
      originalRequest?.url?.includes("/api/auth/signup") ||
      originalRequest?.url?.includes("/api/users/forgot-password") ||
      originalRequest?.url?.includes("/api/users/reset-password");

    // ============================
    // HANDLE 401 (ONLY FOR NON-AUTH)
    // ============================
    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isPublicAuthEndpoint
    ) {
      const normalizedMessage = message.toLowerCase();
      const sessionInvalidated =
        normalizedMessage.includes("invalid token") ||
        normalizedMessage.includes("token invalidated") ||
        normalizedMessage.includes("token revoked") ||
        normalizedMessage.includes("token expired") ||
        normalizedMessage.includes("jwt expired");

      if (sessionInvalidated) {
        notifySessionExpired(message || "Token invalidated");
        return Promise.reject(error);
      }

      // ❗ refresh endpoint failed → logout
      if (originalRequest.url.includes("/api/auth/refresh")) {
        notifySessionExpired(message || "Refresh token expired");
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
          notifySessionExpired("Missing refresh token");
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

        notifySessionExpired(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Refresh token expired"
        );
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
