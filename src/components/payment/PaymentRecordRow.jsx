import { useState } from "react";
import { Check, X, Eye, MessageCircle } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { formatRupiah } from "../../utils/format";
import { getNudgeWhatsAppLink } from "../../api/whatsapp";
import { useToastStore, getErrorMessage } from "../../utils/toast";

export const PaymentRecordRow = ({
  record,
  splitAmount,
  isCreator,
  onConfirm,
  eventId,
  eventStatus,
}) => {
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isNudging, setIsNudging] = useState(false);
  const showError = useToastStore((state) => state.showError);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm(record.user_id);
    } catch (error) {
      showError(getErrorMessage(error));
    } finally {
      setIsConfirming(false);
    }
  };

  const handleNudge = async () => {
    setIsNudging(true);
    try {
      const { link } = await getNudgeWhatsAppLink(eventId, record.user_id);
      window.open(link, "_blank");
    } catch (error) {
      showError(getErrorMessage(error));
    } finally {
      setIsNudging(false);
    }
  };

  // Check if there's a difference between paid_amount and current split_amount
  const hasAmountDifference = record.paid_amount !== undefined && 
    record.paid_amount !== splitAmount &&
    record.status === "confirmed";

  return (
    <>
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <Avatar
            src={record.user?.avatar_url}
            name={record.user?.name}
            size="md"
          />
          <div>
            <p className="font-medium text-gray-900">{record.user?.name}</p>
            <p className="text-xs text-gray-500">{record.user?.email}</p>
            {/* Show paid amount info if different from current split */}
            {hasAmountDifference && (
              <p className="text-xs text-amber-600 mt-0.5">
                Paid {formatRupiah(record.paid_amount)} (current: {formatRupiah(splitAmount)})
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={record.status}>
            {record.status === "confirmed" ? "Paid" : record.status}
          </Badge>

          {record.status === "claimed" && record.proof_image_url && (
            <button
              onClick={() => setIsImageOpen(true)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}

          {/* Confirm button only when payment_open */}
          {isCreator && eventStatus === "payment_open" && record.status === "claimed" && (
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

          {/* Nudge button only when payment_open */}
          {isCreator && eventStatus === "payment_open" && record.status === "pending" && (
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

      {/* Proof Image Modal */}
      <Modal
        isOpen={isImageOpen}
        onClose={() => setIsImageOpen(false)}
        title="Payment Proof"
        size="md"
      >
        <img
          src={record.proof_image_url}
          alt="Payment proof"
          className="w-full rounded-lg"
        />
      </Modal>
    </>
  );
};

export default PaymentRecordRow;
