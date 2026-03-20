import { Loader2 } from "lucide-react";

const variants = {
  primary: "bg-green-600 hover:bg-green-700 text-white",
  secondary: "border border-gray-300 text-gray-700 hover:bg-gray-50",
  danger: "bg-red-500 hover:bg-red-600 text-white",
  ghost: "text-gray-600 hover:bg-gray-100",
};

export const Button = ({
  children,
  variant = "primary",
  type = "button",
  loading = false,
  disabled = false,
  className = "",
  onClick,
  ...props
}) => {
  const baseClasses =
    "px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  const variantClasses = variants[variant] || variants.primary;

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};

export default Button;
