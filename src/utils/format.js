export const formatRupiah = (amount) => {
  if (amount === null || amount === undefined) return "Rp -";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// Format number with thousand separators (dots) for display
export const formatNumberWithDots = (value) => {
  if (!value && value !== 0) return "";
  const num = typeof value === "string" ? parseInt(value.replace(/\./g, ""), 10) : value;
  if (isNaN(num)) return "";
  return num.toLocaleString("id-ID");
};

// Remove thousand separators (dots) before sending to API
export const unformatNumber = (value) => {
  if (!value) return "";
  return value.toString().replace(/\./g, "");
};

// Format balance message from backend to add thousand separators
// Example: "Event owner needs Rp 300000 more" -> "Event owner needs Rp 300.000 more"
export const formatBalanceMessage = (message) => {
  if (!message) return "";
  
  // Find all numbers after "Rp " and format them
  return message.replace(/Rp\s+(\d+)/g, (match, number) => {
    const formatted = parseInt(number, 10).toLocaleString("id-ID");
    return `Rp ${formatted}`;
  });
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

export const formatBackendTimestamp = (timestamp) => {
  if (!timestamp) return "-";

  const match = timestamp.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/,
  );

  if (!match) return timestamp;

  const [, year, month, day, hour, minute] = match;
  const utcDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  const weekday = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    timeZone: "UTC",
  }).format(utcDate);
  const monthName = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    timeZone: "UTC",
  }).format(utcDate);

  return `${weekday}, ${Number(day)} ${monthName} ${year} ${hour}:${minute}`;
};

export const toRFC3339 = (datetimeLocal, timezoneOffsetMinutes = -420) => {
  if (!datetimeLocal) return null;
  
  const [datePart, timePart] = datetimeLocal.split("T");
  
  let timeWithSeconds = timePart;
  if (timePart && timePart.split(":").length === 2) {
    timeWithSeconds = `${timePart}:00`;
  }
  
  const offsetHours = Math.floor(Math.abs(timezoneOffsetMinutes) / 60);
  const offsetMinutes = Math.abs(timezoneOffsetMinutes) % 60;
  const offsetSign = timezoneOffsetMinutes <= 0 ? "+" : "-";
  const offsetStr = `${offsetSign}${String(offsetHours).padStart(2, "0")}:${String(offsetMinutes).padStart(2, "0")}`;
  
  return `${datePart}T${timeWithSeconds}${offsetStr}`;
};
