import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const AuthRequired = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default AuthRequired;