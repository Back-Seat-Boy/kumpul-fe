import { Badge } from "../ui/Badge";

const statusLabels = {
  voting: "Voting",
  confirmed: "Confirmed",
  open: "Open",
  payment_open: "Payment",
  cancelled: "Cancelled",
  completed: "Completed",
};

export const EventStatusBadge = ({ status, className = "" }) => {
  return (
    <Badge variant={status} className={className}>
      {statusLabels[status] || status}
    </Badge>
  );
};

export default EventStatusBadge;
