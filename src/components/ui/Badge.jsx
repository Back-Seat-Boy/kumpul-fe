const variants = {
  // Event status badges
  voting: "bg-blue-100 text-blue-700",
  confirmed: "bg-purple-100 text-purple-700",
  open: "bg-green-100 text-green-700",
  payment_open: "bg-amber-100 text-amber-700",
  completed: "bg-gray-100 text-gray-500",
  // Payment status badges
  pending: "bg-gray-100 text-gray-500",
  claimed: "bg-yellow-100 text-yellow-700",
};

export const Badge = ({ children, variant = "pending", className = "" }) => {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  const variantClasses = variants[variant] || variants.pending;

  return (
    <span className={`${baseClasses} ${variantClasses} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
