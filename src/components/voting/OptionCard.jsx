import { MapPin, Calendar, Clock, Users } from "lucide-react";
import { Button } from "../ui/Button";
import { Avatar } from "../ui/Avatar";
import { formatDate, formatTime } from "../../utils/format";
import { useAuthStore } from "../../store/authStore";

export const OptionCard = ({
  option,
  isSelected,
  hasVoted,
  onVote,
  onUnvote,
  isVoting,
  showVotes = true,
}) => {
  const user = useAuthStore((state) => state.user);

  const handleVoteClick = () => {
    if (hasVoted) {
      onUnvote();
    } else {
      onVote();
    }
  };

  return (
    <div
      className={`bg-white rounded-xl border-2 p-4 transition-all ${
        isSelected
          ? "border-green-500 shadow-md"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{option.venue?.name || "Venue"}</h4>
          {option.venue?.address && (
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5" />
              {option.venue.address}
            </p>
          )}
        </div>

        {showVotes && (
          <div className="text-right">
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

      {/* Show voters with names and avatars */}
      {option.voters && option.voters.length > 0 && (
        <div className="mt-3 p-2 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500">Voted by:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {option.voters.map((voter) => (
              <div
                key={voter.user_id}
                className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-full border border-gray-200"
              >
                <Avatar
                  src={voter.avatar_url}
                  name={voter.user_name}
                  size="sm"
                />
                <span className="text-xs text-gray-700">{voter.user_name}</span>
              </div>
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

      {onVote && user && (
        <Button
          variant={hasVoted ? "secondary" : "primary"}
          onClick={handleVoteClick}
          loading={isVoting}
          className="w-full mt-3"
        >
          {hasVoted ? "Unvote" : "Vote"}
        </Button>
      )}
    </div>
  );
};

export default OptionCard;
