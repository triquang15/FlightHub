import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { logoutLocal } from "@/Redux/auth/authSlice";
import { clearUserState } from "@/Redux/user/userSlice";
import { getUserProfile } from "@/Redux/user/userThunks";
import { refreshAccessToken } from "@/utils/api";
import { clearAuthTokens, getRefreshToken, hasValidAccessToken } from "@/utils/authStorage";
import { getRoleHome } from "@/utils/roleRedirect";
import { PageLoader } from "@/components/common/LoadingSystem";

const AuthRequired = ({ children, allowedRoles }) => {
  const dispatch = useDispatch();
  const location = useLocation();
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
      <PageLoader
        message="Restoring your session..."
        detail="Checking your secure workspace access before continuing."
        className="min-h-screen bg-background"
      />
    );
  }

  if (!hasValidSession) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(user?.role)) {
    return <Navigate to={getRoleHome(user?.role)} replace />;
  }

  return children;
};

export default AuthRequired;
