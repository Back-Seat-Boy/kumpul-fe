import { useEffect, useState } from "react";
import { useParams, Link, useLocation, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertCircle,
  Copy,
  Wallet,
  TrendingUp,
  MinusCircle,
  PlusCircle,
  Check,
  Pencil,
  Settings2,
  Send,
} from "lucide-react";
import {
  usePayment,
  useCreatePayment,
  useChargeAllPayments,
  useClaimPayment,
  useConfirmPayment,
  useAdjustPayment,
  useUpdatePayment,
  useUpdatePaymentConfig,
} from "../hooks/usePayments";
import { useEvent, useUpdateEventStatus } from "../hooks/useEvents";
import { useParticipants } from "../hooks/useParticipants";
import { useAuthStore } from "../store/authStore";
import { Button } from "../components/ui/Button";
import { CurrencyInput } from "../components/ui/CurrencyInput";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Spinner } from "../components/ui/Spinner";
import { Textarea } from "../components/ui/Textarea";
import { PaymentRecordRow } from "../components/payment/PaymentRecordRow";
import { ProofUploader } from "../components/payment/ProofUploader";
import { formatBackendTimestamp, formatRupiah } from "../utils/format";
import { uploadImage } from "../api/uploads";
import { useToastStore, getErrorMessage } from "../utils/toast";
import { useMyPaymentMethods } from "../hooks/useUsers";
import {
  useConfirmRefundReceipt,
  useEventRefunds,
  useMarkRefundSent,
  useMyRefunds,
  useUpdateRefundDestination,
} from "../hooks/useRefunds";

// Helper to get action icon and color
const getActionStyle = (action) => {
  switch (action) {
    case "pay_full":
      return {
        icon: <Clock className="w-4 h-4" />,
        color: "text-yellow-600",
        bg: "bg-yellow-50",
      };
    case "pay_more":
      return {
        icon: <MinusCircle className="w-4 h-4" />,
        color: "text-orange-600",
        bg: "bg-orange-50",
      };
    case "receive_refund":
      return {
        icon: <PlusCircle className="w-4 h-4" />,
        color: "text-green-600",
        bg: "bg-green-50",
      };
    case "no_action":
      return {
        icon: <Check className="w-4 h-4" />,
        color: "text-green-600",
        bg: "bg-green-50",
      };
    default:
      return { icon: null, color: "text-gray-600", bg: "bg-gray-50" };
  }
};

// Helper to format action text
const getActionText = (action, amount) => {
  switch (action) {
    case "pay_full":
      return `Need to pay ${formatRupiah(amount)}`;
    case "pay_more":
      return `Pay ${formatRupiah(amount)} more`;
    case "receive_refund":
      return `Receive ${formatRupiah(amount)} refund`;
    case "no_action":
      return "Paid ✓";
    default:
      return "";
  }
};

// Helper to get action button text for creator
const getActionButtonText = (action) => {
  switch (action) {
    case "pay_more":
      return "Record Additional";
    case "receive_refund":
      return "Record Refund";
    default:
      return null;
  }
};

const getParticipantDisplayName = (participant) => {
  if (!participant) return "Participant";
  const hasGuestName = Boolean(participant.guest_name);
  const isGuestLike = participant.is_guest || (!participant.user_id && hasGuestName);

  if (isGuestLike) return participant.guest_name || "Guest";
  return participant.user?.name || participant.guest_name || "Participant";
};

const getRefundStatusText = (status) => {
  switch (status) {
    case "pending_info":
      return "Waiting for destination info";
    case "ready_to_send":
      return "Ready to send";
    case "sent":
      return "Refund sent";
    case "received":
      return "Refund received";
    default:
      return status || "Unknown";
  }
};

const getRefundStatusClasses = (status) => {
  switch (status) {
    case "pending_info":
      return "bg-yellow-50 text-yellow-800 border-yellow-200";
    case "ready_to_send":
      return "bg-blue-50 text-blue-800 border-blue-200";
    case "sent":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "received":
      return "bg-green-50 text-green-800 border-green-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

const getSplitBillItemParticipantIds = (item) => {
  if (Array.isArray(item?.assignments)) {
    return item.assignments
      .map((assignment) => assignment.participant_id || assignment.id)
      .filter(Boolean);
  }
  if (Array.isArray(item?.participant_ids)) return item.participant_ids;
  if (Array.isArray(item?.assigned_participant_ids)) {
    return item.assigned_participant_ids;
  }
  if (Array.isArray(item?.assigned_participants)) {
    return item.assigned_participants
      .map((participant) => participant.participant_id || participant.id)
      .filter(Boolean);
  }
  if (Array.isArray(item?.splits)) {
    return item.splits
      .map((split) => split.participant_id || split.id)
      .filter(Boolean);
  }
  if (Array.isArray(item?.participants)) {
    return item.participants
      .map((p) => p.participant_id || p.id)
      .filter(Boolean);
  }
  return [];
};

const getSplitBillItemAssignments = (item) => {
  if (!Array.isArray(item?.assignments)) return [];
  return item.assignments
    .map((assignment) => ({
      participant_id: assignment.participant_id || assignment.id,
      display_name: assignment.display_name || null,
      amount: assignment.amount ?? null,
    }))
    .filter((assignment) => assignment.participant_id);
};

const getSplitParticipantId = (entry) =>
  entry?.participant_id || entry?.id || null;

const normalizeId = (value) => String(value ?? "").trim();

const getSplitParticipantName = (entry) =>
  entry?.display_name || entry?.name || entry?.participant_name || null;

const getSplitPreTaxSubtotal = (entry) =>
  entry?.pre_tax_subtotal ??
  entry?.subtotal ??
  entry?.sub_total ??
  entry?.base_amount ??
  0;

const getSplitAllocatedTax = (entry) =>
  entry?.allocated_tax ??
  entry?.tax_share ??
  entry?.tax_amount ??
  entry?.tax ??
  0;

const getSplitFinalTotal = (entry) =>
  entry?.final_total ?? entry?.total ?? entry?.amount ?? 0;

const canonicalizeParticipantIds = (ids = [], options = []) => {
  const normalizedIds = ids.map((id) => normalizeId(id)).filter(Boolean);
  const resolved = normalizedIds.map((id) => {
    const matched = options.find((option) =>
      option.aliases.map((alias) => normalizeId(alias)).includes(id),
    );
    return matched?.id || id;
  });
  return Array.from(new Set(resolved.map((id) => normalizeId(id)).filter(Boolean)));
};

const readFileAsBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result?.toString() || "";
      resolve(result.split(",")[1] || "");
    };
    reader.onerror = reject;
  });

const PAYMENT_RECORD_STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "claimed", label: "Claimed" },
  { value: "confirmed", label: "Confirmed" },
];

