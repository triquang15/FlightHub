import axios from "axios";

const localHost = "http://localhost:8080";

const api = axios.create({
  baseURL: localHost,
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

    return config;
  },
  (error) => Promise.reject(error)
);

// ============================
// RESPONSE INTERCEPTOR
// ============================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      console.warn("401 detected → logout");

      // clear token
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      // redirect login
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;