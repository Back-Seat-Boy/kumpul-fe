import { useState } from "react";

export const Avatar = ({ src, name, size = "md", className = "" }) => {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
    xl: "w-12 h-12 text-lg",
  };

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  // Show fallback if no src or image failed to load
  if (!src || imageError) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full bg-green-100 text-green-700 flex items-center justify-center font-medium ${className}`}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name || "Avatar"}
      className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      onError={() => setImageError(true)}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
    />
  );
};

export default Avatar;
