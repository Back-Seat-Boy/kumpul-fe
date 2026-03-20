export const formatRupiah = (amount) => {
  if (amount === null || amount === undefined) return "Rp -";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
};

export const formatTime = (timeStr) => {
  if (!timeStr) return "-";
  return timeStr;
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
};

/**
 * Convert datetime-local input value to RFC3339 format
 * Input: "2026-03-20T18:09" 
 * Output: "2026-03-20T18:09:00+07:00"
 */
export const toRFC3339 = (datetimeLocal, timezoneOffsetMinutes = -420) => {
  if (!datetimeLocal) return null;
  
  // Parse the datetime-local value (format: "2026-03-20T18:09")
  const [datePart, timePart] = datetimeLocal.split("T");
  
  // Ensure time has seconds
  let timeWithSeconds = timePart;
  if (timePart && timePart.split(":").length === 2) {
    timeWithSeconds = `${timePart}:00`;
  }
  
  // Calculate timezone offset
  const offsetHours = Math.floor(Math.abs(timezoneOffsetMinutes) / 60);
  const offsetMinutes = Math.abs(timezoneOffsetMinutes) % 60;
  const offsetSign = timezoneOffsetMinutes <= 0 ? "+" : "-"; // Negative means ahead of UTC (e.g., +07:00)
  const offsetStr = `${offsetSign}${String(offsetHours).padStart(2, "0")}:${String(offsetMinutes).padStart(2, "0")}`;
  
  return `${datePart}T${timeWithSeconds}${offsetStr}`;
};
