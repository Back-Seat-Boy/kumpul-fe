import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Calendar, MapPin, Users, ArrowLeft, Check, ExternalLink, Crown, PlusCircle, MinusCircle } from "lucide-react";
import { useEvent, useUpdateEventStatus, useSetChosenOption } from "../hooks/useEvents";
import { useOptionsWithVoters, useVotedOptionIds } from "../hooks/useOptions";
import { useParticipants, useJoinEvent, useLeaveEvent, useRemoveParticipant } from "../hooks/useParticipants";
import { useCastVote, useRemoveVote } from "../hooks/useVotes";
import { useAuthStore } from "../store/authStore";
import { EventStatusBadge } from "../components/event/EventStatusBadge";
import { ShareButton } from "../components/event/ShareButton";
import { OptionCard } from "../components/voting/OptionCard";
import { VoteTally } from "../components/voting/VoteTally";
import { ParticipantList } from "../components/participant/ParticipantList";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Spinner } from "../components/ui/Spinner";
import { formatDate, formatDateTime, formatRupiah } from "../utils/format";
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
  const [showAllParticipants, setShowAllParticipants] = useState(false);
  const [impactData, setImpactData] = useState(null);

  const { data: event, isLoading: isLoadingEvent } = useEvent(shareToken);
  const { data: options } = useOptionsWithVoters(event?.id, shareToken);
  const { data: participants } = useParticipants(shareToken);

  const votedOptionIds = useVotedOptionIds(options);

  const joinEvent = useJoinEvent();
  const leaveEvent = useLeaveEvent();
  const removeParticipant = useRemoveParticipant();
  const castVote = useCastVote();
  const removeVote = useRemoveVote();
  const updateStatus = useUpdateEventStatus();
  const setChosenOption = useSetChosenOption();

  const isCreator = event && user && event.created_by === user.id;
  const hasJoined = participants?.some((p) => p.user_id === user?.id);

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

  const handleRemoveParticipant = async (userId) => {
    if (!confirm("Are you sure you want to remove this participant?")) return;
    try {
      await removeParticipant.mutateAsync({
        eventId: event.id,
        userId,
        shareToken,
        onImpact: (data) => setImpactData(data),
      });
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
  const creatorParticipant = participants?.find((p) => p.user_id === event.created_by);

  // Helper to get action text
  const getActionText = (action, amount) => {
    switch (action) {
      case "pay_full":
        return `Needs to pay ${formatRupiah(amount)}`;
      case "pay_more":
        return `Pay ${formatRupiah(amount)} more`;
      case "receive_refund":
        return `Receive ${formatRupiah(amount)} refund`;
      case "no_action":
        return "No change";
      default:
        return "";
    }
  };

  // Helper to get action style
  const getActionStyle = (action) => {
    switch (action) {
      case "pay_full":
      case "pay_more":
        return "text-orange-700 bg-orange-50";
      case "receive_refund":
        return "text-green-700 bg-green-50";
      case "no_action":
        return "text-green-700 bg-green-50";
      default:
        return "text-gray-700 bg-gray-50";
    }
  };

  // Helper to get action icon
  const getActionIcon = (action) => {
    switch (action) {
      case "pay_full":
      case "pay_more":
        return <MinusCircle className="w-4 h-4" />;
      case "receive_refund":
        return <PlusCircle className="w-4 h-4" />;
      case "no_action":
        return <Check className="w-4 h-4" />;
      default:
        return null;
    }
  };

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
            {/* Join/Leave only allowed when status is open or payment_open */}
            {sessionId && !isCreator && (event.status === "open" || event.status === "payment_open") && (
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
        {/* Chosen Option */}
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
            
            {creatorParticipant && (
              <div className="flex items-center gap-2 mb-3 p-2 bg-amber-50 rounded-lg border border-amber-100">
                <Avatar
                  src={creatorParticipant.user?.avatar_url}
                  name={creatorParticipant.user?.name}
                  size="sm"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {creatorParticipant.user?.name}
                  </p>
                  <p className="text-xs text-amber-600">Organizer</p>
                </div>
                <Crown className="w-4 h-4 text-amber-500" />
              </div>
            )}
            
            <ParticipantList 
              participants={participants?.filter((p) => p.user_id !== event.created_by)} 
              isCreatorId={event.created_by}
              isCreator={isCreator}
              onRemove={handleRemoveParticipant}
              eventId={event.id}
              eventStatus={event.status}
              maxDisplay={showAllParticipants ? 100 : 5}
            />
            
            {participants && participants.length > 6 && (
              <button
                onClick={() => setShowAllParticipants(!showAllParticipants)}
                className="text-sm text-green-600 hover:text-green-700 mt-3"
              >
                {showAllParticipants ? "Show less" : `Show all ${participants.length} participants`}
              </button>
            )}
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
              Payment collection is open. Click "View Details" to see payment info and submit your proof.
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

      {/* Impact Modal - Shows financial impact when removing participants */}
      <Modal
        isOpen={!!impactData}
        onClose={() => setImpactData(null)}
        title="Participant Removed"
      >
        {impactData && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                Split amount changed from{" "}
                <strong>{formatRupiah(impactData.old_split_amount)}</strong> to{" "}
                <strong>{formatRupiah(impactData.new_split_amount)}</strong>
              </p>
            </div>
            
            {impactData.impacts && impactData.impacts.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Impact on remaining participants:</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {impactData.impacts.map((impact) => (
                    <div
                      key={impact.user_id}
                      className={`p-3 rounded-lg ${getActionStyle(impact.action)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getActionIcon(impact.action)}
                          <span className="font-medium">{impact.user_name}</span>
                        </div>
                        <span className="text-sm font-medium">
                          {getActionText(impact.action, impact.action_amount)}
                        </span>
                      </div>
                      {impact.paid_amount > 0 && (
                        <p className="text-xs mt-1 opacity-75">
                          Paid: {formatRupiah(impact.paid_amount)} | New split: {formatRupiah(impact.new_split)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              <Button 
                variant="secondary"
                onClick={() => setImpactData(null)} 
                className="flex-1"
              >
                Got it
              </Button>
              <Button 
                onClick={() => {
                  setImpactData(null);
                  navigate(`/events/${shareToken}/payment`);
                }} 
                className="flex-1"
              >
                Go to Payment
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EventDetailPage;
