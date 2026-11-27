import { Users, Crown, UserRound, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";

export const ParticipantList = ({ 
  participants, 
  maxDisplay = 5, 
  isCreatorId, 
  isCreator = false,
  onRemove,
  onParticipantClick,
  eventId,
  eventStatus,
  variant = "chips",
  groups = [],
  onAssignGroup,
}) => {
  if (!participants || participants.length === 0) {
    return (
      variant === "directory" ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-400">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-gray-700">No registrants yet</p>
          <p className="mt-1 text-xs text-gray-400">
            People who join this event will appear here.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Users className="w-4 h-4" />
          <span>No registrants yet</span>
        </div>
      )
    );
  }

  const displayParticipants = participants.slice(0, maxDisplay);
  const remainingCount = Math.max(0, participants.length - maxDisplay);
  const groupById = new Map((groups || []).map((group) => [group.id, group]));

  if (variant === "directory") {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {displayParticipants.map((participant, index) => (
          <div
            key={participant.id}
            className={`flex items-center gap-3 px-3 py-3 sm:px-4 ${
              index !== displayParticipants.length - 1 ? "border-b border-gray-100" : ""
            }`}
          >
            {participant.is_guest ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                <UserRound className="w-4 h-4" />
              </div>
            ) : (
              <Avatar
                src={participant.user?.avatar_url}
                name={participant.user?.name}
                size="md"
              />
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {participant.is_guest ? (
                  <span className="truncate text-sm font-medium text-gray-900 italic">
                    {participant.guest_name}
                  </span>
                ) : onParticipantClick ? (
                  <button
                    type="button"
                    onClick={() => onParticipantClick(participant)}
                    className="truncate text-left text-sm font-medium text-gray-900 hover:text-green-700 hover:underline"
                  >
                    {participant.user?.name}
                  </button>
                ) : (
                  <Link
                    to={`/users/${participant.user_id}/events`}
                    className="truncate text-sm font-medium text-gray-900 hover:text-green-700 hover:underline"
                  >
                    {participant.user?.name}
                  </Link>
                )}
                {isCreatorId && participant.user_id === isCreatorId && (
                  <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                )}
              </div>
              <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span>
                  {participant.is_guest ? "Guest registrant" : "Registered user"}
                </span>
                {groupById.has(participant.group_id) && (
                  <Badge variant="open" className="shrink-0">
                    {groupById.get(participant.group_id).name}
                  </Badge>
                )}
              </p>
            </div>

            {isCreator && onAssignGroup && groups.length > 0 && (
              <select
                value={participant.group_id || ""}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => onAssignGroup(participant, e.target.value || null)}
                title="Assign group"
                className="max-w-[7.5rem] shrink-0 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">No group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            )}

            {isCreator && onRemove && participant.user_id !== isCreatorId &&
              (eventStatus === "open" || eventStatus === "payment_open") && (
                <button
                  onClick={() => onRemove(participant)}
                  className="shrink-0 rounded-full p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  title="Remove participant"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* List with names */}
      <div className="flex flex-wrap gap-2">
        {displayParticipants.map((participant) => (
          <div
            key={participant.id}
            className="flex items-center gap-2 px-2 py-1.5 bg-gray-100 rounded-full group"
          >
            {participant.is_guest ? (
              <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                <UserRound className="w-3.5 h-3.5" />
              </div>
            ) : (
              <Avatar
                src={participant.user?.avatar_url}
                name={participant.user?.name}
                size="sm"
              />
            )}
            {participant.is_guest ? (
              <span className="text-sm text-gray-700 pr-1 italic">
                {participant.guest_name}
              </span>
            ) : (
              onParticipantClick ? (
                <button
                  type="button"
                  onClick={() => onParticipantClick(participant)}
                  className="text-sm text-gray-700 pr-1 hover:text-green-700 hover:underline"
                >
                  {participant.user?.name}
                </button>
              ) : (
                <Link
                  to={`/users/${participant.user_id}/events`}
                  className="text-sm text-gray-700 pr-1 hover:text-green-700 hover:underline"
                >
                  {participant.user?.name}
                </Link>
              )
            )}
            {isCreatorId && participant.user_id === isCreatorId && (
              <Crown className="w-3 h-3 text-amber-500" />
            )}
            {isCreator && onRemove && participant.user_id !== isCreatorId && 
             (eventStatus === "open" || eventStatus === "payment_open") && (
              <button
                onClick={() => onRemove(participant)}
                className="p-0.5 text-gray-400 hover:text-red-500 hover:bg-red-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove participant"
              >
                <X className="w-3 h-3" />
              </button>
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
        {participants.length} registrant{participants.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
};

export default ParticipantList;
