import { MapPin, Calendar, Clock, Users, ExternalLink } from "lucide-react";
import { Button } from "../ui/Button";
import { Avatar } from "../ui/Avatar";
import { formatDate, formatTime } from "../../utils/format";

const getEmbeddableMapUrl = (mapsUrl) => {
  if (!mapsUrl) return null;

  try {
    const url = new URL(mapsUrl);
    const hostname = url.hostname.toLowerCase();

    // Google short links redirect in-browser, but they do not produce useful embeds.
    if (hostname.includes("maps.app.goo.gl")) {
      return null;
    }

    if (hostname.includes("google.com") || hostname.includes("google.co.id")) {
      if (url.pathname.startsWith("/maps/embed")) {
        return mapsUrl;
      }

      if (url.pathname.startsWith("/maps")) {
        return `https://www.google.com/maps?q=${encodeURIComponent(mapsUrl)}&z=15&output=embed`;
      }
    }

    return null;
  } catch {
    return null;
  }
};

export const OptionCard = ({
  option,
  isSelected,
  hasVoted,
  onVote,
  onUnvote,
  onVoterClick,
  isVoting,
  voteDisabled = false,
  voteDisabledReason = "",
  showVotes = true,
}) => {
  const handleVoteClick = () => {
    if (hasVoted) {
      onUnvote();
    } else {
      onVote();
    }
  };

  const mapsUrl = option.venue?.maps_url;
  const embedMapUrl = getEmbeddableMapUrl(mapsUrl);

  return (
    <div
      className={`bg-white rounded-xl border-2 p-4 transition-all ${
        isSelected
          ? "border-green-500 shadow-md"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex-1 min-w-0 pr-1">
          <h4 className="font-semibold text-gray-900 break-all">
            {option.venue?.name || "Venue"}
          </h4>
          {option.venue?.address && (
            <p className="text-sm text-gray-500 flex items-start gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span className="break-all">{option.venue.address}</span>
            </p>
          )}
        </div>

        {showVotes && (
          <div className="text-right shrink-0 flex-none min-w-[44px]">
            <span className="text-lg font-semibold text-gray-900">
              {option.vote_count || 0}
            </span>
            <span className="text-xs text-gray-500 block">votes</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-600">
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          {formatDate(option.date)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          {formatTime(option.start_time)} - {formatTime(option.end_time)}
        </span>
      </div>

      {mapsUrl && (
        <div className="mt-3 space-y-2">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 hover:text-green-800"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Map
          </a>
          {embedMapUrl && (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <iframe
                title={`Map for ${option.venue?.name || "venue"}`}
                src={embedMapUrl}
                className="h-48 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
        </div>
      )}

      {/* Show voters with names and avatars */}
      {option.voters && option.voters.length > 0 && (
        <div className="mt-3 p-2 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500">Voted by:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {option.voters.map((voter) => (
              <button
                key={voter.user_id}
                type="button"
                onClick={() => onVoterClick?.(voter)}
                className={`flex items-center gap-1.5 px-2 py-1 bg-white rounded-full border border-gray-200 ${
                  onVoterClick
                    ? "hover:border-green-300 hover:bg-green-50"
                    : "cursor-default"
                }`}
              >
                <Avatar
                  src={voter.avatar_url}
                  name={voter.user_name}
                  size="sm"
                />
                <span className="text-xs text-gray-700">{voter.user_name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Legacy: Show votes array if available */}
      {!option.voters && option.votes && option.votes.length > 0 && (
        <div className="flex items-center gap-1 mt-3">
          <div className="flex -space-x-2">
            {option.votes.slice(0, 5).map((vote, idx) => (
              <Avatar
                key={idx}
                src={vote.user?.avatar_url}
                name={vote.user?.name}
                size="sm"
                className="border-2 border-white"
              />
            ))}
          </div>
          {option.votes.length > 5 && (
            <span className="text-xs text-gray-500 ml-1">
              +{option.votes.length - 5} more
            </span>
          )}
        </div>
      )}

      {onVote && (
        <div className="mt-3 space-y-1.5">
          <Button
            variant={hasVoted ? "secondary" : "primary"}
            onClick={handleVoteClick}
            loading={isVoting}
            disabled={voteDisabled}
            className="w-full"
          >
            {hasVoted ? "Unvote" : "Vote"}
          </Button>
          {voteDisabled && voteDisabledReason && (
            <p className="text-xs text-red-500">{voteDisabledReason}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default OptionCard;
