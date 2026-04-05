import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar } from "lucide-react";
import { useUserProfile } from "../hooks/useUsers";
import {
  useUserCreatedEvents,
  useUserParticipatedEvents,
} from "../hooks/useEvents";
import { useAuthStore } from "../store/authStore";
import { EventCard } from "../components/event/EventCard";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { Avatar } from "../components/ui/Avatar";

export const UserEventsPage = () => {
  const { userId } = useParams();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const isOwnProfile = currentUserId === userId;
  const [activeTab, setActiveTab] = useState("created");

  const { data: profile, isLoading: isLoadingProfile } = useUserProfile(userId);
  const { data: createdEvents = [], isLoading: isLoadingCreated } =
    useUserCreatedEvents(userId);
  const { data: participatedEvents = [], isLoading: isLoadingParticipated } =
    useUserParticipatedEvents(userId);

  const isLoading = isLoadingProfile || isLoadingCreated || isLoadingParticipated;
  const visibleEvents =
    activeTab === "created" ? createdEvents : participatedEvents;

  return (
    <div className="space-y-4">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to home
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        {profile && (
          <div className="flex items-center gap-3 mb-4">
            <Avatar src={profile.avatar_url} name={profile.name} size="lg" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {isOwnProfile ? "My Events" : profile.name || "User Events"}
              </h1>
              <p className="text-sm text-gray-500">User event history</p>
            </div>
          </div>
        )}

        {!profile && (
          <>
            <h1 className="text-xl font-semibold text-gray-900">
              {isOwnProfile ? "My Events" : "User Events"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isOwnProfile
                ? "Track events you created and joined."
                : "View events this user created and joined."}
            </p>
          </>
        )}

        <div className="mt-4 inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
          <button
            onClick={() => setActiveTab("created")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              activeTab === "created"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Created ({createdEvents.length})
          </button>
          <button
            onClick={() => setActiveTab("participated")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              activeTab === "participated"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Participated ({participatedEvents.length})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12">
          <Spinner />
        </div>
      ) : visibleEvents.length > 0 ? (
        <div className="space-y-3">
          {visibleEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              hideCreatorInfo={isOwnProfile && activeTab === "created"}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title="No events found"
          description={
            activeTab === "created"
              ? "No created events yet."
              : "No participated events yet."
          }
          className="bg-white rounded-xl border border-gray-200 py-12"
        />
      )}
    </div>
  );
};

export default UserEventsPage;
