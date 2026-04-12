import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useAuth } from "../../hooks/useAuth";
import { updateMe } from "../../api/users";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Avatar } from "../../components/ui/Avatar";
import { Modal } from "../../components/ui/Modal";
import { getErrorMessage, useToastStore } from "../../utils/toast";
import {
  useMyPaymentMethods,
  useCreateMyPaymentMethod,
  useUpdateMyPaymentMethod,
  useDeleteMyPaymentMethod,
} from "../../hooks/useUsers";
import { uploadImage } from "../../api/uploads";

export const ProfilePage = () => {
  const { user } = useAuth();
  const setSession = useAuthStore((state) => state.setSession);
  const sessionId = useAuthStore((state) => state.sessionId);
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);
  const queryClient = useQueryClient();
  const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState(null);
  const [paymentMethodLabel, setPaymentMethodLabel] = useState("");
  const [paymentMethodInfo, setPaymentMethodInfo] = useState("");
  const [paymentMethodImageUrl, setPaymentMethodImageUrl] = useState("");
  const [isUploadingPaymentMethodImage, setIsUploadingPaymentMethodImage] =
    useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const { data: paymentMethods = [] } = useMyPaymentMethods(!!sessionId);
  const createPaymentMethod = useCreateMyPaymentMethod();
  const updatePaymentMethod = useUpdateMyPaymentMethod();
  const deletePaymentMethod = useDeleteMyPaymentMethod();

  // Reset form when user data loads
  useEffect(() => {
    if (user) {
      reset({
        name: user.name || "",
        whatsapp_number: user.whatsapp_number || "",
      });
    }
  }, [user, reset]);

  const updateProfile = useMutation({
    mutationFn: updateMe,
    onSuccess: (data) => {
      setSession(sessionId, data);
      queryClient.invalidateQueries({ queryKey: ["me"] });
      showSuccess("Profile updated successfully");
    },
    onError: (error) => {
      showError(getErrorMessage(error));
    },
  });

  const onSubmit = (data) => {
    updateProfile.mutate(data);
  };

  const resetPaymentMethodForm = () => {
    setEditingPaymentMethod(null);
    setPaymentMethodLabel("");
    setPaymentMethodInfo("");
    setPaymentMethodImageUrl("");
  };

  const openCreatePaymentMethodModal = () => {
    resetPaymentMethodForm();
    setIsPaymentMethodModalOpen(true);
  };

  const openEditPaymentMethodModal = (method) => {
    setEditingPaymentMethod(method);
    setPaymentMethodLabel(method.label || "");
    setPaymentMethodInfo(method.payment_info || "");
    setPaymentMethodImageUrl(method.image_url || "");
    setIsPaymentMethodModalOpen(true);
  };

  const handlePaymentMethodImageUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showError("Please choose an image file");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result?.toString().split(",")[1];
      if (!base64) return;

      setIsUploadingPaymentMethodImage(true);
      try {
        const { url } = await uploadImage(base64);
        setPaymentMethodImageUrl(url);
      } catch (error) {
        showError(getErrorMessage(error));
      } finally {
        setIsUploadingPaymentMethodImage(false);
      }
    };
  };

  const handleSavePaymentMethod = async () => {
    const payload = {
      label: paymentMethodLabel.trim(),
      payment_info: paymentMethodInfo.trim(),
      image_url: paymentMethodImageUrl || undefined,
    };

    try {
      if (editingPaymentMethod?.id) {
        await updatePaymentMethod.mutateAsync({
          id: editingPaymentMethod.id,
          data: payload,
        });
      } else {
        await createPaymentMethod.mutateAsync(payload);
      }
      setIsPaymentMethodModalOpen(false);
      resetPaymentMethodForm();
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">Profile</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-6">
          <Avatar src={user?.avatar_url} name={user?.name} size="xl" />
          <p className="text-sm text-gray-500 mt-2">Avatar from Google</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Name"
            required
            error={errors.name?.message}
            {...register("name", { required: "Name is required" })}
          />

          <Input
            label="Email"
            value={user?.email || ""}
            disabled
            className="bg-gray-50"
          />

          <Input
            label="WhatsApp Number"
            placeholder="6281234567890"
            {...register("whatsapp_number")}
          />

          <Button
            type="submit"
            loading={updateProfile.isPending}
            className="w-full"
          >
            Save Changes
          </Button>
          {user?.id && (
            <Link
              to={`/users/${user.id}/events`}
              className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
            >
              View My Events
            </Link>
          )}
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Saved Payment Methods
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Reuse your bank transfer or QR payment details for event payments.
            </p>
          </div>
          <Button onClick={openCreatePaymentMethodModal} className="shrink-0">
            <Plus className="w-4 h-4" />
            Add Method
          </Button>
        </div>

        {paymentMethods.length === 0 ? (
          <p className="text-sm text-gray-500">No saved payment methods yet.</p>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">{method.label}</p>
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap break-words">
                      {method.payment_info}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditPaymentMethodModal(method)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePaymentMethod.mutate(method.id)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {method.image_url && (
                  <img
                    src={method.image_url}
                    alt={method.label}
                    className="mt-3 max-h-48 w-full rounded-lg border border-gray-200 object-contain bg-white"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isPaymentMethodModalOpen}
        onClose={() => setIsPaymentMethodModalOpen(false)}
        title={editingPaymentMethod ? "Edit Payment Method" : "Add Payment Method"}
      >
        <div className="space-y-4">
          <Input
            label="Label"
            value={paymentMethodLabel}
            onChange={(e) => setPaymentMethodLabel(e.target.value)}
            placeholder="BCA Personal"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Information
            </label>
            <textarea
              value={paymentMethodInfo}
              onChange={(e) => setPaymentMethodInfo(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="BCA 1234567890 a/n John Doe"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Image (optional)
            </label>
            <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300 px-4 py-4 text-sm text-gray-600 hover:border-green-400 hover:bg-green-50">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  handlePaymentMethodImageUpload(file);
                  e.target.value = "";
                }}
              />
              {isUploadingPaymentMethodImage ? "Uploading image..." : "Upload image"}
            </label>
            {paymentMethodImageUrl && (
              <img
                src={paymentMethodImageUrl}
                alt="Payment method"
                className="max-h-48 w-full rounded-lg border border-gray-200 object-contain bg-white"
              />
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsPaymentMethodModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePaymentMethod}
              loading={createPaymentMethod.isPending || updatePaymentMethod.isPending}
              disabled={!paymentMethodLabel.trim() || !paymentMethodInfo.trim()}
              className="flex-1"
            >
              Save Method
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProfilePage;
