import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { clearAuthError, logoutLocal } from "@/Redux/auth/authSlice";
import { clearUserState } from "@/Redux/user/userSlice";
import { clearAuthTokens, hasValidAccessToken } from "@/utils/authStorage";

const GuestOnly = ({ children }) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const hasValidSession = isAuthenticated && hasValidAccessToken();

  useEffect(() => {
    dispatch(clearAuthError());
    if (!hasValidAccessToken()) {
      clearAuthTokens();
      dispatch(logoutLocal());
      dispatch(clearUserState());
    }
  }, [dispatch]);

  if (hasValidSession) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default GuestOnly;
