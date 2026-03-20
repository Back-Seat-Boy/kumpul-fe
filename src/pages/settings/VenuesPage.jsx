import { useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, MapPin } from "lucide-react";
import { useVenues, useCreateVenue, useUpdateVenue, useDeleteVenue } from "../../hooks/useVenues";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Modal } from "../../components/ui/Modal";
import { EmptyState } from "../../components/ui/EmptyState";
import { VenueCard } from "../../components/venue/VenueCard";
import { Spinner } from "../../components/ui/Spinner";

export const VenuesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);

  const { data: venues, isLoading } = useVenues();
  const createVenue = useCreateVenue();
  const updateVenue = useUpdateVenue();
  const deleteVenue = useDeleteVenue();

  const handleEdit = (venue) => {
    setEditingVenue(venue);
    setIsModalOpen(true);
  };

  const handleDelete = async (venueId) => {
    if (confirm("Are you sure you want to delete this venue?")) {
      await deleteVenue.mutateAsync(venueId);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVenue(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-900">My Venues</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Venue
        </Button>
      </div>

      {isLoading ? (
        <div className="py-12">
          <Spinner />
        </div>
      ) : venues?.length > 0 ? (
        <div className="space-y-3">
          {venues.map((venue) => (
            <VenueCard
              key={venue.id}
              venue={venue}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={MapPin}
          title="No venues yet"
          description="Add venues you frequently book for your events."
          action={
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4" />
              Add Venue
            </Button>
          }
          className="bg-white rounded-xl border border-gray-200 py-12"
        />
      )}

      <VenueModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        venue={editingVenue}
        onSubmit={editingVenue ? updateVenue.mutateAsync : createVenue.mutateAsync}
        isLoading={editingVenue ? updateVenue.isPending : createVenue.isPending}
      />
    </div>
  );
};

const VenueModal = ({ isOpen, onClose, venue, onSubmit, isLoading }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: venue || {},
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFormSubmit = (data) => {
    const submitData = {
      ...data,
      price_per_hour: parseInt(data.price_per_hour) || 0,
      court_count: parseInt(data.court_count) || 1,
    };

    if (venue) {
      onSubmit({ venueId: venue.id, data: submitData }).then(handleClose);
    } else {
      onSubmit(submitData).then(handleClose);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={venue ? "Edit Venue" : "Add New Venue"}
    >
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
            {venue ? "Save Changes" : "Add Venue"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default VenuesPage;
