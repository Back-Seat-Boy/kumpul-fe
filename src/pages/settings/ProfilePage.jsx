import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../store/authStore";
import { useAuth } from "../../hooks/useAuth";
import { updateMe } from "../../api/users";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Avatar } from "../../components/ui/Avatar";
import { getErrorMessage, useToastStore } from "../../utils/toast";

export const ProfilePage = () => {
  const { user } = useAuth();
  const setSession = useAuthStore((state) => state.setSession);
  const sessionId = useAuthStore((state) => state.sessionId);
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

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
    </div>
  );
};

export default ProfilePage;
