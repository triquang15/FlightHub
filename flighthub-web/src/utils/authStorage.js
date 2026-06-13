import { jwtDecode } from "jwt-decode";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
export const AUTH_TOKENS_CHANGED_EVENT = "flighthub:auth-tokens-changed";

const notifyAuthTokensChanged = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_TOKENS_CHANGED_EVENT));
  }
};

const getStorageWithToken = (key) => {
  if (localStorage.getItem(key)) return localStorage;
  if (sessionStorage.getItem(key)) return sessionStorage;
  return localStorage;
};

export const getAccessToken = () =>
  localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY);

export const getRefreshToken = () =>
  localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);

export const hasAuthTokens = () => Boolean(getAccessToken());

export const hasValidAccessToken = () => {
  const token = getAccessToken();
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    if (!decoded.exp) return true;

    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export const setAuthTokens = ({ accessToken, refreshToken }, rememberMe = true) => {
  const targetStorage = rememberMe ? localStorage : sessionStorage;
  const otherStorage = rememberMe ? sessionStorage : localStorage;

  otherStorage.removeItem(ACCESS_TOKEN_KEY);
  otherStorage.removeItem(REFRESH_TOKEN_KEY);

  if (accessToken) {
    targetStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }

  if (refreshToken) {
    targetStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  notifyAuthTokensChanged();
};

export const updateAuthTokens = ({ accessToken, refreshToken }) => {
  const targetStorage = getStorageWithToken(REFRESH_TOKEN_KEY);

  if (accessToken) {
    targetStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }

  if (refreshToken) {
    targetStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  notifyAuthTokensChanged();
};

export const clearAuthTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  notifyAuthTokensChanged();
};
