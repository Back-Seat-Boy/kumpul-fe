import { Link } from "react-router-dom";
import { Plus, Calendar, MapPin, Users } from "lucide-react";
import { useEvents } from "../hooks/useEvents";
import { EventCard } from "../components/event/EventCard";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { Button } from "../components/ui/Button";

export const HomePage = () => {
  const { data: events, isLoading } = useEvents();

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

      {/* Events List */}
      {isLoading ? (
        <div className="py-12">
          <Spinner />
        </div>
      ) : events?.length > 0 ? (
        <div className="space-y-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title="No events yet"
          description="Create one and share with your group."
          action={
            <Link to="/events/new">
              <Button>
                <Plus className="w-4 h-4" />
                Create Event
              </Button>
            </Link>
          }
          className="bg-white rounded-xl border border-gray-200 py-12"
        />
      )}
    </div>
  );
};

export default HomePage;
