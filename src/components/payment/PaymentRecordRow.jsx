import { useState } from "react";
import { Check, Eye, MessageCircle, Pencil, UserRound } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { formatDateTime, formatRupiah } from "../../utils/format";
import { getNudgeWhatsAppLink } from "../../api/whatsapp";
import { generateWhatsAppShareLink } from "../../utils/whatsapp";
import { useToastStore, getErrorMessage } from "../../utils/toast";

export const PaymentRecordRow = ({
  record,
  settlement,
  isCreator,
  allowEdit = true,
  onConfirm,
  onEdit,
  eventId,
  eventName,
  shareToken,
  eventStatus,
}) => {
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isNudging, setIsNudging] = useState(false);
  const showError = useToastStore((state) => state.showError);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm(record.participant_id);
    } catch (error) {
      showError(getErrorMessage(error));
    } finally {
      setIsConfirming(false);
    }
  };

  const handleNudge = async () => {
    setIsNudging(true);
    try {
      if (record.participant?.user?.whatsapp_number) {
        const { link } = await getNudgeWhatsAppLink(
          eventId,
          record.participant.user_id,
        );
        window.open(link, "_blank");
      } else {
        const amountToMention =
          settlement?.action === "pay_more" || settlement?.action === "pay_full"
            ? settlement.action_amount
            : record.amount;
        const paymentUrl = `${window.location.origin}/events/${shareToken}/payment`;
        const message = `Hei ${participantName}, jangan lupa pembayaran ${eventName} ya. Saat ini masih perlu bayar ${formatRupiah(amountToMention)}.\n\nCek detil dan konfirmasi pembayaran kesini ya!\n${paymentUrl}`;
        window.open(generateWhatsAppShareLink(message), "_blank");
      }
    } catch (error) {
      showError(getErrorMessage(error));
    } finally {
      setIsNudging(false);
    }
  };

  const isGuestParticipant = !record.participant?.user_id;
  const participantName = isGuestParticipant
    ? record.participant?.guest_name
    : record.participant?.user?.name;
  const claims = record.claims || [];
  const latestClaim = claims[0];
  const hasClaimHistory = claims.length > 0;
  const canNudge = Boolean(record.participant?.user_id);
  const canEdit = allowEdit && isCreator && eventStatus === "payment_open";
  const needsAdditionalPayment =
    settlement?.action === "pay_more" || settlement?.action === "pay_full";
  const canCreatorConfirm =
    isCreator &&
    eventStatus === "payment_open" &&
    (record.status === "pending" ||
      record.status === "claimed" ||
      needsAdditionalPayment);
  const canCreatorNudge =
    isCreator &&
    eventStatus === "payment_open" &&
    // canNudge &&
    (record.status === "pending" || needsAdditionalPayment);
  const settlementText =
    settlement?.action && settlement.action !== "no_action"
      ? settlement.action === "pay_full"
        ? `Needs ${formatRupiah(settlement.action_amount)}`
        : settlement.action === "pay_more"
          ? `Needs ${formatRupiah(settlement.action_amount)} more`
          : `Refund ${formatRupiah(settlement.action_amount)}`
      : null;

  return (
    <>
      <div className="rounded-lg bg-gray-50 p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex items-center gap-3">
            {isGuestParticipant ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                <UserRound className="w-4 h-4" />
              </div>
            ) : (
              <Avatar
                src={record.participant?.user?.avatar_url}
                name={record.participant?.user?.name}
                size="md"
              />
            )}
            <div className="min-w-0">
              <p
                className={`font-medium text-gray-900 ${isGuestParticipant ? "italic" : ""}`}
              >
                {participantName}
              </p>
              <p className="text-sm text-gray-700">
                {formatRupiah(record.amount)}
              </p>
              {record.note && (
                <p className="text-xs text-gray-500">{record.note}</p>
              )}
              {settlementText && (
                <p
                  className={`text-xs mt-0.5 ${
                    settlement?.action === "receive_refund"
                      ? "text-green-700"
                      : "text-amber-700"
                  }`}
                >
                  {record.status === "confirmed" && record.paid_amount > 0
                    ? `Paid ${formatRupiah(record.paid_amount)}. ${settlementText}.`
                    : settlementText}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <Badge
              variant={
                record.status === "confirmed" ? "pending" : record.status
              }
              className={
                record.status === "confirmed"
                  ? "bg-green-100 text-green-700"
                  : ""
              }
            >
              {record.status === "confirmed" ? "Paid" : record.status}
            </Badge>

            {hasClaimHistory && (
              <button
                onClick={() => setIsImageOpen(true)}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                title="View claim history"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}

            {canEdit && (
              <Button
                variant="ghost"
                onClick={() => onEdit(record)}
                className="px-2 py-1 text-xs"
              >
                <Pencil className="w-3 h-3" />
                Edit
              </Button>
            )}

            {canCreatorConfirm && (
              <Button
                variant="primary"
                onClick={handleConfirm}
                loading={isConfirming}
                className="px-2 py-1 text-xs"
              >
                <Check className="w-3 h-3" />
                Confirm
              </Button>
            )}

            {canCreatorNudge && (
              <Button
                variant="secondary"
                onClick={handleNudge}
                loading={isNudging}
                className="px-2 py-1 text-xs"
              >
                <MessageCircle className="w-3 h-3" />
                Nudge
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Claim History Modal */}
      <Modal
        isOpen={isImageOpen}
        onClose={() => setIsImageOpen(false)}
        title="Payment Claims"
        size="md"
      >
        {hasClaimHistory ? (
          <div className="space-y-3">
            {latestClaim?.status === "claimed" && (
              <p className="text-sm text-gray-500">
                Latest claim is still waiting for organizer confirmation.
              </p>
            )}

            {claims.map((claim) => (
              <div
                key={claim.id}
                className="rounded-xl border border-gray-200 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Claimed {formatRupiah(claim.claimed_amount)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Submitted {formatDateTime(claim.claimed_at)}
                    </p>
                    {claim.confirmed_at && (
                      <p className="text-xs text-gray-500 mt-1">
                        Confirmed {formatDateTime(claim.confirmed_at)}
                      </p>
                    )}
                  </div>
                  <Badge variant={claim.status}>
                    {claim.status === "confirmed" ? "Confirmed" : "Claimed"}
                  </Badge>
                </div>

                {claim.note && (
                  <p className="mt-2 text-sm text-gray-600">{claim.note}</p>
                )}

                {claim.proof_image_url ? (
                  <img
                    src={claim.proof_image_url}
                    alt="Payment proof"
                    className="mt-3 w-full rounded-lg"
                  />
                ) : (
                  <p className="mt-2 text-xs text-gray-400">
                    No proof image uploaded.
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No claim history yet.</p>
        )}
      </Modal>
    </>
  );
};

export default PaymentRecordRow;
