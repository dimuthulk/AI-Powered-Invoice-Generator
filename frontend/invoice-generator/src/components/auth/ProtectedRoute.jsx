import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  // will integrate these values later
  const isAuthenticated = false;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
