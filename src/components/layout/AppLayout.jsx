import { useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { Calendar, MapPin, User, LogOut, Plus, Menu, X, ChevronDown } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { Avatar } from "../ui/Avatar";
import { logout } from "../../api/auth";

const navItems = [
  { path: "/", label: "Events", icon: Calendar },
  { path: "/settings/venues", label: "Venues", icon: MapPin },
];

export const AppLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
    clearSession();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to="/" className="text-lg font-bold text-green-600">
              Kumpul
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/events/new"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Event
            </Link>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1 pr-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Avatar src={user?.avatar_url} name={user?.name} size="sm" />
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {user?.name?.split(" ")[0]}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {isProfileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProfileOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <Link
                      to="/settings/profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                    {user?.id && (
                      <Link
                        to={`/users/${user.id}/events`}
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Calendar className="w-4 h-4" />
                        My Events
                      </Link>
                    )}
                    <Link
                      to="/settings/venues"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <MapPin className="w-4 h-4" />
                      Venues
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 px-4 py-2 bg-white">
            <Link
              to="/events/new"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg mb-2"
            >
              <Plus className="w-4 h-4" />
              New Event
            </Link>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  location.pathname === item.path
                    ? "bg-green-50 text-green-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="px-4 py-4 max-w-4xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
