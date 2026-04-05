import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { Avatar } from "../ui/Avatar";

export const PublicLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const sessionId = useAuthStore((state) => state.sessionId);

  const showEventNavbar = location.pathname.startsWith("/events/");

  return (
    <div className="min-h-screen bg-gray-50">
      {showEventNavbar && (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-4 h-14 max-w-4xl mx-auto flex items-center justify-between">
            <Link
              to={sessionId ? "/" : "/login"}
              className="text-lg font-bold text-green-600"
            >
              Kumpul
            </Link>

            <button
              onClick={() => navigate(sessionId ? "/settings/profile" : "/login")}
              className="flex items-center gap-2 p-1 pr-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Avatar src={user?.avatar_url} name={user?.name || "Guest"} size="sm" />
              <span className="text-sm font-medium text-gray-700">
                {sessionId ? user?.name?.split(" ")[0] : "Guest"}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </header>
      )}
      <Outlet />
    </div>
  );
};

export default PublicLayout;
