import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Calendar, Search, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEvents } from "../hooks/useEvents";
import { useAuthStore } from "../store/authStore";
import { EventCard } from "../components/event/EventCard";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";

const EVENT_STATUSES = [
  { value: "", label: "All Status" },
  { value: "voting", label: "Voting" },
  { value: "confirmed", label: "Confirmed" },
  { value: "open", label: "Open" },
  { value: "payment_open", label: "Payment" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
];

const EVENT_VISIBILITIES = [
  { value: "", label: "All Visibility" },
  { value: "public", label: "Public" },
  { value: "invite_only", label: "Invite only" },
];

const LIMIT = 10;

export const HomePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionId = useAuthStore((state) => state.sessionId);
  const isLoggedIn = !!sessionId;
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);

  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const status = searchParams.get("status") || "";
  const visibility = isLoggedIn ? searchParams.get("visibility") || "" : "";
  const search = searchParams.get("search") || "";
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const updateQuery = (updates = {}) => {
    const next = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });

    if (!isLoggedIn) {
      next.delete("visibility");
    }

    setSearchParams(next, { replace: true });
  };

  const { data, isLoading } = useEvents({
    page,
    limit: LIMIT,
    status: status || undefined,
    visibility: isLoggedIn ? visibility || undefined : undefined,
    search: search || undefined,
    publicOnly: !isLoggedIn,
  });

  const events = data?.events || [];
  const total = data?.total || 0;
  const hasMore = data?.has_more || false;
  const totalPages = Math.ceil(total / LIMIT);

  const handleSearch = (e) => {
    e.preventDefault();
    updateQuery({ search: searchInput.trim(), page: 1 });
  };

  const handleClearSearch = () => {
    setSearchInput("");
    updateQuery({ search: "", page: 1 });
  };

  const handleStatusChange = (e) => {
    updateQuery({ status: e.target.value, page: 1 });
  };

  const handleVisibilityChange = (e) => {
    updateQuery({ visibility: e.target.value, page: 1 });
  };

  const handleNewEventClick = () => {
    if (isLoggedIn) {
      navigate("/events/new");
      return;
    }
    setIsLoginPromptOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="surface-card px-4 py-4 bg-gradient-to-br from-white to-green-50/60">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              Events
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Discover sessions, vote fast, and keep everyone on track.
            </p>
          </div>
          <button
            onClick={handleNewEventClick}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Event
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="surface-card p-4 space-y-3">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        {/* Status Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-sm text-gray-500">Filter by:</label>
          <select
            value={status}
            onChange={handleStatusChange}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            {EVENT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          {isLoggedIn && (
            <select
              value={visibility}
              onChange={handleVisibilityChange}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {EVENT_VISIBILITIES.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
          )}
          {(status || visibility || search) && (
            <button
              onClick={() => {
                updateQuery({
                  status: "",
                  visibility: "",
                  search: "",
                  page: 1,
                });
                setSearchInput("");
              }}
              className="text-sm text-green-600 hover:text-green-700"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      {!isLoading && (
        <p className="text-sm text-gray-500 px-1">
          {total} event{total !== 1 ? "s" : ""} found
          {search && ` for "${search}"`}
          {status && ` in ${EVENT_STATUSES.find(s => s.value === status)?.label}`}
          {visibility && ` (${EVENT_VISIBILITIES.find(v => v.value === visibility)?.label})`}
        </p>
      )}

      {/* Events List */}
      {isLoading ? (
        <div className="py-12">
          <Spinner />
        </div>
      ) : events.length > 0 ? (
        <div className="space-y-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title="No events found"
          description={
            search || status
              || visibility
              ? "Try adjusting your filters or search terms."
              : "Create one and share with your group."
          }
          action={
            !search && !status ? (
              <Button onClick={handleNewEventClick}>
                <Plus className="w-4 h-4" />
                Create Event
              </Button>
            ) : null
          }
          className="bg-white rounded-xl border border-gray-200 py-12"
        />
      )}

      {/* Pagination */}
      {events.length > 0 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => updateQuery({ page: page - 1 })}
              disabled={page <= 1}
              className="px-3"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              variant="secondary"
              onClick={() => updateQuery({ page: page + 1 })}
              disabled={!hasMore && page >= totalPages}
              className="px-3"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <Modal
        isOpen={isLoginPromptOpen}
        onClose={() => setIsLoginPromptOpen(false)}
        title="Login Required"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            You need to log in first to create a new event.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsLoginPromptOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={() => navigate("/login")} className="flex-1">
              Go to Login
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HomePage;
