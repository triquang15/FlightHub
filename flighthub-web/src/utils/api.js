import axios from "axios";
import { getDeviceId } from "@/utils/device";

const BASE_URL = "http://localhost:8080";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================
// REQUEST INTERCEPTOR
// ============================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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

    // ❗ detect auth endpoints (IMPORTANT)
    const isAuthEndpoint =
      originalRequest?.url?.includes("/api/auth/login") ||
      originalRequest?.url?.includes("/api/auth/signup");

    // ============================
    // HANDLE 401 (ONLY FOR NON-AUTH)
    // ============================
    if (
      status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      // ❗ refresh endpoint failed → logout
      if (originalRequest.url.includes("/api/auth/refresh")) {
        localStorage.clear();
        window.location.href = "/login";
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
        const refreshToken = localStorage.getItem("refreshToken");

        // ❗ nếu không có refresh token → logout luôn
        if (!refreshToken) {
          localStorage.clear();
          window.location.href = "/login";
          return Promise.reject(error);
        }

        const res = await axios.post(`${BASE_URL}/api/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken = res.data.data.accessToken;

        // save token mới
        localStorage.setItem("accessToken", newAccessToken);

        // release queue
        processQueue(null, newAccessToken);

        // retry request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);

      } catch (err) {
        processQueue(err, null);

        localStorage.clear();
        window.location.href = "/login";

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