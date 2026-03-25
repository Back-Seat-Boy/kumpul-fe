import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, Clock, AlertCircle, Copy, Wallet, TrendingUp, MinusCircle, PlusCircle, Check, Upload } from "lucide-react";
import { usePayment, useCreatePayment, useClaimPayment, useConfirmPayment, useAdjustPayment } from "../hooks/usePayments";
import { useEvent, useUpdateEventStatus } from "../hooks/useEvents";
import { useParticipants } from "../hooks/useParticipants";
import { useAuthStore } from "../store/authStore";
import { Button } from "../components/ui/Button";
import { CurrencyInput } from "../components/ui/CurrencyInput";
import { Modal } from "../components/ui/Modal";
import { Spinner } from "../components/ui/Spinner";
import { PaymentRecordRow } from "../components/payment/PaymentRecordRow";
import { ProofUploader } from "../components/payment/ProofUploader";
import { formatRupiah, formatNumberWithDots } from "../utils/format";
import { uploadImage } from "../api/uploads";
import { useToastStore, getErrorMessage } from "../utils/toast";

const formatRupiahInMessage = (message) => {
  if (!message) return "";
  return message.replace(/Rp\s*(\d+)/g, (match, number) => {
    const formatted = formatNumberWithDots(number);
    return `Rp ${formatted}`;
  });
};

