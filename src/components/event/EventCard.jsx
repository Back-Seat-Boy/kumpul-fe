import { Link } from "react-router-dom";
import { Calendar, MapPin, Users } from "lucide-react";
import { EventStatusBadge } from "./EventStatusBadge";
import { Avatar } from "../ui/Avatar";
import { formatDate } from "../../utils/format";

export const EventCard = ({ event }) => {
  const participantCount = event.participant_count || 0;
  const playerCap = event.player_cap;

  return (
    <Link
      to={`/events/${event.share_token}`}
      className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-gray-900 line-clamp-1">{event.title}</h3>
        <EventStatusBadge status={event.status} />
      </div>

      {event.description && (
        <p className="text-sm text-gray-500 line-clamp-1 mb-3">{event.description}</p>
      )}

      <div className="flex items-center gap-4 text-sm text-gray-500">
        {event.chosen_option ? (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{formatDate(event.chosen_option.date)}</span>
          </div>
        ) : event.voting_deadline ? (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>Voting ends soon</span>
          </div>
        ) : null}

        {playerCap && (
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-gray-400" />
            <span>
              {participantCount} / {playerCap} players
            </span>
          </div>
        )}
      </div>
    </Link>
  );
};

export default EventCard;
