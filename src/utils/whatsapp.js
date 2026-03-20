export const generateWhatsAppLink = (phoneNumber, message) => {
  const cleanNumber = phoneNumber.replace(/[^\d]/g, "");
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
};

export const openWhatsApp = (phoneNumber, message) => {
  const link = generateWhatsAppLink(phoneNumber, message);
  window.open(link, "_blank");
};
