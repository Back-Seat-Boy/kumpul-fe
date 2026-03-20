import { Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProtectedRoute, AppLayout, PublicLayout } from "./components/layout";
import { ToastContainer } from "./components/ui/Toast";
import {
  LoginPage,
  HomePage,
  CreateEventPage,
  EventDetailPage,
  PaymentPage,
  ProfilePage,
  VenuesPage,
  AuthCallbackPage,
} from "./pages";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        {/* Public routes */}
        <Route element={<PublicLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/events/:shareToken" element={<EventDetailPage />} />
        </Route>

        {/* Protected routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<HomePage />} />
          <Route path="/events/new" element={<CreateEventPage />} />
          <Route path="/events/:shareToken/payment" element={<PaymentPage />} />
          <Route path="/settings/profile" element={<ProfilePage />} />
          <Route path="/settings/venues" element={<VenuesPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </QueryClientProvider>
  );
}

export default App;
