import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { Avatar } from "../ui/Avatar";
import { Brand } from "./Brand";

export const PublicLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const sessionId = useAuthStore((state) => state.sessionId);

  const showEventNavbar = location.pathname.startsWith("/events/");
  const hideNavbar =
    location.pathname === "/login" || location.pathname === "/auth/callback";

  return (
    <div className="min-h-screen bg-gray-50">
      {!hideNavbar && (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-4 h-14 flex items-center justify-between">
            <Brand to="/" />

            <div className="flex items-center gap-3">
              {sessionId ? (
                <Link
                  to="/events/new"
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  New Event
                </Link>
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  New Event
                </button>
              )}

              <button
                onClick={() => navigate(sessionId ? "/settings/profile" : "/login")}
                className="flex items-center gap-2 p-1 pr-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Avatar
                  src={user?.avatar_url}
                  name={user?.name || "Guest"}
                  size="sm"
                />
                <span className="text-sm font-medium text-gray-700">
                  {sessionId ? user?.name?.split(" ")[0] : "Guest"}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        </header>
      )}

      {showEventNavbar || hideNavbar ? (
        <Outlet />
      ) : (
        <main className="px-4 py-4 max-w-4xl mx-auto">
          <Outlet />
        </main>
      )}
    </div>
  );
};

export default PublicLayout;
