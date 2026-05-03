import { useEffect, useState } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Users,
  ArrowLeft,
  Check,
  ExternalLink,
  Crown,
  PlusCircle,
  MinusCircle,
  AlertCircle,
  UserRound,
  Pencil,
  X,
} from "lucide-react";
import {
  useEvent,
  useUpdateEventDetails,
  useUpdateEventStatus,
  useSetChosenOption,
  useUpdateEventSchedule,
  useEventScheduleHistory,
  useUpdateEventImages,
} from "../hooks/useEvents";
import {
  useOptionsWithVoters,
  useVotedOptionIds,
  useUpdateOption,
  useOptionEditHistory,
} from "../hooks/useOptions";
import { usePayment } from "../hooks/usePayments";
import {
  useParticipants,
  useParticipantsDirectory,
  useJoinEvent,
  useLeaveEvent,
  useAddGuestParticipant,
  useRemoveParticipant,
  useRemovalImpact,
} from "../hooks/useParticipants";
import { useCastVote, useRemoveVote } from "../hooks/useVotes";
import { useAuthStore } from "../store/authStore";
import { EventStatusBadge } from "../components/event/EventStatusBadge";
import { ShareButton } from "../components/event/ShareButton";
import { OptionCard } from "../components/voting/OptionCard";
import { VoteTally } from "../components/voting/VoteTally";
import { ParticipantList } from "../components/participant/ParticipantList";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Spinner } from "../components/ui/Spinner";
import { Textarea } from "../components/ui/Textarea";
import { formatDate, formatDateTime, formatRupiah } from "../utils/format";
import { getVenueWhatsAppLink } from "../api/whatsapp";
import { useToastStore, getErrorMessage } from "../utils/toast";
import { useVenues } from "../hooks/useVenues";
import { toRFC3339 } from "../utils/format";
import { usePageMeta } from "../hooks/usePageMeta";
import { uploadImage } from "../api/uploads";

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

const formatGoogleCalendarDateTime = (dateStr, timeStr = "00:00") => {
  if (!dateStr) return null;
  const datePart = dateStr.slice(0, 10);
  const safeTime = timeStr || "00:00";
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = safeTime.split(":").map(Number);

  return `${String(year).padStart(4, "0")}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}T${String(hour || 0).padStart(2, "0")}${String(minute || 0).padStart(2, "0")}00`;
};

const addMinutesToGoogleCalendarDateTime = (
  calendarDateTime,
  minutesToAdd = 120,
) => {
  if (!calendarDateTime || calendarDateTime.length < 15)
    return calendarDateTime;
  const year = parseInt(calendarDateTime.slice(0, 4), 10);
  const month = parseInt(calendarDateTime.slice(4, 6), 10) - 1;
  const day = parseInt(calendarDateTime.slice(6, 8), 10);
  const hour = parseInt(calendarDateTime.slice(9, 11), 10);
  const minute = parseInt(calendarDateTime.slice(11, 13), 10);

  const date = new Date(year, month, day, hour, minute, 0);
  date.setMinutes(date.getMinutes() + minutesToAdd);

  return `${String(date.getFullYear()).padStart(4, "0")}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}00`;
};

const formatBackendUtcTimestamp = (timestamp) => {
  if (!timestamp) return "-";

  const match = timestamp.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?Z$/,
  );
  if (!match) return timestamp;

  const [, year, month, day, hour, minute] = match;
  return `${day}/${month}/${year} ${hour}:${minute}`;
};

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

const renderLinkifiedText = (text) => {
  if (!text) return null;

  return text.split(URL_PATTERN).map((part, index) => {
    if (part.startsWith("http://") || part.startsWith("https://")) {
      return (
        <a
          key={`${part}-${index}`}
          href={part}
          target="_blank"
          rel="noreferrer"
          className="text-green-700 underline underline-offset-2 hover:text-green-800 break-all"
        >
          {part}
        </a>
      );
    }

    return <span key={`text-${index}`}>{part}</span>;
  });
};

