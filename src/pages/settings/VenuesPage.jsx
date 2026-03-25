import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Plus, MapPin, Search, ChevronLeft, ChevronRight, X, User } from "lucide-react";
import { useVenues, useCreateVenue, useUpdateVenue, useDeleteVenue } from "../../hooks/useVenues";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { CurrencyInput } from "../../components/ui/CurrencyInput";
import { Textarea } from "../../components/ui/Textarea";
import { Modal } from "../../components/ui/Modal";
import { EmptyState } from "../../components/ui/EmptyState";
import { VenueCard } from "../../components/venue/VenueCard";
import { Spinner } from "../../components/ui/Spinner";

const LIMIT = 10;

export const VenuesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const user = useAuthStore((state) => state.user);
  
  const { data, isLoading } = useVenues({
    page,
    limit: LIMIT,
    search: search || undefined,
  });
  const createVenue = useCreateVenue();
  const updateVenue = useUpdateVenue();
  const deleteVenue = useDeleteVenue();

  const venues = data?.venues || [];
  const total = data?.total || 0;
  const hasMore = data?.has_more || false;
  const totalPages = Math.ceil(total / LIMIT);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

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

  const isVenueOwner = (venue) => {
    return user && venue.created_by === user.id;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-900">Venues</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Venue
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search venues..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      </div>

      {!isLoading && (
        <p className="text-sm text-gray-500 mb-4">
          {total} venue{total !== 1 ? "s" : ""} found
          {search && ` for "${search}"`}
        </p>
      )}

      {isLoading ? (
        <div className="py-12">
          <Spinner />
        </div>
      ) : venues.length > 0 ? (
        <>
          <div className="space-y-3">
            {venues.map((venue) => (
              <VenueCard
                key={venue.id}
                venue={venue}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isOwner={isVenueOwner(venue)}
              />
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 mt-4">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="px-3"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                variant="secondary"
                onClick={() => setPage(page + 1)}
                disabled={!hasMore && page >= totalPages}
                className="px-3"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          icon={MapPin}
          title="No venues found"
          description={
            search
              ? "Try adjusting your search terms."
              : "Add venues you frequently book for your events."
          }
          action={
            !search ? (
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="w-4 h-4" />
                Add Venue
              </Button>
            ) : null
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
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm();
  const pricePerHour = watch("price_per_hour");

  useEffect(() => {
    if (isOpen) {
      reset(venue || {});
    }
  }, [isOpen, venue, reset]);

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
          <CurrencyInput
            label="Price per Hour"
            value={pricePerHour}
            onChange={(e) => setValue("price_per_hour", e.target.value)}
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
