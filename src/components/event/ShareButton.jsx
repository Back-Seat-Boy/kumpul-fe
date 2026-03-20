import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { Button } from "../ui/Button";

export const ShareButton = ({ shareToken, className = "" }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/events/${shareToken}/`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Button
      variant="secondary"
      onClick={handleShare}
      className={className}
    >
      {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
      {copied ? "Copied!" : "Share"}
    </Button>
  );
};

export default ShareButton;
