import { Link } from "react-router-dom";
import { Calendar, MapPin, Users, Crown, Clock, CheckCircle, CreditCard } from "lucide-react";
import { EventStatusBadge } from "./EventStatusBadge";
import { Avatar } from "../ui/Avatar";
import { formatDate } from "../../utils/format";

export const EventCard = ({ event, hideCreatorInfo = false }) => {
  // Status-specific rendering
  const renderStatusInfo = () => {
    switch (event.status) {
      case "voting":
        return (
          <>
            {event.voting_deadline && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>Voting ends {formatDate(event.voting_deadline)}</span>
              </div>
            )}
            {event.total_votes !== undefined && (
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-gray-400" />
                <span>{event.total_votes} votes</span>
              </div>
            )}
          </>
        );

      case "confirmed":
      case "open":
        return (
          <>
            {event.event_date && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{formatDate(event.event_date)}</span>
              </div>
            )}
            {event.event_time && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>{event.event_time}</span>
              </div>
            )}
            {event.venue_name && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="truncate max-w-[150px]">{event.venue_name}</span>
              </div>
            )}
            {event.participant_count !== undefined && (
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-gray-400" />
                <span>
                  {event.participant_count}
                  {event.player_cap ? ` / ${event.player_cap}` : ""} joined
                </span>
              </div>
            )}
          </>
        );

      case "payment_open":
      case "completed":
        return (
          <>
            {event.event_date && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{formatDate(event.event_date)}</span>
              </div>
            )}
            {event.venue_name && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="truncate max-w-[150px]">{event.venue_name}</span>
              </div>
            )}
            {event.participant_count !== undefined && (
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-gray-400" />
                <span>{event.participant_count} joined</span>
              </div>
            )}
            {(event.pending_count !== undefined || event.claimed_count !== undefined || event.confirmed_count !== undefined) && (
              <div className="flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <span className="text-xs">
                  {event.confirmed_count > 0 && (
                    <span className="text-green-600">{event.confirmed_count} paid</span>
                  )}
                  {event.claimed_count > 0 && (
                    <span className="text-yellow-600 ml-1">{event.claimed_count} pending</span>
                  )}
                  {event.pending_count > 0 && (
                    <span className="text-gray-400 ml-1">{event.pending_count} unpaid</span>
                  )}
                </span>
              </div>
            )}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Link
      to={`/events/${event.share_token}`}
      className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-gray-900 line-clamp-1">{event.title}</h3>
        <EventStatusBadge status={event.status} />
      </div>

      {event.visibility && (
        <div className="mb-2">
          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            {event.visibility === "public" ? "Public" : "Invite only"}
          </span>
        </div>
      )}

      {event.description && (
        <p className="text-sm text-gray-500 line-clamp-1 mb-3">{event.description}</p>
      )}

      {/* Creator info */}
      {!hideCreatorInfo && !!(event.creator?.name || event.creator?.avatar_url) && (
        <div className="flex items-center gap-2 mb-3">
          <Avatar
            src={event.creator.avatar_url}
            name={event.creator.name}
            size="sm"
          />
          <span className="text-sm text-gray-600">{event.creator.name}</span>
          <Crown className="w-3 h-3 text-amber-500" />
          {event.created_at && (
            <span className="text-xs text-gray-400 ml-auto">
              {formatDate(event.created_at)}
            </span>
          )}
        </div>
      )}

      {/* Status-specific info */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500">
        {renderStatusInfo()}
      </div>
    </Link>
  );
};

export default EventCard;
