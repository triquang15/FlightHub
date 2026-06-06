import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { logoutLocal } from "@/Redux/auth/authSlice";
import { clearUserState } from "@/Redux/user/userSlice";
import { clearAuthTokens, hasValidAccessToken } from "@/utils/authStorage";

const getRoleHome = (role) => {
  if (role === "ROLE_SYSTEM_ADMIN") return "/super-admin";
  if (role === "ROLE_AIRLINE_OWNER") return "/airline";
  return "/traveler";
};

const AuthRequired = ({ children, allowedRoles }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
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

  if (allowedRoles?.length && !allowedRoles.includes(user?.role)) {
    return <Navigate to={getRoleHome(user?.role)} replace />;
  }

  return children;
};

export default AuthRequired;
