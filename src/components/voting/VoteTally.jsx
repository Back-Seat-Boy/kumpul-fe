import { Trophy } from "lucide-react";
import { formatDate } from "../../utils/format";

export const VoteTally = ({ options, onSelect, selectedOptionId }) => {
  const sortedOptions = [...(options || [])].sort(
    (a, b) => (b.vote_count || 0) - (a.vote_count || 0)
  );

  const maxVotes = Math.max(...sortedOptions.map((o) => o.vote_count || 0), 1);

  return (
    <div className="space-y-3">
      {sortedOptions.map((option, index) => {
        const isWinner = index === 0 && option.vote_count > 0;
        const percentage = ((option.vote_count || 0) / maxVotes) * 100;

        return (
          <button
            key={option.id}
            onClick={() => onSelect?.(option.id)}
            className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
              selectedOptionId === option.id
                ? "border-green-500 bg-green-50"
                : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {isWinner && (
                  <Trophy className="w-4 h-4 text-amber-500" />
                )}
                <span className="font-medium text-gray-900">
                  {option.venue?.name}
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-700">
                {option.vote_count || 0} votes
              </span>
            </div>

            <div className="text-xs text-gray-500 mb-2">
              {formatDate(option.date)} · {option.start_time} - {option.end_time}
            </div>

            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  isWinner ? "bg-amber-400" : "bg-green-500"
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default VoteTally;
