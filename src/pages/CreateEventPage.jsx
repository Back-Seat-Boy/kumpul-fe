import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Plus, X } from "lucide-react";
import { useCreateEvent } from "../hooks/useEvents";
import { useVenues, useCreateVenue } from "../hooks/useVenues";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Select } from "../components/ui/Select";
import { Modal } from "../components/ui/Modal";
import { toRFC3339 } from "../utils/format";
import { useToastStore, getErrorMessage } from "../utils/toast";

export const CreateEventPage = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [options, setOptions] = useState([{ venueId: "", date: "", startTime: "", endTime: "" }]);
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
  const showError = useToastStore((state) => state.showError);

  const { data: venues } = useVenues();
  const createEvent = useCreateEvent();
  const createVenue = useCreateVenue();

  const venueOptions = venues?.map((v) => ({ value: v.id, label: v.name })) || [];

  const addOption = () => {
    if (options.length < 3) {
      setOptions([...options, { venueId: "", date: "", startTime: "", endTime: "" }]);
    }
  };

  const removeOption = (index) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index, field, value) => {
    const newOptions = [...options];
    newOptions[index][field] = value;
    setOptions(newOptions);
  };

  const onSubmit = async (data) => {
    try {
      // Format voting_deadline to RFC3339
      const votingDeadline = data.voting_deadline ? toRFC3339(data.voting_deadline) : null;

      // Build options array for the API
      const formattedOptions = options
        .filter((opt) => opt.venueId && opt.date) // Only include complete options
        .map((opt) => ({
          venue_id: opt.venueId,
          date: toRFC3339(`${opt.date}T00:00`),
          start_time: opt.startTime || "18:00",
          end_time: opt.endTime || "20:00",
        }));

      if (formattedOptions.length === 0) {
        showError("Please add at least one venue option");
        return;
      }

      // Create event with options in single request
      const event = await createEvent.mutateAsync({
        title: data.title,
        description: data.description,
        player_cap: data.player_cap ? parseInt(data.player_cap) : null,
        voting_deadline: votingDeadline,
        options: formattedOptions,
      });

      navigate(`/events/${event.share_token}`);
    } catch (error) {
      // Error is already shown by the hook via toast
      console.error("Failed to create event:", error);
    }
  };

  const handleCreateVenue = async (venueData) => {
    try {
      await createVenue.mutateAsync(venueData);
      setIsVenueModalOpen(false);
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">Create Event</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Basic Info
          </h2>

          <Input
            label="Event Title"
            placeholder="Weekend Badminton"
            required
            error={errors.title?.message}
            {...register("title", { required: "Title is required" })}
          />

          <Textarea
            label="Description"
            placeholder="What's this event about?"
            {...register("description")}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Player Cap"
              type="number"
              placeholder="Optional"
              {...register("player_cap")}
            />

            <Input
              label="Voting Deadline"
              type="datetime-local"
              {...register("voting_deadline")}
            />
          </div>
        </div>

        {/* Venue Options */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Venue Options
            </h2>
            <span className="text-xs text-gray-400">
              {options.length} / 3
            </span>
          </div>

          <div className="space-y-3">
            {options.map((option, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Option {index + 1}
                  </span>
                  {options.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <Select
                  label="Venue"
                  required
                  options={venueOptions}
                  value={option.venueId}
                  onChange={(e) => updateOption(index, "venueId", e.target.value)}
                />

                <Input
                  label="Date"
                  type="date"
                  required
                  value={option.date}
                  onChange={(e) => updateOption(index, "date", e.target.value)}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Start Time"
                    type="time"
                    value={option.startTime}
                    onChange={(e) => updateOption(index, "startTime", e.target.value)}
                  />
                  <Input
                    label="End Time"
                    type="time"
                    value={option.endTime}
                    onChange={(e) => updateOption(index, "endTime", e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          {options.length < 3 && (
            <Button
              type="button"
              variant="secondary"
              onClick={addOption}
              className="w-full"
            >
              <Plus className="w-4 h-4" />
              Add Another Option
            </Button>
          )}

          <button
            type="button"
            onClick={() => setIsVenueModalOpen(true)}
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            + Add new venue
          </button>
        </div>

        <Button
          type="submit"
          loading={createEvent.isPending}
          className="w-full"
        >
          Create Event
        </Button>
      </form>

      {/* Add Venue Modal */}
      <AddVenueModal
        isOpen={isVenueModalOpen}
        onClose={() => setIsVenueModalOpen(false)}
        onSubmit={handleCreateVenue}
        isLoading={createVenue.isPending}
      />
    </div>
  );
};

const AddVenueModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFormSubmit = (data) => {
    onSubmit({
      ...data,
      price_per_hour: parseInt(data.price_per_hour) || 0,
      court_count: parseInt(data.court_count) || 1,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Venue">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <Input
          label="Venue Name"
          required
          error={errors.name?.message}
          {...register("name", { required: "Name is required" })}
        />

        <Textarea
          label="Address"
          {...register("address")}
        />

        <Input
          label="WhatsApp Number"
          placeholder="6281234567890"
          {...register("whatsapp_number")}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Price per Hour"
            type="number"
            {...register("price_per_hour")}
          />
          <Input
            label="Court Count"
            type="number"
            {...register("court_count")}
          />
        </div>

        <Textarea
          label="Notes"
          placeholder="Indoor, AC available, etc."
          {...register("notes")}
        />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={isLoading} className="flex-1">
            Save Venue
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateEventPage;