const getGoogleCalendarUrl = ({ event, chosenOption, shareToken }) => {
  if (!event || !chosenOption?.date) return null;

  const start = formatGoogleCalendarDateTime(
    chosenOption.date,
    chosenOption.start_time || "00:00",
  );
  const end = chosenOption.end_time
    ? formatGoogleCalendarDateTime(chosenOption.date, chosenOption.end_time)
    : addMinutesToGoogleCalendarDateTime(start, 120);
  const location = chosenOption.venue?.name
    ? `${chosenOption.venue.name}${chosenOption.venue?.address ? `, ${chosenOption.venue.address}` : ""}`
    : "";
  const shareUrl = `${window.location.origin}/events/${shareToken}`;
  const detailsLines = [
    event.description,
    chosenOption.venue?.maps_url ? `Map: ${chosenOption.venue.maps_url}` : "",
    `Event: ${shareUrl}`,
  ].filter(Boolean);

  if (!start || !end) return null;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title || "Kumpul Event",
    dates: `${start}/${end}`,
    details: detailsLines.join("\n\n"),
    ctz: "Asia/Jakarta",
  });

  if (location) {
    params.set("location", location);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export const EventDetailPage = () => {
  const { shareToken } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const sessionId = useAuthStore((state) => state.sessionId);
  const showError = useToastStore((state) => state.showError);

  const [isCloseVotingOpen, setIsCloseVotingOpen] = useState(false);
  const [isVoteLoginPromptOpen, setIsVoteLoginPromptOpen] = useState(false);
  const [isJoinLoginPromptOpen, setIsJoinLoginPromptOpen] = useState(false);
  const [isProfileLoginPromptOpen, setIsProfileLoginPromptOpen] = useState(false);
  const [isCancelEventOpen, setIsCancelEventOpen] = useState(false);
  const [isEditDetailsOpen, setIsEditDetailsOpen] = useState(false);
  const [editDetailsForm, setEditDetailsForm] = useState({
    title: "",
    description: "",
  });
  const [isEditGalleryOpen, setIsEditGalleryOpen] = useState(false);
  const [isEditVoteOptionOpen, setIsEditVoteOptionOpen] = useState(false);
  const [isVoteOptionHistoryOpen, setIsVoteOptionHistoryOpen] = useState(false);
  const [editingVoteOption, setEditingVoteOption] = useState(null);
  const [editVoteOptionForm, setEditVoteOptionForm] = useState({
    venueId: "",
    date: "",
    startTime: "",
    endTime: "",
    note: "",
  });
  const [isEditScheduleOpen, setIsEditScheduleOpen] = useState(false);
  const [isScheduleHistoryOpen, setIsScheduleHistoryOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    venueId: "",
    date: "",
    startTime: "",
    endTime: "",
    note: "",
  });
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [isContactingVenue, setIsContactingVenue] = useState(false);
  const [showAllParticipants, setShowAllParticipants] = useState(false);
  const [impactData, setImpactData] = useState(null);
  const [isAddGuestOpen, setIsAddGuestOpen] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [galleryImageUrls, setGalleryImageUrls] = useState([]);
  const [isUploadingGalleryImage, setIsUploadingGalleryImage] = useState(false);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState(null);
  const [participantSearch, setParticipantSearch] = useState("");
  const [debouncedParticipantSearch, setDebouncedParticipantSearch] = useState("");
  const [participantSortOrder, setParticipantSortOrder] = useState("asc");
  const [participantPage, setParticipantPage] = useState(1);
  const [participantToRemove, setParticipantToRemove] = useState(null);
  const [removalPreview, setRemovalPreview] = useState(null);

  const { data: event, isLoading: isLoadingEvent } = useEvent(shareToken);
  const { data: options } = useOptionsWithVoters(event?.id, shareToken);
  const { data: participants = [] } = useParticipants(shareToken, { limit: 100 });
  const { data: participantDirectory } = useParticipantsDirectory(shareToken, {
    page: participantPage,
    limit: 10,
    search: debouncedParticipantSearch || undefined,
    sort_order: participantSortOrder,
  });
  const { data: paymentData } = usePayment(
    event?.id,
    !!sessionId &&
      (event?.status === "payment_open" || event?.status === "completed"),
  );
  const { data: venuesData } = useVenues({
    enabled: !!sessionId && (isEditScheduleOpen || isEditVoteOptionOpen),
  });
  const venues = venuesData?.venues || [];
  const { data: scheduleHistory = [], isLoading: isLoadingScheduleHistory } =
    useEventScheduleHistory(
      event?.id,
      isScheduleHistoryOpen,
      shareToken,
    );
  const {
    data: optionEditHistory = [],
    isLoading: isLoadingOptionEditHistory,
  } = useOptionEditHistory(event?.id, isVoteOptionHistoryOpen, shareToken);

  const votedOptionIds = useVotedOptionIds(options);

  const joinEvent = useJoinEvent();
  const leaveEvent = useLeaveEvent();
  const addGuestParticipant = useAddGuestParticipant();
  const removeParticipant = useRemoveParticipant();
  const removalImpact = useRemovalImpact();
  const castVote = useCastVote();
  const removeVote = useRemoveVote();
  const updateEventDetails = useUpdateEventDetails();
  const updateStatus = useUpdateEventStatus();
  const setChosenOption = useSetChosenOption();
  const updateOption = useUpdateOption();
  const updateEventSchedule = useUpdateEventSchedule();
  const updateEventImages = useUpdateEventImages();

  const isCreator = event && user && event.created_by === user.id;
  const hasJoined = participants?.some((p) => p.user_id === user?.id);
  const isJoinableStatus =
    (event?.status === "confirmed" ||
      event?.status === "open" ||
      event?.status === "payment_open");
  const canAddGuest =
    !!sessionId &&
    isJoinableStatus &&
    (isCreator || hasJoined);
  const canCancelEvent =
    isCreator &&
    event?.status !== "completed" &&
    event?.status !== "cancelled";
  const eventImages = event?.images || [];
  const participantDirectoryList = participantDirectory?.participants || [];
  const participantDirectoryTotal = participantDirectory?.total || 0;
  const participantDirectoryHasMore = participantDirectory?.has_more || false;
  const participantPageSize = 10;
  const visibleRegistrants = participantDirectoryList.filter(
    (p) => p.user_id !== event?.created_by,
  );
  const participantRangeStart =
    participantDirectoryTotal > 0 ? (participantPage - 1) * participantPageSize + 1 : 0;
  const participantRangeEnd =
    participantRangeStart > 0
      ? participantRangeStart + visibleRegistrants.length - 1
      : 0;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedParticipantSearch(participantSearch.trim());
      setParticipantPage(1);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [participantSearch]);

  usePageMeta({
    title: event?.title ? `${event.title} | Kumpul` : "Event Detail | Kumpul",
    description:
      event?.description ||
      (event?.status === "voting"
        ? "Vote on the best time and place for this event."
        : "See event details, participants, and payment status."),
    url: `${window.location.origin}${location.pathname}${location.search}${location.hash}`,
  });

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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Event not found
        </h1>
        <Link to="/" className="text-green-600 hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  const nowMs = Date.now();
  const deadlineDate = event.voting_deadline ? new Date(event.voting_deadline) : null;
  const hasValidDeadline = !!deadlineDate && !Number.isNaN(deadlineDate.getTime());
  const deadlineMs = hasValidDeadline ? deadlineDate.getTime() : null;
  const isDeadlineReached = hasValidDeadline ? nowMs >= deadlineMs : false;
  const isDeadlineNear =
    hasValidDeadline && !isDeadlineReached && deadlineMs - nowMs <= 24 * 60 * 60 * 1000;
  const isVotingPhase = event.status === "voting";
  const isVotingDeadlineReached = isVotingPhase && isDeadlineReached;
  const isVotingDeadlineNear = isVotingPhase && isDeadlineNear;

  const participantCount = participants?.length || 0;
  const playerCap = Number(event.player_cap || 0);
  const hasPlayerCap = Number.isFinite(playerCap) && playerCap > 0;
  const remainingSlots = hasPlayerCap ? playerCap - participantCount : null;
  const isCapReached = hasPlayerCap && remainingSlots <= 0;
  const capNearThreshold = hasPlayerCap ? Math.max(1, Math.ceil(playerCap * 0.2)) : 0;
  const isCapNear = hasPlayerCap && !isCapReached && remainingSlots <= capNearThreshold;

  const joinBlockedReason = isCapReached
    ? "Registration is closed because participant cap has been reached."
    : "";
  const voteBlockedReason = isVotingDeadlineReached
    ? "Voting is closed because the deadline has passed."
    : isCapReached
      ? "Voting is closed because participant cap has been reached."
      : "";
  const isJoinBlocked = !!joinBlockedReason;
  const isVoteBlocked = !!voteBlockedReason;

  const handleVote = async (optionId) => {
    if (isVoteBlocked) {
      showError(voteBlockedReason);
      return;
    }

    if (!sessionId) {
      setIsVoteLoginPromptOpen(true);
      return;
    }

    try {
      await castVote.mutateAsync({
        eventId: event.id,
        eventOptionId: optionId,
        shareToken,
      });
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  const handleUnvote = async (optionId) => {
    if (isVoteBlocked) {
      showError(voteBlockedReason);
      return;
    }

    if (!sessionId) {
      setIsVoteLoginPromptOpen(true);
      return;
    }

    try {
      await removeVote.mutateAsync({ eventId: event.id, optionId, shareToken });
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  const handleJoin = async () => {
    if (isJoinBlocked) {
      showError(joinBlockedReason);
      return;
    }

    if (!sessionId) {
      setIsJoinLoginPromptOpen(true);
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

  const handleAddGuest = async () => {
    if (isJoinBlocked) {
      showError(joinBlockedReason);
      return;
    }

    if (!sessionId) {
      setIsJoinLoginPromptOpen(true);
      return;
    }

    if (!guestName.trim()) return;
    try {
      await addGuestParticipant.mutateAsync({
        eventId: event.id,
        shareToken,
        guestName: guestName.trim(),
      });
      setGuestName("");
      setIsAddGuestOpen(false);
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  const handleRemoveParticipant = async () => {
    if (!participantToRemove) return;

    try {
      await removeParticipant.mutateAsync({
        eventId: event.id,
        participantId: participantToRemove.id,
        shareToken,
        onImpact: (data) => {
          setImpactData(data);
        },
      });
      setParticipantToRemove(null);
      setRemovalPreview(null);
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  const openRemoveParticipantModal = async (participant) => {
    setParticipantToRemove(participant);
    setRemovalPreview(null);

    try {
      const data = await removalImpact.mutateAsync({
        eventId: event.id,
        participantId: participant.id,
      });
      setRemovalPreview(data);
    } catch (error) {
      setParticipantToRemove(null);
      setRemovalPreview(null);
      showError(getErrorMessage(error));
    }
  };

  const handleCloseVoting = async () => {
    if (selectedOptionId) {
      try {
        await setChosenOption.mutateAsync({
          eventId: event.id,
          optionId: selectedOptionId,
          shareToken,
        });
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

  const handleOpenEditDetails = () => {
    setEditDetailsForm({
      title: event.title || "",
      description: event.description || "",
    });
    setIsEditDetailsOpen(true);
  };

  const handleSubmitEventDetails = async () => {
    const nextTitle = editDetailsForm.title.trim();
    const nextDescription = editDetailsForm.description.trim();

    if (!nextTitle) {
      showError("Title cannot be empty");
      return;
    }

    const payload = {};
    if (nextTitle !== (event.title || "")) {
      payload.title = nextTitle;
    }
    if (nextDescription !== (event.description || "")) {
      payload.description = nextDescription;
    }

    if (Object.keys(payload).length === 0) {
      setIsEditDetailsOpen(false);
      return;
    }

    try {
      await updateEventDetails.mutateAsync({
        eventId: event.id,
        shareToken,
        data: payload,
      });
      setIsEditDetailsOpen(false);
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  const normalizeTimeValue = (value) => {
    if (!value) return "";
    return value.length >= 5 ? value.slice(0, 5) : value;
  };

  const handleOpenEditSchedule = () => {
    if (!chosenOption) return;

    setScheduleForm({
      venueId: chosenOption.venue?.id || chosenOption.venue_id || "",
      date: chosenOption.date ? chosenOption.date.slice(0, 10) : "",
      startTime: normalizeTimeValue(chosenOption.start_time),
      endTime: normalizeTimeValue(chosenOption.end_time),
      note: "",
    });
    setIsEditScheduleOpen(true);
  };

  const handleSubmitScheduleUpdate = async () => {
    if (
      !scheduleForm.venueId ||
      !scheduleForm.date ||
      !scheduleForm.startTime ||
      !scheduleForm.endTime ||
      !scheduleForm.note.trim()
    ) {
      showError("Please complete all fields, including the change note");
      return;
    }

    try {
      await updateEventSchedule.mutateAsync({
        eventId: event.id,
        shareToken,
        data: {
          venue_id: scheduleForm.venueId,
          date: toRFC3339(`${scheduleForm.date}T00:00`),
          start_time: scheduleForm.startTime,
          end_time: scheduleForm.endTime,
          note: scheduleForm.note.trim(),
        },
      });
      setIsEditScheduleOpen(false);
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  const handleOpenEditVoteOption = (option) => {
    if (!option) return;

    setEditingVoteOption(option);
    setEditVoteOptionForm({
      venueId: option.venue?.id || option.venue_id || "",
      date: option.date ? option.date.slice(0, 10) : "",
      startTime: normalizeTimeValue(option.start_time),
      endTime: normalizeTimeValue(option.end_time),
      note: "",
    });
    setIsEditVoteOptionOpen(true);
  };

  const handleSubmitVoteOptionUpdate = async () => {
    if (
      !editingVoteOption?.id ||
      !editVoteOptionForm.venueId ||
      !editVoteOptionForm.date ||
      !editVoteOptionForm.startTime ||
      !editVoteOptionForm.endTime
    ) {
      showError("Please complete venue, date, and time fields");
      return;
    }

    try {
      const payload = {
        venue_id: editVoteOptionForm.venueId,
        date: toRFC3339(`${editVoteOptionForm.date}T00:00`),
        start_time: editVoteOptionForm.startTime,
        end_time: editVoteOptionForm.endTime,
      };

      if (editVoteOptionForm.note.trim()) {
        payload.note = editVoteOptionForm.note.trim();
      }

      await updateOption.mutateAsync({
        eventId: event.id,
        optionId: editingVoteOption.id,
        shareToken,
        data: payload,
      });

      setIsEditVoteOptionOpen(false);
      setEditingVoteOption(null);
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  const handleOpenEditGallery = () => {
    setGalleryImageUrls(eventImages.map((image) => image.image_url).slice(0, 3));
    setIsEditGalleryOpen(true);
  };

  const handleGalleryImageUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showError("Please choose an image file");
      return;
    }
    if (galleryImageUrls.length >= 3) {
      showError("Maximum 3 gallery images");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const result = reader.result;
      const base64 = result?.toString().split(",")[1];
      if (!base64) return;

      setIsUploadingGalleryImage(true);
      try {
        const { url } = await uploadImage(base64);
        setGalleryImageUrls((prev) => [...prev, url].slice(0, 3));
      } catch (error) {
        showError(getErrorMessage(error));
      } finally {
        setIsUploadingGalleryImage(false);
      }
    };
  };

  const handleSaveGallery = async () => {
    try {
      await updateEventImages.mutateAsync({
        eventId: event.id,
        shareToken,
        imageUrls: galleryImageUrls,
      });
      setIsEditGalleryOpen(false);
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  const handleCancelEvent = async () => {
    try {
      await updateStatus.mutateAsync({
        eventId: event.id,
        status: "cancelled",
        shareToken,
      });
      setIsCancelEventOpen(false);
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  const handleOpenUserEvents = (userId) => {
    if (!userId) return;

    if (!sessionId) {
      setIsProfileLoginPromptOpen(true);
      return;
    }

    navigate(`/users/${userId}/events`);
  };

  const chosenOption = options?.find((o) => o.id === event.chosen_option_id);
  const loginTarget = `${location.pathname}${location.search}${location.hash}`;
  const creatorParticipant = participants?.find(
    (p) => p.user_id === event.created_by,
  );
  const chosenOptionMapsUrl = chosenOption?.venue?.maps_url;
  const chosenOptionEmbedUrl = getEmbeddableMapUrl(chosenOptionMapsUrl);
  const addToCalendarUrl = getGoogleCalendarUrl({
    event,
    chosenOption,
    shareToken,
  });
  const canAddToCalendar = Boolean(chosenOption && (hasJoined || isCreator));
  const removeParticipantName = participantToRemove?.is_guest
    ? participantToRemove?.guest_name
    : participantToRemove?.user?.name;
  const scheduleHasCoreChanges = Boolean(
    chosenOption &&
      (scheduleForm.venueId !==
        (chosenOption.venue?.id || chosenOption.venue_id || "") ||
        scheduleForm.date !== (chosenOption.date ? chosenOption.date.slice(0, 10) : "") ||
        scheduleForm.startTime !== normalizeTimeValue(chosenOption.start_time) ||
        scheduleForm.endTime !== normalizeTimeValue(chosenOption.end_time)),
  );
  const canSubmitScheduleUpdate = Boolean(
    scheduleForm.venueId &&
      scheduleForm.date &&
      scheduleForm.startTime &&
      scheduleForm.endTime &&
      scheduleForm.note.trim() &&
      scheduleHasCoreChanges,
  );
  const voteOptionHasChanges = Boolean(
    editingVoteOption &&
      (editVoteOptionForm.venueId !==
        (editingVoteOption.venue?.id || editingVoteOption.venue_id || "") ||
        editVoteOptionForm.date !==
          (editingVoteOption.date ? editingVoteOption.date.slice(0, 10) : "") ||
        editVoteOptionForm.startTime !==
          normalizeTimeValue(editingVoteOption.start_time) ||
        editVoteOptionForm.endTime !==
          normalizeTimeValue(editingVoteOption.end_time) ||
        editVoteOptionForm.note.trim().length > 0),
  );
  const canSubmitVoteOptionUpdate = Boolean(
    editVoteOptionForm.venueId &&
      editVoteOptionForm.date &&
      editVoteOptionForm.startTime &&
      editVoteOptionForm.endTime &&
      voteOptionHasChanges,
  );

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
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white/85 backdrop-blur border-b border-gray-200 px-4 py-4">
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
                <p className="text-sm text-gray-500 mt-1 break-all">
                  {renderLinkifiedText(event.description)}
                </p>
              )}
              <span className="inline-flex mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                {event.visibility === "public" ? "Public" : "Invite only"}
              </span>
            </div>
            <EventStatusBadge status={event.status} />
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <ShareButton
              shareToken={event.share_token}
              event={event}
              chosenOption={chosenOption}
              payment={paymentData?.payment}
            />
            {isCreator && event.status !== "cancelled" && (
              <Button
                variant="secondary"
                onClick={handleOpenEditDetails}
                className="px-3"
              >
                <Pencil className="w-4 h-4" />
                Edit Details
              </Button>
            )}
            {/* Join/Leave only allowed when status is open or payment_open */}
            {!isCreator && isJoinableStatus && (
                <Button
                  variant={hasJoined ? "secondary" : "primary"}
                  onClick={hasJoined ? handleLeave : handleJoin}
                  disabled={!hasJoined && isJoinBlocked}
                  loading={joinEvent.isPending || leaveEvent.isPending}
                >
                  {hasJoined ? "Leave" : "Join"}
                </Button>
              )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {(isVotingDeadlineNear ||
          isCapNear ||
          isVotingDeadlineReached ||
          isCapReached) && (
          <div
            className={`rounded-xl border p-4 ${
              isVotingDeadlineReached || isCapReached
                ? "border-red-200 bg-red-50"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <div className="flex items-start gap-2">
              <AlertCircle
                className={`mt-0.5 h-4 w-4 shrink-0 ${
                  isVotingDeadlineReached || isCapReached
                    ? "text-red-600"
                    : "text-amber-600"
                }`}
              />
              <div className="space-y-1 text-sm">
                {isVotingDeadlineReached && (
                  <p className="text-red-800">
                    Deadline reached on {formatDateTime(event.voting_deadline)}.
                  </p>
                )}
                {isCapReached && (
                  <p className="text-red-800">
                    Participant cap reached ({participantCount}/{playerCap}).
                  </p>
                )}
                {isVotingDeadlineNear && (
                  <p className="text-amber-800">
                    Deadline is near: {formatDateTime(event.voting_deadline)}.
                  </p>
                )}
                {isCapNear && (
                  <p className="text-amber-800">
                    Almost full: {participantCount}/{playerCap} registrants.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Chosen Option */}
        {chosenOption && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-green-800 mb-2">
              <Check className="w-5 h-5" />
              <span className="font-semibold">Confirmed</span>
            </div>
            <h3 className="font-semibold text-gray-900">
              {chosenOption.venue?.name}
            </h3>
            {chosenOption.venue?.address && (
              <p className="text-sm text-gray-500 flex items-start gap-1 mt-1 min-w-0">
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span className="break-all">
                  {renderLinkifiedText(chosenOption.venue.address)}
                </span>
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
            {canAddToCalendar && addToCalendarUrl && (
              <div className="mt-3">
                <a
                  href={addToCalendarUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 hover:text-green-800"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Add to Google Calendar
                </a>
              </div>
            )}
            {chosenOptionMapsUrl && (
              <div className="mt-3 space-y-2">
                <a
                  href={chosenOptionMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 hover:text-green-800"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Map
                </a>
                {chosenOptionEmbedUrl && (
                  <div className="overflow-hidden rounded-lg border border-green-200">
                    <iframe
                      title={`Map for ${chosenOption.venue?.name || "venue"}`}
                      src={chosenOptionEmbedUrl}
                      className="h-56 w-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {(eventImages.length > 0 || isCreator) && (
          <div className="surface-card p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Event Gallery
              </h2>
              {isCreator && (
                <Button
                  variant="secondary"
                  onClick={handleOpenEditGallery}
                  className="px-3 py-1.5 text-xs"
                >
                  Edit Gallery
                </Button>
              )}
            </div>
            {eventImages.length > 0 ? (
              <div
                className={`grid grid-cols-1 gap-3 ${
                  eventImages.length === 1
                    ? ""
                    : eventImages.length === 2
                      ? "sm:grid-cols-2"
                      : "sm:grid-cols-2 lg:grid-cols-3"
                }`}
              >
                {eventImages.map((image) => (
                  <button
                    key={image.id || image.image_url}
                    type="button"
                    onClick={() => setSelectedGalleryImage(image.image_url)}
                    className="overflow-hidden rounded-xl"
                  >
                    <img
                      src={image.image_url}
                      alt={event.title}
                      className="h-44 w-full rounded-xl object-cover transition-transform hover:scale-[1.02]"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No gallery images yet.</p>
            )}
          </div>
        )}

        {/* Voting Section */}
        {event.status === "voting" && (
          <div className="surface-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Vote for Date & Location
              </h2>
              <div className="flex items-center gap-2">
                {event.voting_deadline && (
                  <span className="text-xs text-gray-400">
                    Ends {formatDateTime(event.voting_deadline)}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {options?.map((option) => (
                <div key={option.id} className="space-y-2">
                  <OptionCard
                    option={option}
                    hasVoted={votedOptionIds.includes(option.id)}
                    onVote={() => handleVote(option.id)}
                    onUnvote={() => handleUnvote(option.id)}
                    onVoterClick={(voter) => handleOpenUserEvents(voter.user_id)}
                    voteDisabled={isVoteBlocked}
                    voteDisabledReason={voteBlockedReason}
                    isVoting={castVote.isPending || removeVote.isPending}
                  />
                  {isCreator && (
                    <Button
                      variant="secondary"
                      onClick={() => handleOpenEditVoteOption(option)}
                      className="w-full"
                    >
                      Edit Option
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {isCreator && (
              <div className="space-y-2 mt-4">
                <Button
                  variant="ghost"
                  onClick={() => setIsVoteOptionHistoryOpen(true)}
                  className="w-full"
                >
                  View Vote Edit History
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setIsCloseVotingOpen(true)}
                  className="w-full"
                >
                  Close Voting
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Creator Actions for Confirmed */}
        {isCreator && event.status === "confirmed" && (
          <div className="surface-card p-4">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              Next Steps
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              If this event still needs confirmation from the place, contact the
              venue first. Open RSVP when you are ready to move this event to
              the next status.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleContactVenue}
                loading={isContactingVenue}
                className="flex-1"
              >
                <ExternalLink className="w-4 h-4" />
                Contact Location
              </Button>
              <Button
                variant="primary"
                onClick={() =>
                  updateStatus.mutateAsync({
                    eventId: event.id,
                    status: "open",
                    shareToken,
                  })
                }
                loading={updateStatus.isPending}
                className="flex-1"
              >
                Open RSVP
              </Button>
            </div>
            <div className="flex gap-3 mt-3">
              <Button
                variant="secondary"
                onClick={handleOpenEditSchedule}
                className="flex-1"
              >
                Edit Location & Time
              </Button>
            </div>
          </div>
        )}

        {isCreator &&
          (event.status === "confirmed" || event.status === "open") && (
            <div className="surface-card p-4">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                Event History
              </h2>
              <p className="text-sm text-gray-600 mb-3">
                Review changes to the confirmed event schedule and location.
              </p>
              <Button
                variant="ghost"
                onClick={() => setIsScheduleHistoryOpen(true)}
                className="w-full"
              >
                View Edit Event History
              </Button>
            </div>
          )}

        {/* Participants */}
        {event.status !== "voting" && (
          <div className="surface-card p-4">
            <div className="mb-4 rounded-2xl bg-gradient-to-r from-green-50 via-white to-emerald-50 p-4 ring-1 ring-green-100">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">
                    Registrants
                  </h2>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {participantDirectoryTotal} registered
                    {event.player_cap ? ` of ${event.player_cap} spots` : ""}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Browse who has joined, search by name, or sort the list.
                  </p>
                </div>
                {canAddGuest && (
                  <Button
                    variant="secondary"
                    onClick={() => setIsAddGuestOpen(true)}
                    disabled={isJoinBlocked}
                    className="px-3 py-2 text-sm sm:self-center"
                  >
                    Add Guest
                  </Button>
                )}
              </div>
            </div>

            {creatorParticipant && (
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50 p-3">
                <Avatar
                  src={creatorParticipant.user?.avatar_url}
                  name={creatorParticipant.user?.name}
                  size="sm"
                />
                <div className="flex-1">
                  <button
                    type="button"
                    onClick={() => handleOpenUserEvents(event.created_by)}
                    className="text-sm font-medium text-gray-900 hover:text-green-700 hover:underline"
                  >
                    {creatorParticipant.user?.name}
                  </button>
                  <p className="text-xs text-amber-600">Organizer</p>
                </div>
                <Crown className="w-4 h-4 text-amber-500" />
              </div>
            )}

            <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50/70 p-3">
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                    Search
                  </label>
                  <Input
                    placeholder="Search registrant name"
                    value={participantSearch}
                    onChange={(e) => setParticipantSearch(e.target.value)}
                  />
                </div>
                <div className="md:w-48">
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                    Sort
                  </label>
                  <select
                    value={participantSortOrder}
                    onChange={(e) => {
                      setParticipantSortOrder(e.target.value);
                      setParticipantPage(1);
                    }}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="asc">Name A-Z</option>
                    <option value="desc">Name Z-A</option>
                  </select>
                </div>
              </div>
            </div>

            <ParticipantList
              participants={visibleRegistrants}
              isCreatorId={event.created_by}
              isCreator={isCreator}
              onRemove={openRemoveParticipantModal}
              onParticipantClick={(participant) =>
                handleOpenUserEvents(participant.user_id)
              }
              eventId={event.id}
              eventStatus={event.status}
              maxDisplay={100}
              variant="directory"
            />

            <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                {participantRangeStart > 0
                  ? `Showing ${participantRangeStart}-${participantRangeEnd} of ${participantDirectoryTotal} registrants`
                  : "No registrants found"}
              </p>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Button
                  variant="secondary"
                  onClick={() => setParticipantPage((prev) => Math.max(1, prev - 1))}
                  disabled={participantPage <= 1}
                  className="px-3 py-1.5 text-xs"
                >
                  Prev
                </Button>
                <span className="min-w-16 text-center text-xs font-medium text-gray-500">
                  Page {participantPage}
                </span>
                <Button
                  variant="secondary"
                  onClick={() => setParticipantPage((prev) => prev + 1)}
                  disabled={!participantDirectoryHasMore}
                  className="px-3 py-1.5 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>

            {isJoinBlocked && (
              <p className="text-xs text-red-500 mt-3">{joinBlockedReason}</p>
            )}
          </div>
        )}

        {/* Payment Section */}
        {(event.status === "payment_open" || event.status === "completed") && (
          <div className="surface-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Payment
              </h2>
              <Button variant="secondary" onClick={handleOpenPayment}>
                View Details
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              Payment collection is open. Click "View Details" to see payment
              info and submit your proof.
            </p>
          </div>
        )}

        {/* Creator: Open Payment */}
        {isCreator && event.status === "open" && (
          <>
            <div className="surface-card p-4">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                Ready to collect payment?
              </h2>
              <div className="space-y-2">
                <Button
                  variant="primary"
                  onClick={handleOpenPayment}
                  className="w-full"
                >
                  Open Payment
                </Button>
              </div>
            </div>

            {canCancelEvent && (
              <div className="surface-card p-4">
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Event Management
                </h2>
                <p className="text-sm text-gray-600 mb-3">
                  Need to stop this event? You can cancel it so no one can vote,
                  join, or continue payment actions.
                </p>
                <Button
                  variant="danger"
                  onClick={() => setIsCancelEventOpen(true)}
                  className="w-full"
                >
                  Cancel Event
                </Button>
              </div>
            )}
          </>
        )}

        {canCancelEvent && event.status !== "open" && (
          <div className="surface-card p-4">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              Event Management
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              Need to stop this event? You can cancel it so no one can vote,
              join, or continue payment actions.
            </p>
            <Button
              variant="danger"
              onClick={() => setIsCancelEventOpen(true)}
              className="w-full"
            >
              Cancel Event
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

      <Modal
        isOpen={isVoteLoginPromptOpen}
        onClose={() => setIsVoteLoginPromptOpen(false)}
        title="Login Required"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            You need to log in first to vote on event options.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsVoteLoginPromptOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                navigate(`/login?returnTo=${encodeURIComponent(loginTarget)}`)
              }
              className="flex-1"
            >
              Go to Login
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isJoinLoginPromptOpen}
        onClose={() => setIsJoinLoginPromptOpen(false)}
        title="Login Required"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            You need to log in first to join this event or add a guest.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsJoinLoginPromptOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                navigate(`/login?returnTo=${encodeURIComponent(loginTarget)}`)
              }
              className="flex-1"
            >
              Go to Login
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isProfileLoginPromptOpen}
        onClose={() => setIsProfileLoginPromptOpen(false)}
        title="Login Required"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            You need to log in first to open participant profiles.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsProfileLoginPromptOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                navigate(`/login?returnTo=${encodeURIComponent(loginTarget)}`)
              }
              className="flex-1"
            >
              Go to Login
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isCancelEventOpen}
        onClose={() => setIsCancelEventOpen(false)}
        title="Cancel Event"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This will set the event status to cancelled. Participants can still
            view the event, but voting, joining, and payment actions will stop.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsCancelEventOpen(false)}
              className="flex-1"
            >
              Keep Event
            </Button>
            <Button
              variant="danger"
              onClick={handleCancelEvent}
              loading={updateStatus.isPending}
              className="flex-1"
            >
              Yes, Cancel
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isEditDetailsOpen}
        onClose={() => setIsEditDetailsOpen(false)}
        title="Edit Event Details"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            required
            value={editDetailsForm.title}
            onChange={(e) =>
              setEditDetailsForm((prev) => ({
                ...prev,
                title: e.target.value,
              }))
            }
          />
          <Textarea
            label="Description"
            rows={4}
            value={editDetailsForm.description}
            onChange={(e) =>
              setEditDetailsForm((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            placeholder="Optional event description"
          />
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsEditDetailsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitEventDetails}
              loading={updateEventDetails.isPending}
              disabled={!editDetailsForm.title.trim()}
              className="flex-1"
            >
              Save Details
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isEditGalleryOpen}
        onClose={() => setIsEditGalleryOpen(false)}
        title="Edit Event Gallery"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Upload or remove event gallery images. Maximum 3 images.
          </p>
          <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-600 hover:border-green-400 hover:bg-green-50">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isUploadingGalleryImage || galleryImageUrls.length >= 3}
              onChange={(e) => {
                const file = e.target.files?.[0];
                handleGalleryImageUpload(file);
                e.target.value = "";
              }}
            />
            {isUploadingGalleryImage
              ? "Uploading image..."
              : galleryImageUrls.length >= 3
                ? "Gallery limit reached"
                : "Upload image"}
          </label>
          {galleryImageUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {galleryImageUrls.map((url, index) => (
                <div key={`${url}-${index}`} className="relative">
                  <img
                    src={url}
                    alt={`Gallery ${index + 1}`}
                    className="h-24 w-full rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setGalleryImageUrls((prev) =>
                        prev.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                    className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsEditGalleryOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveGallery}
              loading={updateEventImages.isPending}
              className="flex-1"
            >
              Save Gallery
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!selectedGalleryImage}
        onClose={() => setSelectedGalleryImage(null)}
        title="Event Image"
      >
        {selectedGalleryImage && (
          <div className="space-y-4">
            <img
              src={selectedGalleryImage}
              alt={event?.title || "Event gallery"}
              className="max-h-[70vh] w-full rounded-xl object-contain bg-black/5"
            />
            <Button
              variant="secondary"
              onClick={() => setSelectedGalleryImage(null)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isEditVoteOptionOpen}
        onClose={() => {
          setIsEditVoteOptionOpen(false);
          setEditingVoteOption(null);
        }}
        title="Edit Vote Option"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Update this option while event status is still voting.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              value={editVoteOptionForm.venueId}
              onChange={(e) =>
                setEditVoteOptionForm((prev) => ({
                  ...prev,
                  venueId: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select location</option>
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Date"
            type="date"
            required
            value={editVoteOptionForm.date}
            onChange={(e) =>
              setEditVoteOptionForm((prev) => ({ ...prev, date: e.target.value }))
            }
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Time"
              type="time"
              required
              value={editVoteOptionForm.startTime}
              onChange={(e) =>
                setEditVoteOptionForm((prev) => ({
                  ...prev,
                  startTime: e.target.value,
                }))
              }
            />
            <Input
              label="End Time"
              type="time"
              required
              value={editVoteOptionForm.endTime}
              onChange={(e) =>
                setEditVoteOptionForm((prev) => ({
                  ...prev,
                  endTime: e.target.value,
                }))
              }
            />
          </div>

          <textarea
            value={editVoteOptionForm.note}
            onChange={(e) =>
              setEditVoteOptionForm((prev) => ({ ...prev, note: e.target.value }))
            }
            rows={3}
            placeholder="Optional note for edit history"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          />
          {!voteOptionHasChanges && (
            <p className="text-xs text-gray-500">
              Make a change first before saving.
            </p>
          )}

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditVoteOptionOpen(false);
                setEditingVoteOption(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitVoteOptionUpdate}
              disabled={!canSubmitVoteOptionUpdate}
              loading={updateOption.isPending}
              className="flex-1"
            >
              Save Option
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isVoteOptionHistoryOpen}
        onClose={() => setIsVoteOptionHistoryOpen(false)}
        title="Vote Option Edit History"
      >
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {isLoadingOptionEditHistory ? (
            <Spinner />
          ) : optionEditHistory.length === 0 ? (
            <p className="text-sm text-gray-500">No vote option edits yet.</p>
          ) : (
            optionEditHistory.map((log) => (
              <div key={log.id} className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-400">
                  {formatBackendUtcTimestamp(log.created_at)}
                </p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {log.editor?.name || "Organizer"}
                </p>
                {log.note && (
                  <p className="text-sm text-gray-600 mt-1">{log.note}</p>
                )}
                <div className="mt-2 text-xs text-gray-500 space-y-1">
                  <p>
                    From: {log.old_venue?.name || "-"} · {formatDate(log.old_date)} ·{" "}
                    {normalizeTimeValue(log.old_start_time)}-
                    {normalizeTimeValue(log.old_end_time)}
                  </p>
                  <p>
                    To: {log.new_venue?.name || "-"} · {formatDate(log.new_date)} ·{" "}
                    {normalizeTimeValue(log.new_start_time)}-
                    {normalizeTimeValue(log.new_end_time)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isEditScheduleOpen}
        onClose={() => setIsEditScheduleOpen(false)}
        title="Edit Event Schedule"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Update confirmed location/date/time and add a note. This note is saved
            in schedule edit history.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              value={scheduleForm.venueId}
              onChange={(e) =>
                setScheduleForm((prev) => ({ ...prev, venueId: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select location</option>
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date"
              type="date"
              required
              value={scheduleForm.date}
              onChange={(e) =>
                setScheduleForm((prev) => ({ ...prev, date: e.target.value }))
              }
            />
            <Input
              label="Start Time"
              type="time"
              required
              value={scheduleForm.startTime}
              onChange={(e) =>
                setScheduleForm((prev) => ({ ...prev, startTime: e.target.value }))
              }
            />
          </div>

          <Input
            label="End Time"
            type="time"
            required
            value={scheduleForm.endTime}
            onChange={(e) =>
              setScheduleForm((prev) => ({ ...prev, endTime: e.target.value }))
            }
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Change Note <span className="text-red-500 ml-1">*</span>
            </label>
            <textarea
            value={scheduleForm.note}
            onChange={(e) =>
              setScheduleForm((prev) => ({ ...prev, note: e.target.value }))
            }
            rows={3}
            placeholder="Why this schedule changed..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          />
          </div>
          {!scheduleHasCoreChanges && (
            <p className="text-xs text-gray-500">
              Change location/date/time first before saving.
            </p>
          )}

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsEditScheduleOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitScheduleUpdate}
              disabled={!canSubmitScheduleUpdate}
              loading={updateEventSchedule.isPending}
              className="flex-1"
            >
              Save Schedule
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isScheduleHistoryOpen}
        onClose={() => setIsScheduleHistoryOpen(false)}
        title="Schedule Edit History"
      >
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {isLoadingScheduleHistory ? (
            <Spinner />
          ) : scheduleHistory.length === 0 ? (
            <p className="text-sm text-gray-500">No schedule edits yet.</p>
          ) : (
            scheduleHistory.map((log) => (
              <div key={log.id} className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-400">
                  {formatBackendUtcTimestamp(log.created_at)}
                </p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {log.editor?.name || "Organizer"}
                </p>
                <p className="text-sm text-gray-600 mt-1">{log.note}</p>
                <div className="mt-2 text-xs text-gray-500 space-y-1">
                  <p>
                    From: {log.old_venue?.name || "-"} · {formatDate(log.old_date)} ·{" "}
                    {normalizeTimeValue(log.old_start_time)}-
                    {normalizeTimeValue(log.old_end_time)}
                  </p>
                  <p>
                    To: {log.new_venue?.name || "-"} · {formatDate(log.new_date)} ·{" "}
                    {normalizeTimeValue(log.new_start_time)}-
                    {normalizeTimeValue(log.new_end_time)}
                  </p>
                </div>
              </div>
            ))
          )}
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
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Impact on remaining participants:
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {impactData.impacts.map((impact) => (
                    <div
                      key={impact.participant_id}
                      className={`p-3 rounded-lg ${getActionStyle(impact.action)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getActionIcon(impact.action)}
                          <span className="font-medium">
                            {impact.display_name}
                          </span>
                        </div>
                        <span className="text-sm font-medium">
                          {getActionText(impact.action, impact.action_amount)}
                        </span>
                      </div>
                      {impact.paid_amount > 0 && (
                        <p className="text-xs mt-1 opacity-75">
                          Paid: {formatRupiah(impact.paid_amount)} | New split:{" "}
                          {formatRupiah(impact.new_split)}
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

      <Modal
        isOpen={isAddGuestOpen}
        onClose={() => setIsAddGuestOpen(false)}
        title="Add Guest"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Guest Name
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Guest Player"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsAddGuestOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddGuest}
              loading={addGuestParticipant.isPending}
              disabled={!guestName.trim()}
              className="flex-1"
            >
              Add Guest
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!participantToRemove}
        onClose={() => {
          setParticipantToRemove(null);
          setRemovalPreview(null);
        }}
        title="Remove Participant"
      >
        {participantToRemove && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
              {participantToRemove.is_guest ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-600">
                  <UserRound className="w-5 h-5" />
                </div>
              ) : (
                <Avatar
                  src={participantToRemove.user?.avatar_url}
                  name={participantToRemove.user?.name}
                  size="lg"
                />
              )}
              <div>
                <p
                  className={`font-medium text-gray-900 ${participantToRemove.is_guest ? "italic" : ""}`}
                >
                  {removeParticipantName}
                </p>
                <p className="text-sm text-gray-500">
                  {participantToRemove.is_guest
                    ? "Guest participant"
                    : "Registered participant"}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div className="text-sm text-amber-900">
                  <p className="font-medium">
                    This will remove them from the event.
                  </p>
                  <p className="mt-1 text-amber-800">
                    If payment is already open, their payment record will be
                    deleted and everyone else's split may change.
                  </p>
                </div>
              </div>
            </div>

            {removalImpact.isPending ? (
              <div className="flex items-center justify-center py-6">
                <Spinner />
              </div>
            ) : removalPreview?.removed_payment ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <p className="text-sm font-medium text-gray-900">
                    Removed payment summary
                  </p>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <p>
                      Status:{" "}
                      <span className="font-medium text-gray-900">
                        {removalPreview.removed_payment.status || "-"}
                      </span>
                    </p>
                    <p>
                      Paid amount:{" "}
                      <span className="font-medium text-gray-900">
                        {formatRupiah(
                          removalPreview.removed_payment.paid_amount,
                        )}
                      </span>
                    </p>
                    <p>
                      Potential refund:{" "}
                      <span className="font-medium text-gray-900">
                        {formatRupiah(
                          removalPreview.removed_payment.refund_amount,
                        )}
                      </span>
                    </p>
                    {removalPreview.removed_payment.pending_claimed_amount >
                      0 && (
                      <p className="text-amber-700">
                        There is still{" "}
                        {formatRupiah(
                          removalPreview.removed_payment.pending_claimed_amount,
                        )}{" "}
                        in unconfirmed claims.
                      </p>
                    )}
                  </div>
                </div>

                {removalPreview.removed_payment.claims?.length > 0 && (
                  <div className="rounded-xl border border-gray-200 p-3">
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      Claim history
                    </p>
                    <div className="space-y-3 max-h-56 overflow-y-auto">
                      {removalPreview.removed_payment.claims.map((claim) => (
                        <div
                          key={claim.id}
                          className="rounded-lg border border-gray-100 p-2"
                        >
                          <p className="text-xs text-gray-500">
                            {claim.status} •{" "}
                            {formatRupiah(claim.claimed_amount)}
                          </p>
                          {claim.proof_image_url && (
                            <img
                              src={claim.proof_image_url}
                              alt="Claim proof"
                              className="mt-2 w-full rounded-lg"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            <p className="text-sm text-gray-600">
              Are you sure you want to remove{" "}
              <span className="font-medium text-gray-900">
                {removeParticipantName}
              </span>
              ?
            </p>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setParticipantToRemove(null);
                  setRemovalPreview(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleRemoveParticipant}
                loading={removeParticipant.isPending}
                disabled={removalImpact.isPending}
                className="flex-1"
              >
                Remove Participant
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EventDetailPage;