// Helper to get action icon and color
const getActionStyle = (action) => {
  switch (action) {
    case "pay_full":
      return { icon: <Clock className="w-4 h-4" />, color: "text-yellow-600", bg: "bg-yellow-50" };
    case "pay_more":
      return { icon: <MinusCircle className="w-4 h-4" />, color: "text-orange-600", bg: "bg-orange-50" };
    case "receive_refund":
      return { icon: <PlusCircle className="w-4 h-4" />, color: "text-green-600", bg: "bg-green-50" };
    case "no_action":
      return { icon: <Check className="w-4 h-4" />, color: "text-green-600", bg: "bg-green-50" };
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

export const PaymentPage = () => {
  const { shareToken } = useParams();
  const user = useAuthStore((state) => state.user);
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [totalCost, setTotalCost] = useState("");
  const [paymentInfo, setPaymentInfo] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  
  // Adjustment modal state
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustPerson, setAdjustPerson] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [adjustProofUrl, setAdjustProofUrl] = useState("");
  const [isAdjustUploading, setIsAdjustUploading] = useState(false);

  const { data: event } = useEvent(shareToken);
  const { data: participants } = useParticipants(shareToken);
  const { data: paymentData, isLoading } = usePayment(event?.id);

  const createPayment = useCreatePayment();
  const updateEventStatus = useUpdateEventStatus();
  const claimPayment = useClaimPayment();
  const confirmPayment = useConfirmPayment();
  const adjustPayment = useAdjustPayment();

  const isCreator = event && user && event.created_by === user.id;
  const payment = paymentData?.payment;
  const records = paymentData?.records || [];
  const summary = paymentData?.summary;
  const perPersonStatus = summary?.per_person_status || [];

  const confirmedCount = summary?.num_confirmed ?? records.filter((r) => r.status === "confirmed").length;
  const claimedCount = summary?.num_claimed ?? records.filter((r) => r.status === "claimed").length;
  const pendingCount = summary?.num_pending ?? records.filter((r) => r.status === "pending").length;

  const userRecord = records.find((r) => r.user_id === user?.id);

  const handleCreatePayment = async () => {
    try {
      await createPayment.mutateAsync({
        eventId: event.id,
        data: {
          total_cost: parseInt(totalCost) || 0,
          payment_info: paymentInfo,
        },
      });
      
      await updateEventStatus.mutateAsync({
        eventId: event.id,
        status: "payment_open",
        shareToken,
      });
      
      setIsCreateModalOpen(false);
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  const handleUploadProof = async (base64Image) => {
    // If no image provided, submit claim without proof
    if (!base64Image) {
      await claimPayment.mutateAsync({ eventId: event.id, proofImageUrl: null });
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

  const openAdjustModal = (person) => {
    setAdjustPerson(person);
    setAdjustAmount(person.action_amount?.toString() || "");
    setAdjustNote("");
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
      const amount = parseInt(adjustAmount);
      let adjustmentAmount;
      
      // Determine adjustment direction based on action
      if (adjustPerson.action === "receive_refund") {
        // Refund is negative adjustment
        adjustmentAmount = -Math.abs(amount);
      } else {
        // Additional payment is positive adjustment
        adjustmentAmount = Math.abs(amount);
      }
      
      await adjustPayment.mutateAsync({
        eventId: event.id,
        userId: adjustPerson.user_id,
        data: {
          adjustment_amount: adjustmentAmount,
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
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

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {!payment ? (
          isCreator ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
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
                  Payment can only be opened when event status is "Open for RSVP".
                </p>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
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
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Financial Summary
                </h2>
                
                <div className="flex items-center justify-between mb-4 p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-gray-600">Current Split</span>
                  <span className="text-lg font-bold text-blue-700">
                    {formatRupiah(payment.split_amount)}/person
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
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
                  <div className={`p-3 rounded-lg ${summary.balance > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {summary.balance > 0 ? (
                        <PlusCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <MinusCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className={`text-sm font-medium ${summary.balance > 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {summary.balance > 0 ? 'Surplus' : 'Shortage'}
                      </span>
                    </div>
                    <p className={`text-sm ${summary.balance > 0 ? 'text-green-800' : 'text-red-800'}`}>
                      {formatRupiahInMessage(summary.balance_message)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Per-Person Status */}
            {perPersonStatus.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Participant Status
                </h2>
                <div className="space-y-2">
                  {perPersonStatus.map((person) => {
                    const style = getActionStyle(person.action);
                    const buttonText = getActionButtonText(person.action);
                    // Adjust button only shows when:
                    // - Event status is payment_open
                    // - Creator is viewing
                    // - Participant has a confirmed payment record (adjust is for confirmed records only)
                    // - Action is pay_more or receive_refund (not pay_full - they need to claim first)
                    const showAdjustButton = isCreator && 
                      event.status === "payment_open" && 
                      person.status === "confirmed" && 
                      (person.action === "pay_more" || person.action === "receive_refund");
                    
                    return (
                      <div
                        key={person.user_id}
                        className={`flex items-center justify-between p-3 rounded-lg ${style.bg}`}
                      >
                        <div>
                          <p className="font-medium text-gray-900">{person.user_name}</p>
                          {person.paid_amount > 0 && (
                            <p className="text-xs text-gray-500">
                              Paid {formatRupiah(person.paid_amount)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`flex items-center gap-1.5 text-sm font-medium ${style.color}`}>
                            {style.icon}
                            <span>{getActionText(person.action, person.action_amount)}</span>
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

            {/* Payment Status Summary */}
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
              
              {/* Complete Event Button - Creator only when all paid */}
              {isCreator && event.status === "payment_open" && confirmedCount > 0 && confirmedCount === summary?.num_participants && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Button
                    onClick={() => updateEventStatus.mutateAsync({ eventId: event.id, status: "completed", shareToken })}
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

            {/* Payment Details */}
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

            {/* User's Payment Action - only when payment_open */}
            {!isCreator && event.status === "payment_open" && userRecord && userRecord.status === "pending" && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Submit Your Payment
                </h2>
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
                    eventStatus={event.status}
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
          <CurrencyInput
            label="Total Cost"
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
              loading={createPayment.isPending || updateEventStatus.isPending}
              disabled={!totalCost || !paymentInfo}
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
        title={adjustPerson ? `Adjust Payment - ${adjustPerson.user_name}` : "Adjust Payment"}
      >
        {adjustPerson && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                Current paid: <strong>{formatRupiah(adjustPerson.paid_amount)}</strong>
              </p>
              <p className="text-sm text-gray-600">
                Current split: <strong>{formatRupiah(adjustPerson.current_split)}</strong>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {adjustPerson.action === "receive_refund" 
                  ? `Recording refund of ${formatRupiah(adjustPerson.action_amount)}`
                  : `Recording additional payment of ${formatRupiah(adjustPerson.action_amount)}`
                }
              </p>
            </div>

            <CurrencyInput
              label={adjustPerson.action === "receive_refund" ? "Refund Amount" : "Additional Payment Amount"}
              value={adjustAmount}
              onChange={setAdjustAmount}
              placeholder="Amount"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note (optional)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={2}
                placeholder={adjustPerson.action === "receive_refund" 
                  ? "Refund reason..."
                  : "Additional payment reason..."
                }
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
                {adjustPerson.action === "receive_refund" ? "Record Refund" : "Record Payment"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PaymentPage;
