import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { logoutLocal } from "@/Redux/auth/authSlice";
import { clearUserState } from "@/Redux/user/userSlice";
import { clearAuthTokens, hasValidAccessToken } from "@/utils/authStorage";

const AuthRequired = ({ children }) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const hasValidSession = isAuthenticated && hasValidAccessToken();

  useEffect(() => {
    if (!hasValidSession) {
      clearAuthTokens();
      dispatch(logoutLocal());
      dispatch(clearUserState());
    }
  }, [dispatch, hasValidSession]);

  if (!hasValidSession) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default AuthRequired;
