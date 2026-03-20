import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, Clock, AlertCircle, Copy } from "lucide-react";
import { usePayment, useCreatePayment, useClaimPayment, useConfirmPayment } from "../hooks/usePayments";
import { useEvent } from "../hooks/useEvents";
import { useParticipants } from "../hooks/useParticipants";
import { useAuthStore } from "../store/authStore";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Spinner } from "../components/ui/Spinner";
import { PaymentRecordRow } from "../components/payment/PaymentRecordRow";
import { ProofUploader } from "../components/payment/ProofUploader";
import { formatRupiah } from "../utils/format";
import { uploadImage } from "../api/uploads";
import { useToastStore, getErrorMessage } from "../utils/toast";

export const PaymentPage = () => {
  const { shareToken } = useParams();
  const user = useAuthStore((state) => state.user);
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [totalCost, setTotalCost] = useState("");
  const [paymentInfo, setPaymentInfo] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const { data: event } = useEvent(shareToken);
  const { data: participants } = useParticipants(shareToken);
  const { data: paymentData, isLoading } = usePayment(event?.id);

  const createPayment = useCreatePayment();
  const claimPayment = useClaimPayment();
  const confirmPayment = useConfirmPayment();

  const isCreator = event && user && event.created_by === user.id;
  const payment = paymentData?.payment;
  const records = paymentData?.records || [];

  // Calculate summary
  const confirmedCount = records.filter((r) => r.status === "confirmed").length;
  const claimedCount = records.filter((r) => r.status === "claimed").length;
  const pendingCount = records.filter((r) => r.status === "pending").length;

  // Current user's record
  const userRecord = records.find((r) => r.user_id === user?.id);

  const handleCreatePayment = async () => {
    try {
      await createPayment.mutateAsync({
        eventId: event.id,
        data: {
          total_cost: parseInt(totalCost),
          payment_info: paymentInfo,
        },
      });
      setIsCreateModalOpen(false);
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  const handleUploadProof = async (base64Image) => {
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

  const handleConfirmPayment = async (userId) => {
    try {
      await confirmPayment.mutateAsync({ eventId: event.id, userId });
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
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

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {!payment ? (
          /* No payment created yet */
          isCreator ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Payment Not Opened
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Open payment to start collecting from participants.
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                Open Payment
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Payment Not Opened Yet
              </h2>
              <p className="text-sm text-gray-500">
                The event organizer hasn&apos;t opened payment collection yet.
              </p>
            </div>
          )
        ) : (
          <>
            {/* Payment Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 text-green-700 mb-1">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-lg font-bold">{confirmedCount}</span>
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
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                Payment Details
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Cost</span>
                  <span className="font-semibold">{formatRupiah(payment.total_cost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Per Person</span>
                  <span className="font-semibold">{formatRupiah(payment.split_amount)}</span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Payment Info</span>
                    <button
                      onClick={handleCopyPaymentInfo}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded mt-1">
                    {payment.payment_info}
                  </p>
                </div>
              </div>
            </div>

            {/* User's Payment Action */}
            {!isCreator && userRecord && userRecord.status === "pending" && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Submit Your Payment
                </h2>
                <ProofUploader
                  onUpload={handleUploadProof}
                  isUploading={isUploading || claimPayment.isPending}
                />
              </div>
            )}

            {!isCreator && userRecord && userRecord.status === "claimed" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">Payment Pending Confirmation</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Your payment proof has been submitted and is awaiting confirmation from the organizer.
                </p>
              </div>
            )}

            {!isCreator && userRecord && userRecord.status === "confirmed" && (
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
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                Payment Records
              </h2>
              <div className="space-y-2">
                {records.map((record) => (
                  <PaymentRecordRow
                    key={record.id}
                    record={record}
                    splitAmount={payment.split_amount}
                    isCreator={isCreator}
                    onConfirm={handleConfirmPayment}
                    eventId={event.id}
                  />
                ))}
              </div>
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
          <Input
            label="Total Cost"
            type="number"
            placeholder="3000000"
            required
            value={totalCost}
            onChange={(e) => setTotalCost(e.target.value)}
          />
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
              loading={createPayment.isPending}
              disabled={!totalCost || !paymentInfo}
              className="flex-1"
            >
              Open Payment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PaymentPage;
