import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Calendar, MapPin, Users, ArrowLeft, Check, ExternalLink } from "lucide-react";
import { useEvent, useUpdateEventStatus, useSetChosenOption } from "../hooks/useEvents";
import { useOptions } from "../hooks/useOptions";
import { useParticipants, useJoinEvent, useLeaveEvent } from "../hooks/useParticipants";
import { useCastVote, useRemoveVote } from "../hooks/useVotes";
import { useAuthStore } from "../store/authStore";
import { EventStatusBadge } from "../components/event/EventStatusBadge";
import { ShareButton } from "../components/event/ShareButton";
import { OptionCard } from "../components/voting/OptionCard";
import { VoteTally } from "../components/voting/VoteTally";
import { ParticipantList } from "../components/participant/ParticipantList";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Spinner } from "../components/ui/Spinner";
import { formatDate, formatDateTime } from "../utils/format";
import { getVenueWhatsAppLink } from "../api/whatsapp";
import { useToastStore, getErrorMessage } from "../utils/toast";

export const EventDetailPage = () => {
  const { shareToken } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const sessionId = useAuthStore((state) => state.sessionId);
  const showError = useToastStore((state) => state.showError);

  const [isCloseVotingOpen, setIsCloseVotingOpen] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [isContactingVenue, setIsContactingVenue] = useState(false);

  const { data: event, isLoading: isLoadingEvent } = useEvent(shareToken);
  const { data: options } = useOptions(shareToken);
  const { data: participants } = useParticipants(shareToken);

  const joinEvent = useJoinEvent();
  const leaveEvent = useLeaveEvent();
  const castVote = useCastVote();
  const removeVote = useRemoveVote();
  const updateStatus = useUpdateEventStatus();
  const setChosenOption = useSetChosenOption();

  const isCreator = event && user && event.created_by === user.id;
  const hasJoined = participants?.some((p) => p.user_id === user?.id);

  // Get user's voted option IDs
  const votedOptionIds = options
    ?.filter((opt) => opt.votes?.some((v) => v.user_id === user?.id))
    .map((opt) => opt.id) || [];

  if (isLoadingEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Event not found</h1>
        <Link to="/" className="text-green-600 hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  const handleVote = async (optionId) => {
    try {
      await castVote.mutateAsync({ eventId: event.id, eventOptionId: optionId, shareToken });
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  const handleUnvote = async (optionId) => {
    try {
      await removeVote.mutateAsync({ eventId: event.id, optionId, shareToken });
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  const handleJoin = async () => {
    if (!sessionId) {
      navigate("/login");
      return;
    }
    try {
      await joinEvent.mutateAsync({ eventId: event.id, shareToken });
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  const handleLeave = async () => {
    try {
      await leaveEvent.mutateAsync({ eventId: event.id, shareToken });
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  const handleCloseVoting = async () => {
    if (selectedOptionId) {
      try {
        await setChosenOption.mutateAsync({ eventId: event.id, optionId: selectedOptionId, shareToken });
        setIsCloseVotingOpen(false);
      } catch (error) {
        showError(getErrorMessage(error));
      }
    }
  };

  const handleContactVenue = async () => {
    setIsContactingVenue(true);
    try {
      const { link } = await getVenueWhatsAppLink(event.id);
      window.open(link, "_blank");
    } catch (error) {
      showError(getErrorMessage(error));
    } finally {
      setIsContactingVenue(false);
    }
  };

  const handleOpenPayment = () => {
    navigate(`/events/${shareToken}/payment`);
  };

  const chosenOption = options?.find((o) => o.id === event.chosen_option_id);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <Link
            to={sessionId ? "/" : "#"}
            onClick={(e) => !sessionId && e.preventDefault()}
            className={`inline-flex items-center gap-1 text-sm text-gray-500 mb-3 ${
              sessionId ? "hover:text-gray-700" : "opacity-50 cursor-default"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{event.title}</h1>
              {event.description && (
                <p className="text-sm text-gray-500 mt-1">{event.description}</p>
              )}
            </div>
            <EventStatusBadge status={event.status} />
          </div>

          <div className="flex items-center gap-3 mt-4">
            <ShareButton shareToken={event.share_token} />
            {sessionId && !isCreator && event.status !== "completed" && (
              <Button
                variant={hasJoined ? "secondary" : "primary"}
                onClick={hasJoined ? handleLeave : handleJoin}
                loading={joinEvent.isPending || leaveEvent.isPending}
              >
                {hasJoined ? "Leave" : "Join"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Chosen Option (if confirmed or beyond) */}
        {chosenOption && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-green-800 mb-2">
              <Check className="w-5 h-5" />
              <span className="font-semibold">Confirmed</span>
            </div>
            <h3 className="font-semibold text-gray-900">{chosenOption.venue?.name}</h3>
            {chosenOption.venue?.address && (
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5" />
                {chosenOption.venue.address}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(chosenOption.date)}
              </span>
              <span>
                {chosenOption.start_time} - {chosenOption.end_time}
              </span>
            </div>
          </div>
        )}

        {/* Voting Section */}
        {event.status === "voting" && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Vote for Date & Venue
              </h2>
              {event.voting_deadline && (
                <span className="text-xs text-gray-400">
                  Ends {formatDateTime(event.voting_deadline)}
                </span>
              )}
            </div>

            <div className="space-y-3">
              {options?.map((option) => (
                <OptionCard
                  key={option.id}
                  option={option}
                  hasVoted={votedOptionIds.includes(option.id)}
                  onVote={() => handleVote(option.id)}
                  onUnvote={() => handleUnvote(option.id)}
                  isVoting={castVote.isPending || removeVote.isPending}
                />
              ))}
            </div>

            {isCreator && (
              <Button
                variant="primary"
                onClick={() => setIsCloseVotingOpen(true)}
                className="w-full mt-4"
              >
                Close Voting
              </Button>
            )}
          </div>
        )}

        {/* Creator Actions for Confirmed */}
        {isCreator && event.status === "confirmed" && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              Next Steps
            </h2>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleContactVenue}
                loading={isContactingVenue}
                className="flex-1"
              >
                <ExternalLink className="w-4 h-4" />
                Contact Venue
              </Button>
              <Button
                variant="primary"
                onClick={() => updateStatus.mutateAsync({ eventId: event.id, status: "open", shareToken })}
                loading={updateStatus.isPending}
                className="flex-1"
              >
                Open RSVP
              </Button>
            </div>
          </div>
        )}

        {/* Participants */}
        {event.status !== "voting" && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Participants
              </h2>
              <span className="text-sm text-gray-600">
                {participants?.length || 0}
                {event.player_cap ? ` / ${event.player_cap}` : ""}
              </span>
            </div>
            <ParticipantList participants={participants} />
          </div>
        )}

        {/* Payment Section */}
        {(event.status === "payment_open" || event.status === "completed") && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Payment
              </h2>
              <Button variant="secondary" onClick={handleOpenPayment}>
                View Details
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              Payment collection is open. Click &quot;View Details&quot; to see payment info and submit your proof.
            </p>
          </div>
        )}

        {/* Creator: Open Payment */}
        {isCreator && event.status === "open" && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              Ready to collect payment?
            </h2>
            <Button
              variant="primary"
              onClick={handleOpenPayment}
              className="w-full"
            >
              Open Payment
            </Button>
          </div>
        )}
      </div>

      {/* Close Voting Modal */}
      <Modal
        isOpen={isCloseVotingOpen}
        onClose={() => setIsCloseVotingOpen(false)}
        title="Close Voting"
      >
        <p className="text-sm text-gray-600 mb-4">
          Select the winning option to confirm the event:
        </p>
        <VoteTally
          options={options}
          onSelect={setSelectedOptionId}
          selectedOptionId={selectedOptionId}
        />
        <div className="flex gap-3 mt-4">
          <Button
            variant="secondary"
            onClick={() => setIsCloseVotingOpen(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCloseVoting}
            loading={setChosenOption.isPending}
            disabled={!selectedOptionId}
            className="flex-1"
          >
            Confirm
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default EventDetailPage;
