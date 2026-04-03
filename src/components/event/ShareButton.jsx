import { useState } from "react";
import { Share2, Check, MessageCircle } from "lucide-react";
import { Button } from "../ui/Button";
import { formatDate, formatRupiah } from "../../utils/format";
import { generateWhatsAppShareLink } from "../../utils/whatsapp";

const buildShareMessage = ({ shareUrl, event, chosenOption, payment }) => {
  const lines = [];

  if (event?.title) {
    lines.push(event.title);
  }

  if (chosenOption) {
    const schedule = [formatDate(chosenOption.date)];
    if (chosenOption.start_time || chosenOption.end_time) {
      schedule.push(
        [chosenOption.start_time, chosenOption.end_time].filter(Boolean).join(" - "),
      );
    }

    lines.push(`Jadwal: ${schedule.join(" • ")}`);

    if (chosenOption.venue?.name) {
      lines.push(`Tempat: ${chosenOption.venue.name}`);
    }

    if (chosenOption.venue?.maps_url) {
      lines.push(`Map: ${chosenOption.venue.maps_url}`);
    }
  }

  if (payment) {
    if (payment.type === "per_person") {
      lines.push(`Biaya: ${formatRupiah(payment.base_split)}/orang`);
    } else if (payment.total_cost) {
      lines.push(
        `Biaya: total ${formatRupiah(payment.total_cost)}${payment.base_split ? ` • ${formatRupiah(payment.base_split)}/orang` : ""}`,
      );
    }
  }

  lines.push(`Link: ${shareUrl}`);

  return lines.filter(Boolean).join("\n");
};

export const ShareButton = ({
  shareToken,
  event,
  chosenOption,
  payment,
  className = "",
}) => {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/events/${shareToken}/`;
  const shareMessage = buildShareMessage({
    shareUrl,
    event,
    chosenOption,
    payment,
  });

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleWhatsAppShare = () => {
    window.open(generateWhatsAppShareLink(shareMessage), "_blank");
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <Button
        variant="secondary"
        onClick={handleShare}
      >
        {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
        {copied ? "Copied!" : "Copy"}
      </Button>
      <Button
        variant="primary"
        onClick={handleWhatsAppShare}
      >
        <MessageCircle className="w-4 h-4" />
        WhatsApp
      </Button>
    </div>
  );
};

export default ShareButton;
