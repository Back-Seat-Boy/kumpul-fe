import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Spinner } from "../components/ui/Spinner";

const LOGIN_RETURN_TO_KEY = "kumpul-login-return-to";

export const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const [error, setError] = useState(null);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const errorMsg = searchParams.get("error");
    const expiresAt = searchParams.get("expires_at");
    const returnTo = sessionStorage.getItem(LOGIN_RETURN_TO_KEY) || "/";

    if (errorMsg) {
      setError(decodeURIComponent(errorMsg));
      setTimeout(() => {
        navigate("/login");
      }, 3000);
      return;
    }

    // Check if session is expired
    if (expiresAt) {
      const expiryDate = new Date(expiresAt);
      const now = new Date();
      
      if (expiryDate <= now) {
        setError("Session has expired. Please login again.");
        setTimeout(() => {
          navigate("/login");
        }, 3000);
        return;
      }
    }

    if (sessionId) {
      // Build user object from individual query params
      const user = {
        id: searchParams.get("user_id"),
        name: decodeURIComponent(searchParams.get("user_name") || ""),
        email: decodeURIComponent(searchParams.get("user_email") || ""),
        email_verified: searchParams.get("email_verified") === "true",
        avatar_url: decodeURIComponent(searchParams.get("avatar_url") || ""),
      };

      // Validate we have required fields
      if (!user.id || !user.name || !user.email) {
        console.error("Missing user data from callback:", user);
        setError("Incomplete user data received");
        setTimeout(() => {
          navigate("/login");
        }, 3000);
        return;
      }

      setSession(sessionId, user, expiresAt);
      sessionStorage.removeItem(LOGIN_RETURN_TO_KEY);
      navigate(returnTo, { replace: true });
    } else {
      setError("Missing session ID");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    }
  }, [searchParams, setSession, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Login Failed</h1>
          <p className="text-gray-500">{error}</p>
          <p className="text-sm text-gray-400 mt-4">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <Spinner size="lg" />
      <p className="text-gray-500 mt-4">Completing login...</p>
    </div>
  );
};

export default AuthCallbackPage;
