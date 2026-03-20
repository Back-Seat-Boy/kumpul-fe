import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export const ProtectedRoute = ({ children }) => {
  const sessionId = useAuthStore((state) => state.sessionId);
  const isSessionValid = useAuthStore((state) => state.isSessionValid);
  const clearSession = useAuthStore((state) => state.clearSession);
  const location = useLocation();

  // Check if session exists and is not expired
  if (!sessionId || !isSessionValid()) {
    // Clear invalid session
    if (sessionId) {
      clearSession();
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
