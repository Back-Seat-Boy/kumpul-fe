import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Calendar, Search, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEvents } from "../hooks/useEvents";
import { EventCard } from "../components/event/EventCard";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

const EVENT_STATUSES = [
  { value: "", label: "All Status" },
  { value: "voting", label: "Voting" },
  { value: "confirmed", label: "Confirmed" },
  { value: "open", label: "Open" },
  { value: "payment_open", label: "Payment" },
  { value: "completed", label: "Completed" },
];

const LIMIT = 10;

export const HomePage = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading } = useEvents({
    page,
    limit: LIMIT,
    status: status || undefined,
    search: search || undefined,
  });

  const events = data?.events || [];
  const total = data?.total || 0;
  const hasMore = data?.has_more || false;
  const totalPages = Math.ceil(total / LIMIT);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const handleStatusChange = (e) => {
    setStatus(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Events</h1>
        <Link
          to="/events/new"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Event
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
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
        <div className="flex items-center gap-2">
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
          {(status || search) && (
            <button
              onClick={() => {
                setStatus("");
                setSearch("");
                setSearchInput("");
                setPage(1);
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
        <p className="text-sm text-gray-500">
          {total} event{total !== 1 ? "s" : ""} found
          {search && ` for "${search}"`}
          {status && ` in ${EVENT_STATUSES.find(s => s.value === status)?.label}`}
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
              ? "Try adjusting your filters or search terms."
              : "Create one and share with your group."
          }
          action={
            !search && !status ? (
              <Link to="/events/new">
                <Button>
                  <Plus className="w-4 h-4" />
                  Create Event
                </Button>
              </Link>
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
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="px-3"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              variant="secondary"
              onClick={() => setPage(page + 1)}
              disabled={!hasMore && page >= totalPages}
              className="px-3"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