export const PaymentPage = () => {
  const { shareToken } = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const sessionId = useAuthStore((state) => state.sessionId);
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [paymentType, setPaymentType] = useState("total");
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [perPersonAmount, setPerPersonAmount] = useState("");
  const [splitBillTaxAmount, setSplitBillTaxAmount] = useState(0);
  const [splitBillItems, setSplitBillItems] = useState([
    { name: "", price: "", participant_ids: [] },
  ]);
  const [paymentInfo, setPaymentInfo] = useState("");
  const [paymentImageUrl, setPaymentImageUrl] = useState("");
  const [isEditPaymentInfoOpen, setIsEditPaymentInfoOpen] = useState(false);
  const [editedPaymentMethodId, setEditedPaymentMethodId] = useState("");
  const [editedPaymentInfo, setEditedPaymentInfo] = useState("");
  const [editedPaymentImageUrl, setEditedPaymentImageUrl] = useState("");
  const [isEditPaymentConfigOpen, setIsEditPaymentConfigOpen] = useState(false);
  const [editedPaymentType, setEditedPaymentType] = useState("total");
  const [editedTotalCost, setEditedTotalCost] = useState("");
  const [editedPerPersonAmount, setEditedPerPersonAmount] = useState("");
  const [editedSplitBillTaxAmount, setEditedSplitBillTaxAmount] = useState(0);
  const [editedSplitBillItems, setEditedSplitBillItems] = useState([
    { name: "", price: "", participant_ids: [] },
  ]);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingPaymentImage, setIsUploadingPaymentImage] = useState(false);
  const [isUploadingEditedPaymentImage, setIsUploadingEditedPaymentImage] =
    useState(false);

  // Adjustment modal state
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustPerson, setAdjustPerson] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [adjustProofUrl, setAdjustProofUrl] = useState("");
  const [isAdjustUploading, setIsAdjustUploading] = useState(false);
  const [chargeAllOpen, setChargeAllOpen] = useState(false);
  const [chargeAllAmount, setChargeAllAmount] = useState("");
  const [chargeAllNote, setChargeAllNote] = useState("");
  const [destinationPaymentMethodId, setDestinationPaymentMethodId] =
    useState("");
  const [destinationPaymentInfo, setDestinationPaymentInfo] = useState("");
  const [destinationPaymentImageUrl, setDestinationPaymentImageUrl] =
    useState("");
  const [destinationNote, setDestinationNote] = useState("");
  const [isUploadingDestinationImage, setIsUploadingDestinationImage] =
    useState(false);
  const [isRefundSendModalOpen, setIsRefundSendModalOpen] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [isUploadingRefundProof, setIsUploadingRefundProof] = useState(false);
  const [refundProofImageUrl, setRefundProofImageUrl] = useState("");
  const [refundSendNote, setRefundSendNote] = useState("");

  const { data: event } = useEvent(shareToken);
  const isCreator = !!event && !!user && event.created_by === user.id;
  const { data: participants = [] } = useParticipants(shareToken);
  const rawPaymentRecordStatus = searchParams.get("status") || "";
  const paymentRecordStatus = PAYMENT_RECORD_STATUS_FILTERS.some(
    (filter) => filter.value === rawPaymentRecordStatus,
  )
    ? rawPaymentRecordStatus
    : "";
  const { data: paymentData, isLoading } = usePayment(event?.id, !!sessionId);
  const {
    data: filteredPaymentData,
    isFetching: isFilteringPaymentRecords,
  } = usePayment(event?.id, !!sessionId && !!paymentRecordStatus, {
    status: paymentRecordStatus,
  });
  const { data: paymentMethods = [] } = useMyPaymentMethods(!!sessionId);
  const { data: eventRefunds = [] } = useEventRefunds(
    event?.id,
    !!sessionId && !!event?.id && isCreator,
  );
  const { data: myRefunds = [] } = useMyRefunds(!!sessionId);

  const createPayment = useCreatePayment();
  const updatePayment = useUpdatePayment();
  const updatePaymentConfig = useUpdatePaymentConfig();
  const chargeAllPayments = useChargeAllPayments();
  const updateEventStatus = useUpdateEventStatus();
  const claimPayment = useClaimPayment();
  const confirmPayment = useConfirmPayment();
  const adjustPayment = useAdjustPayment();
  const updateRefundDestination = useUpdateRefundDestination();
  const markRefundSent = useMarkRefundSent();
  const confirmRefundReceipt = useConfirmRefundReceipt();

  const loginTarget = `${location.pathname}${location.search}${location.hash}`;
  const payment = paymentData?.payment;
  const records = paymentData?.records || [];
  const summary = paymentData?.summary;
  const perPersonStatus = summary?.per_person_status || [];
  const displayedRecords = paymentRecordStatus
    ? filteredPaymentData?.records || []
    : records;
  const displayedPerPersonStatus = paymentRecordStatus
    ? filteredPaymentData?.summary?.per_person_status || []
    : perPersonStatus;
  const perPersonStatusMap = new Map(
    perPersonStatus.map((person) => [person.participant_id, person]),
  );
  const displayedPerPersonStatusMap = new Map(
    displayedPerPersonStatus.map((person) => [person.participant_id, person]),
  );
  const unsettledPeople = perPersonStatus.filter(
    (person) => person.action !== "no_action",
  );
  const splitBillData = paymentData?.split_bill;
  const participantOptions = payment
    ? records
        .map((record) => {
          const participant = record.participant || {};
          const participantId = normalizeId(
            participant.id || record.participant_id,
          );
          const aliases = Array.from(
            new Set(
              [
                participantId,
                normalizeId(record.participant_id),
              ].filter(Boolean),
            ),
          );

          return {
            id: participantId || aliases[0] || "",
            aliases,
            label: getParticipantDisplayName(participant),
          };
        })
        .filter((option) => option.id)
    : participants
        .map((participant) => {
          const participantId = normalizeId(participant.id);
          const aliases = Array.from(new Set([participantId].filter(Boolean)));

          return {
            id: participantId || aliases[0] || "",
            aliases,
            label: getParticipantDisplayName(participant),
          };
        })
        .filter((option) => option.id);
  const splitParticipantLabelMap = new Map();
  const selectedPaymentMethod = paymentMethods.find(
    (method) => method.id === selectedPaymentMethodId,
  );
  const editedPaymentMethod = paymentMethods.find(
    (method) => method.id === editedPaymentMethodId,
  );
  participantOptions.forEach((option) => {
    option.aliases
      .filter(Boolean)
      .forEach((alias) =>
        splitParticipantLabelMap.set(normalizeId(alias), option.label),
      );
    splitParticipantLabelMap.set(normalizeId(option.id), option.label);
  });
  (splitBillData?.participants || []).forEach((entry) => {
    const entryId = getSplitParticipantId(entry);
    const entryName = getSplitParticipantName(entry);
    const normalizedEntryId = normalizeId(entryId);
    if (
      normalizedEntryId &&
      entryName &&
      !splitParticipantLabelMap.has(normalizedEntryId)
    ) {
      splitParticipantLabelMap.set(normalizedEntryId, entryName);
    }
  });

  const confirmedCount =
    summary?.num_confirmed ??
    records.filter((r) => r.status === "confirmed").length;
  const claimedCount =
    summary?.num_claimed ??
    records.filter((r) => r.status === "claimed").length;
  const pendingCount =
    summary?.num_pending ??
    records.filter((r) => r.status === "pending").length;
  const paymentRecordFilterOptions = PAYMENT_RECORD_STATUS_FILTERS.map(
    (filter) => ({
      ...filter,
      count:
        filter.value === "pending"
          ? pendingCount
          : filter.value === "claimed"
            ? claimedCount
            : filter.value === "confirmed"
              ? confirmedCount
              : summary?.num_participants ?? records.length,
    }),
  );

  const userRecord = records.find((r) => r.participant?.user_id === user?.id);
  const userSettlement = userRecord
    ? perPersonStatusMap.get(userRecord.participant_id)
    : null;
  const myRefund = myRefunds.find((refund) => refund.event_id === event?.id);
  const eventRefundList = [...eventRefunds].sort((a, b) =>
    String(b.updated_at || b.created_at || "").localeCompare(
      String(a.updated_at || a.created_at || ""),
    ),
  );
  const canUserSubmitPayment =
    !isCreator &&
    event?.status === "payment_open" &&
    userRecord &&
    (userSettlement?.action === "pay_full" ||
      userSettlement?.action === "pay_more");

  const handlePaymentRecordStatusChange = (nextStatus) => {
    const next = new URLSearchParams(searchParams);

    if (nextStatus) {
      next.set("status", nextStatus);
    } else {
      next.delete("status");
    }

    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    if (!myRefund) return;
    setDestinationPaymentMethodId(myRefund.recipient_payment_method_id || "");
    setDestinationPaymentInfo(myRefund.recipient_payment_info || "");
    setDestinationPaymentImageUrl(myRefund.recipient_payment_image_url || "");
    setDestinationNote(myRefund.recipient_note || "");
  }, [myRefund]);

  const isValidSplitBillItems = (items) =>
    items.length > 0 &&
    items.every(
      (item) =>
        item.name?.trim() &&
        Number(item.price) > 0 &&
        Array.isArray(item.participant_ids) &&
        item.participant_ids.length > 0,
    );

  const updateSplitBillItem = (index, patch) => {
    setSplitBillItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)),
    );
  };

  const updateEditedSplitBillItem = (index, patch) => {
    setEditedSplitBillItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)),
    );
  };

  const addSplitBillItem = () => {
    setSplitBillItems((prev) => [
      ...prev,
      { name: "", price: "", participant_ids: [] },
    ]);
  };

  const addEditedSplitBillItem = () => {
    setEditedSplitBillItems((prev) => [
      ...prev,
      { name: "", price: "", participant_ids: [] },
    ]);
  };

  const removeSplitBillItem = (index) => {
    setSplitBillItems((prev) =>
      prev.filter((_, idx) => idx !== index).length
        ? prev.filter((_, idx) => idx !== index)
        : [{ name: "", price: "", participant_ids: [] }],
    );
  };

  const removeEditedSplitBillItem = (index) => {
    setEditedSplitBillItems((prev) =>
      prev.filter((_, idx) => idx !== index).length
        ? prev.filter((_, idx) => idx !== index)
        : [{ name: "", price: "", participant_ids: [] }],
    );
  };

  const handleCreatePayment = async () => {
    try {
      await createPayment.mutateAsync({
        eventId: event.id,
        data: {
          type: paymentType,
          ...(paymentType === "per_person"
            ? { per_person_amount: parseInt(perPersonAmount, 10) || 0 }
            : paymentType === "split_bill"
              ? {
                  tax_amount: parseInt(splitBillTaxAmount, 10) || 0,
                  split_bill_items: splitBillItems.map((item) => ({
                    name: item.name.trim(),
                    price: parseInt(item.price, 10) || 0,
                    participant_ids: item.participant_ids,
                  })),
                }
              : { total_cost: parseInt(totalCost, 10) || 0 }),
          payment_method_id: selectedPaymentMethodId || undefined,
          payment_info: paymentInfo.trim() || undefined,
          payment_image_url: paymentImageUrl || undefined,
        },
      });

      await updateEventStatus.mutateAsync({
        eventId: event.id,
        status: "payment_open",
        shareToken,
      });

      setIsCreateModalOpen(false);
      setPaymentType("total");
      setSelectedPaymentMethodId("");
      setTotalCost("");
      setPerPersonAmount("");
      setSplitBillTaxAmount(0);
      setSplitBillItems([{ name: "", price: "", participant_ids: [] }]);
      setPaymentInfo("");
      setPaymentImageUrl("");
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  const handleUpdatePaymentInfo = async () => {
    if (!editedPaymentInfo.trim()) return;

    try {
      await updatePayment.mutateAsync({
        eventId: event.id,
        data: {
          payment_method_id: editedPaymentMethodId || undefined,
          payment_info: editedPaymentInfo.trim() || undefined,
          payment_image_url: editedPaymentImageUrl || undefined,
        },
      });
      setIsEditPaymentInfoOpen(false);
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  const handleUploadProof = async (base64Image) => {
    // If no image provided, submit claim without proof
    if (!base64Image) {
      await claimPayment.mutateAsync({
        eventId: event.id,
        proofImageUrl: null,
      });
      return;
    }

    setIsUploading(true);
    try {
      const { url } = await uploadImage(base64Image);
      await claimPayment.mutateAsync({ eventId: event.id, proofImageUrl: url });
    } catch (error) {
      showError(getErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmPayment = async (participantId) => {
    try {
      await confirmPayment.mutateAsync({ eventId: event.id, participantId });
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  const handleCopyPaymentInfo = () => {
    if (payment?.payment_info) {
      navigator.clipboard.writeText(payment.payment_info);
      showSuccess("Payment info copied to clipboard");
    }
  };

  const openEditPaymentInfoModal = () => {
    setEditedPaymentMethodId(payment?.payment_method_id || "");
    setEditedPaymentInfo(payment?.payment_info || "");
    setEditedPaymentImageUrl(payment?.payment_image_url || "");
    setIsEditPaymentInfoOpen(true);
  };

  const openEditPaymentConfigModal = () => {
    setEditedPaymentType(payment?.type || "total");
    setEditedTotalCost(
      payment?.type === "total"
        ? payment?.total_cost || ""
        : payment?.total_cost || "",
    );
    setEditedPerPersonAmount(
      payment?.type === "per_person"
        ? payment?.base_split || ""
        : payment?.base_split || "",
    );
    setEditedSplitBillTaxAmount(payment?.tax_amount || 0);
    setEditedSplitBillItems(
      splitBillData?.items?.length
        ? splitBillData.items.map((item) => ({
            name: item.name || "",
            price: item.price || "",
            participant_ids: canonicalizeParticipantIds(
              getSplitBillItemParticipantIds(item),
              participantOptions,
            ),
          }))
        : [{ name: "", price: "", participant_ids: [] }],
    );
    setIsEditPaymentConfigOpen(true);
  };

  const handleUpdatePaymentConfig = async () => {
    try {
      await updatePaymentConfig.mutateAsync({
        eventId: event.id,
        data: {
          type: editedPaymentType,
          ...(editedPaymentType === "per_person"
            ? { per_person_amount: parseInt(editedPerPersonAmount, 10) || 0 }
            : editedPaymentType === "split_bill"
              ? {
                  tax_amount: parseInt(editedSplitBillTaxAmount, 10) || 0,
                  split_bill_items: editedSplitBillItems.map((item) => ({
                    name: item.name.trim(),
                    price: parseInt(item.price, 10) || 0,
                    participant_ids: item.participant_ids,
                  })),
                }
              : { total_cost: parseInt(editedTotalCost, 10) || 0 }),
        },
      });
      setIsEditPaymentConfigOpen(false);
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  const openAdjustModal = (person) => {
    setAdjustPerson(person);
    setAdjustAmount(
      person.amount?.toString() || person.action_amount?.toString() || "",
    );
    setAdjustNote(person.note || "");
    setAdjustProofUrl("");
    setAdjustModalOpen(true);
  };

  const handleAdjustProofUpload = async (base64Image) => {
    // If no image provided, just skip upload (for optional proof in adjustment)
    if (!base64Image) {
      return;
    }

    setIsAdjustUploading(true);
    try {
      const { url } = await uploadImage(base64Image);
      setAdjustProofUrl(url);
      showSuccess("Proof uploaded");
    } catch (error) {
      showError(getErrorMessage(error));
    } finally {
      setIsAdjustUploading(false);
    }
  };

  const handleSubmitAdjustment = async () => {
    if (!adjustPerson || !adjustAmount) return;

    try {
      const amount = parseInt(adjustAmount, 10);
      await adjustPayment.mutateAsync({
        eventId: event.id,
        participantId: adjustPerson.participant_id,
        data: {
          amount,
          note: adjustNote || undefined,
          proof_image_url: adjustProofUrl || undefined,
        },
      });

      setAdjustModalOpen(false);
      setAdjustPerson(null);
      setAdjustAmount("");
      setAdjustNote("");
      setAdjustProofUrl("");
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  const handleChargeAll = async () => {
    if (!chargeAllAmount || !chargeAllNote.trim()) return;

    try {
      await chargeAllPayments.mutateAsync({
        eventId: event.id,
        data: {
          amount: parseInt(chargeAllAmount, 10),
          note: chargeAllNote.trim(),
        },
      });
      setChargeAllAmount("");
      setChargeAllNote("");
      setChargeAllOpen(false);
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  const handlePaymentImageUpload = async (file, isEdit = false) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showError("Please choose an image file");
      return;
    }

    if (isEdit) {
      setIsUploadingEditedPaymentImage(true);
    } else {
      setIsUploadingPaymentImage(true);
    }

    try {
      const base64 = await readFileAsBase64(file);
      const { url } = await uploadImage(base64);
      if (isEdit) {
        setEditedPaymentImageUrl(url);
      } else {
        setPaymentImageUrl(url);
      }
    } catch (error) {
      showError(getErrorMessage(error));
    } finally {
      if (isEdit) {
        setIsUploadingEditedPaymentImage(false);
      } else {
        setIsUploadingPaymentImage(false);
      }
    }
  };

  const handleRefundDestinationImageUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showError("Please choose an image file");
      return;
    }

    setIsUploadingDestinationImage(true);
    try {
      const base64 = await readFileAsBase64(file);
      const { url } = await uploadImage(base64);
      setDestinationPaymentImageUrl(url);
    } catch (error) {
      showError(getErrorMessage(error));
    } finally {
      setIsUploadingDestinationImage(false);
    }
  };

  const handleRefundProofImageUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showError("Please choose an image file");
      return;
    }

    setIsUploadingRefundProof(true);
    try {
      const base64 = await readFileAsBase64(file);
      const { url } = await uploadImage(base64);
      setRefundProofImageUrl(url);
    } catch (error) {
      showError(getErrorMessage(error));
    } finally {
      setIsUploadingRefundProof(false);
    }
  };

  const handleSubmitRefundDestination = async () => {
    if (!myRefund) return;
    if (!destinationPaymentMethodId && !destinationPaymentInfo.trim()) {
      showError("Choose a saved payment method or fill payment info");
      return;
    }

    try {
      await updateRefundDestination.mutateAsync({
        refundId: myRefund.id,
        data: {
          payment_method_id: destinationPaymentMethodId || undefined,
          payment_info: destinationPaymentInfo.trim() || undefined,
          payment_image_url: destinationPaymentImageUrl || undefined,
          note: destinationNote.trim() || undefined,
        },
      });
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  const handleMarkRefundSent = async (refundId) => {
    try {
      await markRefundSent.mutateAsync({
        refundId,
        data: {
          proof_image_url: refundProofImageUrl || undefined,
          note: refundSendNote.trim() || undefined,
        },
      });
      setRefundProofImageUrl("");
      setRefundSendNote("");
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  const openRefundSendModal = (refund) => {
    setSelectedRefund(refund);
    setRefundProofImageUrl("");
    setRefundSendNote("");
    setIsRefundSendModalOpen(true);
  };

  const handleConfirmRefund = async () => {
    if (!myRefund) return;
    try {
      await confirmRefundReceipt.mutateAsync({ refundId: myRefund.id });
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="bg-white/85 backdrop-blur border-b border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <Link
            to={`/events/${shareToken}`}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Event
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Payment</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {!sessionId ? (
          <div className="surface-card p-6 text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Login Required
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              This payment page is public to open, but you need to log in to
              view payment details or submit payment.
            </p>
            <Link
              to={`/login?returnTo=${encodeURIComponent(loginTarget)}`}
              className="inline-flex"
            >
              <Button>Continue to Login</Button>
            </Link>
          </div>
        ) : !payment ? (
          isCreator ? (
            <div className="surface-card p-6 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Payment Not Opened
              </h2>
              {event.status === "open" ? (
                <>
                  <p className="text-sm text-gray-500 mb-4">
                    Open payment to start collecting from participants.
                  </p>
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    Open Payment
                  </Button>
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  Payment can only be opened when event status is "Open for
                  RSVP".
                </p>
              )}
            </div>
          ) : (
            <div className="surface-card p-6 text-center">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Payment Not Opened Yet
              </h2>
              <p className="text-sm text-gray-500">
                The event organizer has not opened payment collection yet.
              </p>
            </div>
          )
        ) : (
          <>
            {/* Financial Summary */}
            {summary && (
              <div className="surface-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Payment Summary
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Base split reference: {formatRupiah(payment.base_split)}
                      /orang
                    </p>
                  </div>
                  {isCreator &&
                    event.status === "payment_open" &&
                    payment?.type !== "split_bill" && (
                    <Button
                      variant="secondary"
                      onClick={() => setChargeAllOpen(true)}
                      className="shrink-0"
                    >
                      Add Charge to Everyone
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 mt-4 mb-4 text-center">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-green-700 mb-1">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-lg font-bold">
                        {confirmedCount}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">Confirmed</span>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-yellow-700 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-lg font-bold">{claimedCount}</span>
                    </div>
                    <span className="text-xs text-gray-500">Claimed</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-gray-700 mb-1">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-lg font-bold">{pendingCount}</span>
                    </div>
                    <span className="text-xs text-gray-500">Pending</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 mb-1">
                      <Wallet className="w-4 h-4" />
                      <span className="text-sm">Collected</span>
                    </div>
                    <span className="text-lg font-bold text-green-800">
                      {formatRupiah(summary.total_collected)}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">Target</span>
                    </div>
                    <span className="text-lg font-bold text-gray-800">
                      {formatRupiah(summary.total_should_collect)}
                    </span>
                  </div>
                </div>

                {summary.balance !== 0 && (
                  <div
                    className={`p-3 rounded-lg ${summary.balance > 0 ? "bg-green-100" : "bg-red-100"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {summary.balance > 0 ? (
                        <PlusCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <MinusCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span
                        className={`text-sm font-medium ${summary.balance > 0 ? "text-green-700" : "text-red-700"}`}
                      >
                        {summary.balance > 0 ? "Surplus" : "Shortage"}
                      </span>
                    </div>
                    <p
                      className={`text-sm ${summary.balance > 0 ? "text-green-800" : "text-red-800"}`}
                    >
                      {summary.balance > 0
                        ? `${formatRupiah(summary.balance)} more collected than needed`
                        : `${formatRupiah(Math.abs(summary.balance))} still needs to be collected`}
                    </p>
                  </div>
                )}
                {isCreator &&
                  event.status === "payment_open" &&
                  confirmedCount > 0 &&
                  confirmedCount === summary?.num_participants && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <Button
                        onClick={() =>
                          updateEventStatus.mutateAsync({
                            eventId: event.id,
                            status: "completed",
                            shareToken,
                          })
                        }
                        loading={updateEventStatus.isPending}
                        className="w-full"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Complete Event
                      </Button>
                      <p className="text-xs text-gray-500 text-center mt-2">
                        All payments confirmed. Mark event as completed.
                      </p>
                    </div>
                  )}
              </div>
            )}

            {isCreator && unsettledPeople.length > 0 && (
              <div className="surface-card p-4">
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Needs Follow-up
                </h2>
                <div className="space-y-2">
                  {unsettledPeople.map((person) => {
                    const style = getActionStyle(person.action);
                    const buttonText = getActionButtonText(person.action);
                    const showAdjustButton =
                      payment?.type !== "split_bill" &&
                      event.status === "payment_open" &&
                      person.status === "confirmed" &&
                      (person.action === "pay_more" ||
                        person.action === "receive_refund");

                    return (
                      <div
                        key={person.participant_id}
                        className={`flex items-center justify-between gap-3 p-3 rounded-lg ${style.bg}`}
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {person.display_name}
                          </p>
                          {person.paid_amount > 0 && (
                            <p className="text-xs text-gray-500">
                              Already paid {formatRupiah(person.paid_amount)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex items-center gap-1.5 text-sm font-medium ${style.color}`}
                          >
                            {style.icon}
                            <span>
                              {getActionText(
                                person.action,
                                person.action_amount,
                              )}
                            </span>
                          </div>
                          {showAdjustButton && (
                            <Button
                              variant="primary"
                              onClick={() => openAdjustModal(person)}
                              className="px-2 py-1 text-xs"
                            >
                              {buttonText}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {isCreator && eventRefundList.length > 0 && (
              <div className="surface-card p-4">
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Refunds
                </h2>
                <div className="space-y-3">
                  {eventRefundList.map((refund) => (
                    <div
                      key={refund.id}
                      className="rounded-xl border border-gray-200 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {refund.display_name}
                          </p>
                          <p className="mt-1 text-sm text-gray-600">
                            Refund amount {formatRupiah(refund.amount)}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Created {formatBackendTimestamp(refund.created_at)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getRefundStatusClasses(
                            refund.status,
                          )}`}
                        >
                          {getRefundStatusText(refund.status)}
                        </span>
                      </div>

                      {refund.recipient_payment_info && (
                        <div className="mt-3 rounded-lg bg-gray-50 p-3">
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Refund destination
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                            {refund.recipient_payment_info}
                          </p>
                          {refund.recipient_note && (
                            <p className="mt-2 text-xs text-gray-500">
                              Note: {refund.recipient_note}
                            </p>
                          )}
                        </div>
                      )}

                      {refund.recipient_payment_image_url && (
                        <img
                          src={refund.recipient_payment_image_url}
                          alt="Refund destination"
                          className="mt-3 max-h-64 w-full rounded-lg border border-gray-200 object-contain bg-white"
                        />
                      )}

                      {refund.status === "pending_info" && (
                        <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                          Waiting for the participant to submit their refund
                          destination.
                        </div>
                      )}

                      {refund.status === "ready_to_send" && (
                        <div className="mt-4">
                          <Button
                            onClick={() => openRefundSendModal(refund)}
                            className="w-full"
                          >
                            <Send className="w-4 h-4" />
                            Send Refund
                          </Button>
                        </div>
                      )}

                      {refund.status === "sent" && (
                        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                          <p className="font-medium">Refund sent</p>
                          {refund.sent_at && (
                            <p className="mt-1">
                              Sent {formatBackendTimestamp(refund.sent_at)}
                            </p>
                          )}
                          {refund.sent_note && (
                            <p className="mt-1">{refund.sent_note}</p>
                          )}
                        </div>
                      )}

                      {refund.status === "received" && (
                        <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                          <p className="font-medium">Refund received</p>
                          {refund.received_at && (
                            <p className="mt-1">
                              Confirmed {formatBackendTimestamp(refund.received_at)}
                            </p>
                          )}
                        </div>
                      )}

                      {refund.sent_proof_image_url &&
                        refund.status !== "ready_to_send" && (
                          <img
                            src={refund.sent_proof_image_url}
                            alt="Refund proof"
                            className="mt-3 max-h-64 w-full rounded-lg border border-gray-200 object-contain bg-white"
                          />
                        )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Details */}
            <div className="surface-card p-4">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                Payment Info
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mode</span>
                  <span className="font-semibold capitalize">
                    {payment.type?.replace("_", " ") || "total"}
                  </span>
                </div>
                {payment.type === "per_person" ? (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Per Person Setup</span>
                    <span className="font-semibold">
                      {formatRupiah(payment.base_split)}
                    </span>
                  </div>
                ) : payment.type === "split_bill" ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total (with tax)</span>
                      <span className="font-semibold">
                        {formatRupiah(
                          splitBillData?.grand_total ?? payment.total_cost,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total (before tax)</span>
                      <span className="font-semibold">
                        {formatRupiah(splitBillData?.items_subtotal || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax / Service</span>
                      <span className="font-semibold">
                        {formatRupiah(
                          splitBillData?.tax_amount ?? payment.tax_amount ?? 0,
                        )}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Cost</span>
                    <span className="font-semibold">
                      {formatRupiah(payment.total_cost)}
                    </span>
                  </div>
                )}
                {payment.type !== "split_bill" && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Per Person</span>
                    <span className="font-semibold">
                      {formatRupiah(payment.base_split)}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-600">Payment Info</span>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {isCreator &&
                        (event.status === "open" ||
                          event.status === "payment_open") && (
                          <Button
                            variant="secondary"
                            onClick={openEditPaymentConfigModal}
                            className="px-2 py-1 text-xs"
                            title="Edit payment configuration"
                          >
                            <Settings2 className="w-3.5 h-3.5" />
                            Edit Config
                          </Button>
                        )}
                      {isCreator && event.status === "payment_open" && (
                        <Button
                          variant="secondary"
                          onClick={openEditPaymentInfoModal}
                          className="px-2 py-1 text-xs"
                          title="Edit payment info"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit Payment Info
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        onClick={handleCopyPaymentInfo}
                        className="px-2 py-1 text-xs"
                        title="Copy payment info"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded mt-1">
                    {payment.payment_info}
                  </p>
                  {payment.payment_image_url && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-2">
                        Payment image snapshot
                      </p>
                      <img
                        src={payment.payment_image_url}
                        alt="Payment method snapshot"
                        className="max-h-64 w-full rounded-lg border border-gray-200 object-contain bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* User's Payment Action - only when payment_open */}
            {canUserSubmitPayment && (
              <div className="surface-card p-4">
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  {userSettlement?.action === "pay_more"
                    ? "Submit Additional Payment"
                    : "Submit Your Payment"}
                </h2>
                <div className="mb-3 p-3 rounded-lg bg-amber-50 text-amber-800">
                  <p className="text-sm font-medium">
                    {userSettlement?.action === "pay_more"
                      ? `You still need to pay ${formatRupiah(userSettlement.action_amount)} more.`
                      : `You need to pay ${formatRupiah(userSettlement?.action_amount || userRecord.amount)}.`}
                  </p>
                  {userRecord?.paid_amount > 0 &&
                    userSettlement?.action === "pay_more" && (
                      <p className="text-xs mt-1 text-amber-700">
                        You already paid {formatRupiah(userRecord.paid_amount)}{" "}
                        before the amount changed.
                      </p>
                    )}
                </div>
                <ProofUploader
                  onUpload={handleUploadProof}
                  isUploading={isUploading || claimPayment.isPending}
                  optional={true}
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  You can submit with or without proof image
                </p>
              </div>
            )}

            {!isCreator && myRefund && (
              <div className="surface-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Refund
                    </h2>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {formatRupiah(myRefund.amount)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getRefundStatusClasses(
                      myRefund.status,
                    )}`}
                  >
                    {getRefundStatusText(myRefund.status)}
                  </span>
                </div>

                <p className="mt-2 text-sm text-gray-600">
                  The organizer owes you a refund for this event.
                </p>

                {myRefund.status === "pending_info" && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Saved payment method
                      </label>
                      <select
                        value={destinationPaymentMethodId}
                        onChange={(e) => {
                          const methodId = e.target.value;
                          setDestinationPaymentMethodId(methodId);
                          const method = paymentMethods.find(
                            (item) => item.id === methodId,
                          );
                          if (method) {
                            setDestinationPaymentInfo(method.payment_info || "");
                            setDestinationPaymentImageUrl(
                              method.payment_image_url || "",
                            );
                          }
                        }}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                      >
                        <option value="">Use custom refund destination</option>
                        {paymentMethods.map((method) => (
                          <option key={method.id} value={method.id}>
                            {method.label || method.payment_info}
                          </option>
                        ))}
                      </select>
                    </div>

                    <Textarea
                      label="Refund destination"
                      rows={3}
                      value={destinationPaymentInfo}
                      onChange={(e) => setDestinationPaymentInfo(e.target.value)}
                      placeholder="BCA 1234567890 a/n Your Name"
                    />

                    <Input
                      label="Note"
                      value={destinationNote}
                      onChange={(e) => setDestinationNote(e.target.value)}
                      placeholder="Optional note for the organizer"
                    />

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Refund destination image
                      </label>
                      <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600 hover:border-green-400 hover:bg-green-50">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isUploadingDestinationImage}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            handleRefundDestinationImageUpload(file);
                            e.target.value = "";
                          }}
                        />
                        {isUploadingDestinationImage
                          ? "Uploading image..."
                          : "Upload destination image"}
                      </label>
                      {destinationPaymentImageUrl && (
                        <img
                          src={destinationPaymentImageUrl}
                          alt="Refund destination"
                          className="mt-3 max-h-56 w-full rounded-lg border border-gray-200 object-contain bg-white"
                        />
                      )}
                    </div>

                    <Button
                      onClick={handleSubmitRefundDestination}
                      loading={updateRefundDestination.isPending}
                      className="w-full"
                    >
                      Save Refund Destination
                    </Button>
                  </div>
                )}

                {myRefund.status === "ready_to_send" && (
                  <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                    <p className="font-medium">Waiting for organizer</p>
                    <p className="mt-1">
                      Your refund destination is saved. The organizer can send
                      the refund now.
                    </p>
                  </div>
                )}

                {myRefund.status === "sent" && (
                  <div className="mt-4 space-y-3">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                      <p className="font-medium">Refund has been sent</p>
                      {myRefund.sent_at && (
                        <p className="mt-1">
                          Sent {formatBackendTimestamp(myRefund.sent_at)}
                        </p>
                      )}
                      {myRefund.sent_note && (
                        <p className="mt-1">{myRefund.sent_note}</p>
                      )}
                    </div>
                    {myRefund.sent_proof_image_url && (
                      <img
                        src={myRefund.sent_proof_image_url}
                        alt="Refund proof"
                        className="max-h-72 w-full rounded-lg border border-gray-200 object-contain bg-white"
                      />
                    )}
                    <Button
                      onClick={handleConfirmRefund}
                      loading={confirmRefundReceipt.isPending}
                      className="w-full"
                    >
                      Confirm Refund Receipt
                    </Button>
                  </div>
                )}

                {myRefund.status === "received" && (
                  <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                    <p className="font-medium">Refund received</p>
                    {myRefund.received_at && (
                      <p className="mt-1">
                        Confirmed {formatBackendTimestamp(myRefund.received_at)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {!isCreator && userRecord && userRecord.status === "claimed" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">
                    Payment Pending Confirmation
                  </span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  {userSettlement?.action === "pay_more"
                    ? "Your additional payment has been submitted and is awaiting confirmation from the organizer."
                    : "Your payment proof has been submitted and is awaiting confirmation from the organizer."}
                </p>
              </div>
            )}

            {!isCreator &&
              userSettlement?.action === "pay_more" &&
              userRecord?.status !== "claimed" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-amber-800">
                    <MinusCircle className="w-5 h-5" />
                    <span className="font-medium">
                      Additional Payment Needed
                    </span>
                  </div>
                  <p className="text-sm text-amber-700 mt-1">
                    Your current amount increased. You still need to pay{" "}
                    {formatRupiah(userSettlement.action_amount)} more.
                  </p>
                </div>
              )}

            {!isCreator &&
              userSettlement?.action === "no_action" &&
              userRecord?.status === "confirmed" && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Payment Confirmed</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Your payment has been confirmed. Thank you!
                  </p>
                </div>
              )}

            {/* Payment Records */}
            <div className="surface-card p-4">
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Payment Records
                </h2>
                <div className="flex flex-wrap gap-2">
                  {paymentRecordFilterOptions.map((filter) => {
                    const isActive = paymentRecordStatus === filter.value;
                    return (
                      <button
                        key={filter.value || "all"}
                        type="button"
                        onClick={() =>
                          handlePaymentRecordStatusChange(filter.value)
                        }
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          isActive
                            ? "border-green-600 bg-green-50 text-green-700"
                            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {filter.label}
                        <span className="ml-1 text-gray-400">
                          {filter.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {payment.type === "split_bill" && splitBillData && (
                <div className="mb-3 rounded-lg border border-gray-200 p-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Split Bill Breakdown
                  </p>
                  <div className="mb-2 flex items-center justify-between rounded-lg bg-gray-50 px-2.5 py-2">
                    <span className="text-xs text-gray-600">Total Tax</span>
                    <span className="text-xs font-semibold text-gray-800">
                      {formatRupiah(payment.tax_amount || 0)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {(splitBillData.items || []).map((item, index) => (
                      <div
                        key={`${item.name}-${index}`}
                        className="rounded-lg bg-gray-50 p-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-gray-900 break-all">
                            {item.name}
                          </p>
                          <span className="text-xs font-semibold text-gray-700 shrink-0">
                            {formatRupiah(item.price || 0)}
                          </span>
                        </div>
                        {getSplitBillItemAssignments(item).length > 0 ? (
                          <div className="mt-1 space-y-1">
                            {getSplitBillItemAssignments(item).map(
                              (assignment) => (
                                <p
                                  key={`${assignment.participant_id}-${item.id || index}`}
                                  className="text-xs text-gray-500 break-all"
                                >
                                  Assigned:{" "}
                                  {assignment.display_name ||
                                    splitParticipantLabelMap.get(
                                      normalizeId(assignment.participant_id),
                                    ) ||
                                    `Participant ${assignment.participant_id}`}
                                  {assignment.amount !== null
                                    ? ` (${formatRupiah(assignment.amount)})`
                                    : ""}
                                </p>
                              ),
                            )}
                          </div>
                        ) : getSplitBillItemParticipantIds(item).length > 0 ? (
                          <p className="mt-1 text-xs text-gray-500 break-all">
                            Assigned:{" "}
                            {getSplitBillItemParticipantIds(item)
                              .map(
                                (id) =>
                                  splitParticipantLabelMap.get(normalizeId(id)) ||
                                  `Participant ${id}`,
                              )
                              .join(", ")}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  {(splitBillData.participants || []).length > 0 && (
                    <div className="mt-3 overflow-x-auto">
                      <table className="min-w-full text-xs">
                        <thead>
                          <tr className="text-left text-gray-500">
                            <th className="py-1 pr-2">Participant</th>
                            <th className="py-1 pr-2 text-right">Subtotal</th>
                            <th className="py-1 pr-2 text-right">Tax</th>
                            <th className="py-1 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {splitBillData.participants.map((entry, idx) => {
                            const entryId = getSplitParticipantId(entry);
                            const label =
                              getSplitParticipantName(entry) ||
                              splitParticipantLabelMap.get(String(entryId)) ||
                              `Participant ${entryId || idx + 1}`;
                            return (
                              <tr
                                key={`${entryId || "row"}-${idx}`}
                                className="border-t border-gray-100"
                              >
                                <td className="py-1.5 pr-2 text-gray-800">
                                  {label}
                                </td>
                                <td className="py-1.5 pr-2 text-right text-gray-700">
                                  {formatRupiah(getSplitPreTaxSubtotal(entry))}
                                </td>
                                <td className="py-1.5 pr-2 text-right text-gray-700">
                                  {formatRupiah(getSplitAllocatedTax(entry))}
                                </td>
                                <td className="py-1.5 text-right font-medium text-gray-900">
                                  {formatRupiah(getSplitFinalTotal(entry))}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              {paymentRecordStatus &&
              isFilteringPaymentRecords &&
              !filteredPaymentData ? (
                <div className="flex justify-center py-6">
                  <Spinner />
                </div>
              ) : displayedRecords.length === 0 ? (
                <p className="rounded-lg bg-gray-50 px-3 py-4 text-center text-sm text-gray-500">
                  No payment records found.
                </p>
              ) : (
                <div className="space-y-2">
                  {displayedRecords.map((record) => (
                    <PaymentRecordRow
                      key={record.id}
                      record={record}
                      settlement={displayedPerPersonStatusMap.get(
                        record.participant_id,
                      )}
                      isCreator={isCreator}
                      allowEdit={payment?.type !== "split_bill"}
                      onConfirm={handleConfirmPayment}
                      onEdit={(currentRecord) =>
                        openAdjustModal({
                          participant_id: currentRecord.participant_id,
                          display_name: currentRecord.participant?.is_guest
                            ? currentRecord.participant?.guest_name
                            : currentRecord.participant?.user?.name,
                          amount: currentRecord.amount,
                          paid_amount: currentRecord.paid_amount,
                          base_split: payment.base_split,
                          note: currentRecord.note,
                          action: displayedPerPersonStatusMap.get(
                            currentRecord.participant_id,
                          )?.action,
                          action_amount: displayedPerPersonStatusMap.get(
                            currentRecord.participant_id,
                          )?.action_amount,
                        })
                      }
                      eventId={event.id}
                      eventName={event.title}
                      shareToken={shareToken}
                      eventStatus={event.status}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Create Payment Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Open Payment Collection"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Mode
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setPaymentType("total")}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                  paymentType === "total"
                    ? "border-green-600 bg-green-50 text-green-700"
                    : "border-gray-300 text-gray-600"
                }`}
              >
                Total Event Cost
              </button>
              <button
                type="button"
                onClick={() => setPaymentType("per_person")}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                  paymentType === "per_person"
                    ? "border-green-600 bg-green-50 text-green-700"
                    : "border-gray-300 text-gray-600"
                }`}
              >
                Fixed Per Person
              </button>
              <button
                type="button"
                onClick={() => setPaymentType("split_bill")}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                  paymentType === "split_bill"
                    ? "border-green-600 bg-green-50 text-green-700"
                    : "border-gray-300 text-gray-600"
                }`}
              >
                Split Bill
              </button>
            </div>
          </div>
          {paymentType === "per_person" ? (
            <CurrencyInput
              label="Per Person Amount"
              placeholder="50000"
              required
              value={perPersonAmount}
              onChange={(e) => setPerPersonAmount(e.target.value)}
            />
          ) : paymentType === "split_bill" ? (
            <div className="space-y-3">
              <CurrencyInput
                label="Tax / Service Amount"
                placeholder="0"
                value={splitBillTaxAmount}
                onChange={(e) => setSplitBillTaxAmount(e.target.value ?? 0)}
              />
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Bill Items
                </p>
                {splitBillItems.map((item, index) => (
                  <div
                    key={`split-item-${index}`}
                    className="rounded-lg border border-gray-200 p-3 space-y-2"
                  >
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) =>
                        updateSplitBillItem(index, { name: e.target.value })
                      }
                      placeholder="Item name (e.g. Court rent)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <CurrencyInput
                      label="Item Price"
                      value={item.price}
                      onChange={(e) =>
                        updateSplitBillItem(index, { price: e.target.value })
                      }
                    />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Assign participants
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {participantOptions.map((participant) => {
                          const normalizedAssignedIds = item.participant_ids
                            .map((id) => normalizeId(id))
                            .filter(Boolean);
                          const checked = normalizedAssignedIds.some((id) =>
                            participant.aliases.map((alias) => normalizeId(alias)).includes(id),
                          );
                          return (
                            <label
                              key={`${index}-${participant.id}`}
                              className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-2 py-1 text-xs text-gray-700"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const next = e.target.checked
                                    ? [
                                        ...normalizedAssignedIds.filter(
                                          (id) =>
                                            !participant.aliases
                                              .map((alias) => normalizeId(alias))
                                              .includes(id),
                                        ),
                                        normalizeId(participant.id),
                                      ]
                                    : item.participant_ids.filter(
                                      (id) =>
                                          !participant.aliases
                                            .map((alias) => normalizeId(alias))
                                            .includes(normalizeId(id)),
                                      );
                                  updateSplitBillItem(index, {
                                    participant_ids: next,
                                  });
                                }}
                              />
                              {participant.label}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSplitBillItem(index)}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Remove item
                    </button>
                  </div>
                ))}
                <Button type="button" variant="secondary" onClick={addSplitBillItem}>
                  Add Item
                </Button>
              </div>
            </div>
          ) : (
            <CurrencyInput
              label="Total Cost"
              placeholder="3000000"
              required
              value={totalCost}
              onChange={(e) => setTotalCost(e.target.value)}
            />
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Saved Payment Method
            </label>
            <select
              value={selectedPaymentMethodId}
              onChange={(e) => {
                const nextId = e.target.value;
                setSelectedPaymentMethodId(nextId);
                const method = paymentMethods.find((item) => item.id === nextId);
                if (method) {
                  setPaymentInfo(method.payment_info || "");
                  setPaymentImageUrl(method.image_url || "");
                }
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="">Choose saved payment method (optional)</option>
              {paymentMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Information
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={3}
              placeholder="BCA 1234567890 a/n John Doe"
              value={paymentInfo}
              onChange={(e) => setPaymentInfo(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Payment Image (optional)
            </label>
            <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300 px-4 py-4 text-sm text-gray-600 hover:border-green-400 hover:bg-green-50">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  handlePaymentImageUpload(file, false);
                  e.target.value = "";
                }}
              />
              {isUploadingPaymentImage ? "Uploading image..." : "Upload payment image"}
            </label>
            {paymentImageUrl && (
              <img
                src={paymentImageUrl}
                alt="Payment preview"
                className="max-h-52 w-full rounded-lg border border-gray-200 object-contain bg-white"
              />
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePayment}
              loading={createPayment.isPending || updateEventStatus.isPending}
              disabled={
                (!selectedPaymentMethodId && !paymentInfo.trim()) ||
                (paymentType === "per_person"
                  ? !perPersonAmount
                  : paymentType === "split_bill"
                    ? !isValidSplitBillItems(splitBillItems)
                    : !totalCost)
              }
              className="flex-1"
            >
              Open Payment
            </Button>
          </div>
        </div>
      </Modal>

      {/* Adjustment Modal */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title={
          adjustPerson
            ? `Adjust Payment - ${adjustPerson.display_name}`
            : "Adjust Payment"
        }
      >
        {adjustPerson && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                Current paid:{" "}
                <strong>{formatRupiah(adjustPerson.paid_amount)}</strong>
              </p>
              <p className="text-sm text-gray-600">
                Base split:{" "}
                <strong>{formatRupiah(adjustPerson.base_split)}</strong>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Set the current amount and optional note for this participant.
              </p>
            </div>

            <CurrencyInput
              label="Current Amount"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              placeholder="Amount"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note (optional)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={2}
                placeholder="Reason or context..."
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proof Image (optional)
              </label>
              {adjustProofUrl ? (
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700">Proof uploaded</span>
                  <button
                    onClick={() => setAdjustProofUrl("")}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <ProofUploader
                  onUpload={handleAdjustProofUpload}
                  isUploading={isAdjustUploading}
                  optional={true}
                  showSkipButton={false}
                />
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setAdjustModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitAdjustment}
                loading={adjustPayment.isPending}
                disabled={!adjustAmount || parseInt(adjustAmount) <= 0}
                className="flex-1"
              >
                Save Amount
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isEditPaymentInfoOpen}
        onClose={() => setIsEditPaymentInfoOpen(false)}
        title="Edit Payment Info"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Saved Payment Method
            </label>
            <select
              value={editedPaymentMethodId}
              onChange={(e) => {
                const nextId = e.target.value;
                setEditedPaymentMethodId(nextId);
                const method = paymentMethods.find((item) => item.id === nextId);
                if (method) {
                  setEditedPaymentInfo(method.payment_info || "");
                  setEditedPaymentImageUrl(method.image_url || "");
                }
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="">Choose saved payment method (optional)</option>
              {paymentMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Information
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={4}
              placeholder="BCA 1234567890 a/n John Doe"
              value={editedPaymentInfo}
              onChange={(e) => setEditedPaymentInfo(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Payment Image (optional)
            </label>
            <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300 px-4 py-4 text-sm text-gray-600 hover:border-green-400 hover:bg-green-50">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  handlePaymentImageUpload(file, true);
                  e.target.value = "";
                }}
              />
              {isUploadingEditedPaymentImage
                ? "Uploading image..."
                : "Upload payment image"}
            </label>
            {editedPaymentImageUrl && (
              <img
                src={editedPaymentImageUrl}
                alt="Edited payment preview"
                className="max-h-52 w-full rounded-lg border border-gray-200 object-contain bg-white"
              />
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsEditPaymentInfoOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePaymentInfo}
              loading={updatePayment.isPending}
              disabled={!editedPaymentMethodId && !editedPaymentInfo.trim()}
              className="flex-1"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isEditPaymentConfigOpen}
        onClose={() => setIsEditPaymentConfigOpen(false)}
        title="Edit Payment Configuration"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Mode
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setEditedPaymentType("total")}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                  editedPaymentType === "total"
                    ? "border-green-600 bg-green-50 text-green-700"
                    : "border-gray-300 text-gray-600"
                }`}
              >
                Total Event Cost
              </button>
              <button
                type="button"
                onClick={() => setEditedPaymentType("per_person")}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                  editedPaymentType === "per_person"
                    ? "border-green-600 bg-green-50 text-green-700"
                    : "border-gray-300 text-gray-600"
                }`}
              >
                Fixed Per Person
              </button>
              <button
                type="button"
                onClick={() => setEditedPaymentType("split_bill")}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                  editedPaymentType === "split_bill"
                    ? "border-green-600 bg-green-50 text-green-700"
                    : "border-gray-300 text-gray-600"
                }`}
              >
                Split Bill
              </button>
            </div>
          </div>

          {editedPaymentType === "per_person" ? (
            <CurrencyInput
              label="Per Person Amount"
              placeholder="50000"
              required
              value={editedPerPersonAmount}
              onChange={(e) => setEditedPerPersonAmount(e.target.value)}
            />
          ) : editedPaymentType === "split_bill" ? (
            <div className="space-y-3">
              <CurrencyInput
                label="Tax / Service Amount"
                placeholder="0"
                value={editedSplitBillTaxAmount}
                onChange={(e) =>
                  setEditedSplitBillTaxAmount(e.target.value ?? 0)
                }
              />
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Bill Items
                </p>
                {editedSplitBillItems.map((item, index) => (
                  <div
                    key={`edit-split-item-${index}`}
                    className="rounded-lg border border-gray-200 p-3 space-y-2"
                  >
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) =>
                        updateEditedSplitBillItem(index, {
                          name: e.target.value,
                        })
                      }
                      placeholder="Item name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <CurrencyInput
                      label="Item Price"
                      value={item.price}
                      onChange={(e) =>
                        updateEditedSplitBillItem(index, {
                          price: e.target.value,
                        })
                      }
                    />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Assign participants
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {participantOptions.map((participant) => {
                          const normalizedAssignedIds = item.participant_ids
                            .map((id) => normalizeId(id))
                            .filter(Boolean);
                          const checked = normalizedAssignedIds.some((id) =>
                            participant.aliases.map((alias) => normalizeId(alias)).includes(id),
                          );
                          return (
                            <label
                              key={`edit-${index}-${participant.id}`}
                              className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-2 py-1 text-xs text-gray-700"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const next = e.target.checked
                                    ? [
                                        ...normalizedAssignedIds.filter(
                                          (id) =>
                                            !participant.aliases
                                              .map((alias) => normalizeId(alias))
                                              .includes(id),
                                        ),
                                        normalizeId(participant.id),
                                      ]
                                    : item.participant_ids.filter(
                                      (id) =>
                                          !participant.aliases
                                            .map((alias) => normalizeId(alias))
                                            .includes(normalizeId(id)),
                                      );
                                  updateEditedSplitBillItem(index, {
                                    participant_ids: next,
                                  });
                                }}
                              />
                              {participant.label}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEditedSplitBillItem(index)}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Remove item
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addEditedSplitBillItem}
                >
                  Add Item
                </Button>
              </div>
            </div>
          ) : (
            <CurrencyInput
              label="Total Cost"
              placeholder="3000000"
              required
              value={editedTotalCost}
              onChange={(e) => setEditedTotalCost(e.target.value)}
            />
          )}

          <p className="text-xs text-gray-500">
            This updates the payment setup and recalculates current record
            amounts. If participant payment activity already locked the config,
            the backend will reject the change.
          </p>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsEditPaymentConfigOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePaymentConfig}
              loading={updatePaymentConfig.isPending}
              disabled={
                editedPaymentType === "per_person"
                  ? !editedPerPersonAmount
                  : editedPaymentType === "split_bill"
                    ? !isValidSplitBillItems(editedSplitBillItems)
                    : !editedTotalCost
              }
              className="flex-1"
            >
              Save Config
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={chargeAllOpen}
        onClose={() => setChargeAllOpen(false)}
        title="Add Charge to Everyone"
      >
        <div className="space-y-4">
          <CurrencyInput
            label="Amount"
            value={chargeAllAmount}
            onChange={(e) => setChargeAllAmount(e.target.value)}
            placeholder="10000"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={2}
              placeholder="Additional shuttlecock fee"
              value={chargeAllNote}
              onChange={(e) => setChargeAllNote(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setChargeAllOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleChargeAll}
              loading={chargeAllPayments.isPending}
              disabled={!chargeAllAmount || !chargeAllNote.trim()}
              className="flex-1"
            >
              Apply Charge
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isRefundSendModalOpen}
        onClose={() => {
          setIsRefundSendModalOpen(false);
          setSelectedRefund(null);
        }}
        title="Send Refund"
      >
        <div className="space-y-4">
          {selectedRefund && (
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-sm font-semibold text-gray-900">
                {selectedRefund.display_name}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Refund amount {formatRupiah(selectedRefund.amount)}
              </p>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Refund proof image
            </label>
            <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600 hover:border-green-400 hover:bg-green-50">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isUploadingRefundProof}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  handleRefundProofImageUpload(file);
                  e.target.value = "";
                }}
              />
              {isUploadingRefundProof
                ? "Uploading proof..."
                : "Upload refund proof"}
            </label>
            {refundProofImageUrl && (
              <img
                src={refundProofImageUrl}
                alt="Refund proof"
                className="mt-3 max-h-64 w-full rounded-lg border border-gray-200 object-contain bg-white"
              />
            )}
          </div>

          <Textarea
            label="Send note"
            rows={3}
            value={refundSendNote}
            onChange={(e) => setRefundSendNote(e.target.value)}
            placeholder="Refund sent via BCA at 10:35 WIB"
          />

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsRefundSendModalOpen(false);
                setSelectedRefund(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!selectedRefund) return;
                await handleMarkRefundSent(selectedRefund.id);
                setIsRefundSendModalOpen(false);
                setSelectedRefund(null);
              }}
              loading={markRefundSent.isPending}
              className="flex-1"
            >
              Mark Refund as Sent
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PaymentPage;
