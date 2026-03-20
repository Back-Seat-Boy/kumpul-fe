import { MapPin, Phone, DollarSign, LayoutGrid, Pencil, Trash2 } from "lucide-react";
import { formatRupiah } from "../../utils/format";

export const VenueCard = ({ venue, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">{venue.name}</h3>
          {venue.address && (
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {venue.address}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(venue)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(venue.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-500">
        {venue.whatsapp_number && (
          <span className="flex items-center gap-1">
            <Phone className="w-3.5 h-3.5" />
            {venue.whatsapp_number}
          </span>
        )}
        {venue.price_per_hour > 0 && (
          <span className="flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" />
            {formatRupiah(venue.price_per_hour)}/hour
          </span>
        )}
        {venue.court_count > 0 && (
          <span className="flex items-center gap-1">
            <LayoutGrid className="w-3.5 h-3.5" />
            {venue.court_count} courts
          </span>
        )}
      </div>

      {venue.notes && (
        <p className="text-xs text-gray-400 mt-2">{venue.notes}</p>
      )}
    </div>
  );
};

export default VenueCard;
