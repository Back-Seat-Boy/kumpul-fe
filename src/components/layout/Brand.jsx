import { Link } from "react-router-dom";

export const Brand = ({
  to = "/",
  className = "",
  compact = false,
}) => {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-2 text-gray-900 ${className}`}
    >
      <img
        src="/kumpul-mark.svg"
        alt="kumpul"
        className="h-8 w-8 shrink-0 rounded-lg"
      />
      {!compact && (
        <span className="text-lg font-semibold tracking-tight text-green-600">
          kumpul
        </span>
      )}
    </Link>
  );
};

export default Brand;
