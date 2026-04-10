import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { getGoogleLoginUrl } from "../api/auth";
import { Button } from "../components/ui/Button";
import { CalendarDays } from "lucide-react";
import { getErrorMessage } from "../utils/toast";

const LOGIN_RETURN_TO_KEY = "kumpul-login-return-to";

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const sessionId = useAuthStore((state) => state.sessionId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const locationStateReturnTo = location.state?.from
    ? `${location.state.from.pathname || ""}${location.state.from.search || ""}${location.state.from.hash || ""}`
    : "";
  const queryReturnTo = searchParams.get("returnTo") || "";
  const returnTo =
    queryReturnTo || locationStateReturnTo || sessionStorage.getItem(LOGIN_RETURN_TO_KEY) || "/";

  useEffect(() => {
    if (sessionId) {
      navigate(returnTo, { replace: true });
    }
  }, [sessionId, navigate, returnTo]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      sessionStorage.setItem(LOGIN_RETURN_TO_KEY, returnTo);
      const { login_url } = await getGoogleLoginUrl();
      window.location.href = login_url;
    } catch (error) {
      console.error("Failed to get login URL:", error);
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Kumpul</h1>
          <p className="text-gray-500">kumpul sama temen jadi gampang.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <Button
          onClick={handleGoogleLogin}
          loading={isLoading}
          className="w-full"
          size="lg"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>

        <p className="text-center text-xs text-gray-400 mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
