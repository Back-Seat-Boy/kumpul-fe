import { Users } from "lucide-react";
import { Avatar } from "../ui/Avatar";

export const ParticipantList = ({ participants, maxDisplay = 5 }) => {
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
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {displayParticipants.map((participant) => (
          <Avatar
            key={participant.id}
            src={participant.user?.avatar_url}
            name={participant.user?.name}
            size="md"
            className="border-2 border-white"
          />
        ))}
      </div>
      {remainingCount > 0 && (
        <span className="text-sm text-gray-500">+{remainingCount} more</span>
      )}
    </div>
  );
};

export default ParticipantList;
