import { Users, Crown } from "lucide-react";
import { Avatar } from "../ui/Avatar";

export const ParticipantList = ({ participants, maxDisplay = 5, isCreatorId }) => {
  if (!participants || participants.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Users className="w-4 h-4" />
        <span>No participants yet</span>
      </div>
    );
  }

  const displayParticipants = participants.slice(0, maxDisplay);
  const remainingCount = Math.max(0, participants.length - maxDisplay);

  return (
    <div className="space-y-2">
      {/* List with names */}
      <div className="flex flex-wrap gap-2">
        {displayParticipants.map((participant) => (
          <div
            key={participant.id}
            className="flex items-center gap-2 px-2 py-1.5 bg-gray-100 rounded-full"
          >
            <Avatar
              src={participant.user?.avatar_url}
              name={participant.user?.name}
              size="sm"
            />
            <span className="text-sm text-gray-700 pr-1">
              {participant.user?.name}
            </span>
            {isCreatorId && participant.user_id === isCreatorId && (
              <Crown className="w-3 h-3 text-amber-500" />
            )}
          </div>
        ))}
        {remainingCount > 0 && (
          <span className="text-sm text-gray-500 px-2 py-1.5">
            +{remainingCount} more
          </span>
        )}
      </div>
      
      {/* Summary */}
      <p className="text-xs text-gray-400">
        {participants.length} participant{participants.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
};

export default ParticipantList;
