import { MapPin, Phone, DollarSign, LayoutGrid, Pencil, Trash2, User, ExternalLink } from "lucide-react";
import { formatRupiah } from "../../utils/format";
import { Avatar } from "../ui/Avatar";

export const VenueCard = ({ venue, onEdit, onDelete, isOwner }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900">{venue.name}</h3>
          {venue.address && (
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{venue.address}</span>
            </p>
          )}
          
          {/* Show creator if not the owner */}
          {venue.creator && !isOwner && (
            <div className="flex items-center gap-2 mt-2">
              <User className="w-3 h-3 text-gray-400" />
              <Avatar
                src={venue.creator.avatar_url}
                name={venue.creator.name}
                size="sm"
              />
              <span className="text-xs text-gray-500">{venue.creator.name}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isOwner && (
            <>
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
            </>
          )}
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
        {venue.maps_url && (
          <a
            href={venue.maps_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-green-700 hover:text-green-800"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open map
          </a>
        )}
      </div>

      {venue.notes && (
        <p className="text-xs text-gray-400 mt-2">{venue.notes}</p>
      )}
    </div>
  );
};

export default VenueCard;
