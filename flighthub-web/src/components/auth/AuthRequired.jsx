import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { logoutLocal } from "@/Redux/auth/authSlice";
import { clearUserState } from "@/Redux/user/userSlice";
import { getUserProfile } from "@/Redux/user/userThunks";
import { refreshAccessToken } from "@/utils/api";
import { clearAuthTokens, getRefreshToken, hasValidAccessToken } from "@/utils/authStorage";

const getRoleHome = (role) => {
  if (role === "ROLE_SYSTEM_ADMIN") return "/super-admin";
  if (role === "ROLE_AIRLINE_OWNER") return "/airline";
  return "/traveler";
};

const AuthRequired = ({ children, allowedRoles }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [checkingSession, setCheckingSession] = useState(false);
  const hasValidSession = isAuthenticated && hasValidAccessToken();
  const canRestoreSession = Boolean(getRefreshToken());

  useEffect(() => {
    if (hasValidSession || checkingSession) return;

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearAuthTokens();
      dispatch(logoutLocal());
      dispatch(clearUserState());
      return;
    }

    let cancelled = false;
    setCheckingSession(true);

    refreshAccessToken()
      .then(() => dispatch(getUserProfile({ silent: true })).unwrap())
      .catch(() => {
        if (cancelled) return;
        clearAuthTokens();
        dispatch(logoutLocal());
        dispatch(clearUserState());
      })
      .finally(() => {
        if (!cancelled) {
          setCheckingSession(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [checkingSession, dispatch, hasValidSession]);

  if (!hasValidSession && (checkingSession || canRestoreSession)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm font-medium text-muted-foreground">
        Restoring your session...
      </div>
    );
  }

  if (!hasValidSession) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(user?.role)) {
    return <Navigate to={getRoleHome(user?.role)} replace />;
  }

  return children;
};

export default AuthRequired;
